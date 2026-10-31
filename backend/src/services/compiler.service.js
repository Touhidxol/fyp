import {
    LANGUAGES,
    MAX_CODE_CHARS,
    TIME_LIMIT_SECONDS,
    CHECKER
} from "../config/coding.js";

// The API allows 60 s per request, so wait a little longer than that
const REQUEST_TIMEOUT_MS = 65 * 1000;

// On the free plan a single 8-test request fills all 8 pending slots, so
// requests must go one at a time. Raise on paid plans.
const MAX_CONCURRENT = Number(process.env.ONLINECOMPILER_CONCURRENCY || 1);

const baseURL = () => process.env.ONLINECOMPILER_URL || "https://api.onlinecompiler.io";

// ---------- errors ----------

// code: not_configured | misconfigured | unreachable | unavailable |
//       busy | rejected | bad_language | failed
// Everything here is safe to show to a student; details go to console.error.
export class CompilerError extends Error {
    constructor(message, { status = 503, code = "unavailable", retryAfter } = {}) {
        super(message);
        this.status = status;
        this.code = code;
        this.retryAfter = retryAfter; // seconds, when the API told us
    }
}

export const isCompilerConfigured = () => Boolean(process.env.ONLINECOMPILER_API_KEY);

// ---------- one-request-at-a-time queue ----------

let active = 0;
const waiting = [];

const acquire = () =>
    new Promise((resolve) => {
        if (active < MAX_CONCURRENT) {
            active++;
            resolve();
        } else {
            waiting.push(resolve);
        }
    });

const release = () => {
    const next = waiting.shift();
    if (next) next(); // hand the slot straight to the next waiter
    else active--;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ---------- the actual HTTP call ----------

const callOnce = async (payload) => {
    let res;
    try {
        res = await fetch(`${baseURL()}/api/run-tests/`, {
            method: "POST",
            headers: {
                Authorization: process.env.ONLINECOMPILER_API_KEY, // no "Bearer"
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
        });
    } catch {
        throw new CompilerError("The code runner is unreachable", {
            status: 503,
            code: "unreachable"
        });
    }

    if (res.status === 429) {
        const header = res.headers.get("retry-after");
        const seconds = header ? Number(header) : NaN;
        throw new CompilerError("The code runner is busy. Try again in a moment.", {
            status: 429,
            code: "busy",
            retryAfter: Number.isFinite(seconds) ? seconds : undefined
        });
    }

    if (res.status === 401 || res.status === 403) {
        console.error("OnlineCompiler.io rejected the API key (HTTP " + res.status + ")");
        throw new CompilerError("The code runner is not available right now", {
            status: 503,
            code: "misconfigured"
        });
    }

    const data = await res.json().catch(() => null);

    if (res.status === 400) {
        // e.g. request over the 60 s budget, code too large
        console.error("OnlineCompiler.io rejected the request:", data?.error);
        throw new CompilerError(data?.error || "The code runner rejected the request", {
            status: 400,
            code: "rejected"
        });
    }

    if (res.status >= 500) {
        throw new CompilerError("The code runner is having problems", {
            status: 503,
            code: "unavailable"
        });
    }

    if (!res.ok || !data) {
        throw new CompilerError("Unexpected response from the code runner", {
            status: 502,
            code: "failed"
        });
    }

    // Host was busy and some tests never started: the API says to retry
    if (data.verdict === "incomplete") {
        throw new CompilerError("The code runner is busy. Try again in a moment.", {
            status: 429,
            code: "busy"
        });
    }

    // We could not run at least one test: don't grade this as a wrong answer
    if (data.tests?.some((t) => t.verdict === "internal_error")) {
        throw new CompilerError("The code runner failed to run your code. Try again.", {
            status: 503,
            code: "unavailable"
        });
    }

    return data;
};

// Slot held for the whole retry loop, so a waiting request can't jump in
const callWithRetry = async (payload, retries) => {
    await acquire();
    try {
        for (let attempt = 0; ; attempt++) {
            try {
                return await callOnce(payload);
            } catch (err) {
                if (err.code !== "busy" || attempt >= retries) throw err;
                const waitSeconds = Math.min(err.retryAfter ?? 1.5 * 2 ** attempt, 10);
                await sleep(waitSeconds * 1000);
            }
        }
    } finally {
        release();
    }
};

// ---------- building the request / reading the response ----------

const toApiTest = (t, hidden) => ({
    input: t.input ?? "",
    expected_output: t.expectedOutput ?? "",
    hidden
});

const buildTests = (coding, includeHidden) => [
    ...coding.samples.map((t) => toApiTest(t, false)),
    ...(includeHidden ? coding.hiddenTests.map((t) => toApiTest(t, true)) : [])
];

// Hidden-ness comes from what WE sent, not from the response, and a hidden
// test only ever contributes its verdict.
const normalize = (data, sentTests) => ({
    verdict: data.verdict,
    score: data.score,
    passed: data.passed,
    total: data.total,
    compileError: data.compile_error ?? null,
    tests: (data.tests ?? []).map((t, i) => {
        const hidden = sentTests[i]?.hidden === true;
        const base = { sample: !hidden, status: t.verdict };
        if (hidden) return base;
        return {
            ...base,
            time: t.time ?? null,
            memory: t.memory ?? null,
            output: t.output ?? "",
            error: t.error ?? "",
            truncated: Boolean(t.truncated)
        };
    })
});

const execute = async ({ language, code, coding, includeHidden, retries }) => {
    if (!isCompilerConfigured()) {
        throw new CompilerError("Code execution is not configured on this server", {
            status: 503,
            code: "not_configured"
        });
    }

    const lang = LANGUAGES[language];
    if (!lang) {
        throw new CompilerError("Unsupported language", { status: 400, code: "bad_language" });
    }
    if (typeof code !== "string" || !code.trim()) {
        throw new CompilerError("Write some code first", { status: 400, code: "rejected" });
    }
    if (code.length > MAX_CODE_CHARS) {
        throw new CompilerError(`Code is longer than ${MAX_CODE_CHARS} characters`, {
            status: 400,
            code: "rejected"
        });
    }

    const tests = buildTests(coding, includeHidden);

    const data = await callWithRetry(
        {
            compiler: lang.compiler,
            code,
            tests,
            time_limit: TIME_LIMIT_SECONDS,
            checker: CHECKER,
            scoring: "percent",
            stop_on_failure: false
        },
        retries
    );

    return normalize(data, tests);
};

// ---------- public API ----------

// "Run" button: sample tests only. Results include the program's output and
// error so the student can see what happened. Fails fast if the runner is busy.
export const runSamples = ({ language, code, coding }) =>
    execute({ language, code, coding, includeHidden: false, retries: 1 });

// "Submit" / grading: samples + hidden tests. Hidden tests only return a status.
// Retries busy responses longer, because a student's marks depend on it.
export const judgeSubmission = ({ language, code, coding }) =>
    execute({ language, code, coding, includeHidden: true, retries: 4 });

const truncate = (s, n) => (s && s.length > n ? s.slice(0, n) + "…" : s || "");

// Result -> what we store on attempt.answers[].judge (see Attempt.js).
// Never contains hidden test data.
export const toJudgeSummary = (result) => {
    const firstError = result.tests.find((t) => t.sample && t.error)?.error;
    return {
        verdict: result.verdict,
        passed: result.passed,
        total: result.total,
        message: truncate(result.compileError || firstError, 2000),
        tests: result.tests.map((t) => ({ sample: t.sample, status: t.status }))
    };
};