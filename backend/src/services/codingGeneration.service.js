import { collectOutputs, CompilerError } from "./compiler.service.js";
import { LANGUAGE_IDS, MAX_TESTS_PER_PROBLEM, CODING_MARKS } from "../config/coding.js";
import { starterCodeList } from "../utils/starterCode.js";

const MIN_HIDDEN_TESTS = 3;

// "ran without crashing": the API reports wrong_answer when output differs from
// our (empty) expected output, which is exactly what we expect here
const RAN_OK = new Set(["accepted", "wrong_answer"]);

const tokens = (s) => String(s ?? "").trim().split(/\s+/).filter(Boolean).join(" ");

const usable = (t) => t && RAN_OK.has(t.status) && !t.truncated && t.output.trim() !== "";

// draft (from the ai-service) -> { ok, question } | { ok: false, reason }
const verifyDraft = async (draft) => {
    const inputs = [...draft.samples.map((s) => s.input), ...draft.hidden_inputs];

    const run = await collectOutputs({
        language: "python",
        code: draft.reference_solution,
        inputs
    });

    if (run.compileError) {
        return { ok: false, reason: "the reference solution does not compile" };
    }
    if (run.tests.length !== inputs.length) {
        return { ok: false, reason: "the runner returned an incomplete result" };
    }

    // Samples: the real output must agree with what the model worked out by hand
    for (let i = 0; i < draft.samples.length; i++) {
        const t = run.tests[i];
        if (!usable(t)) {
            return { ok: false, reason: `reference solution failed on sample ${i + 1} (${t?.status})` };
        }
        if (tokens(t.output) !== tokens(draft.samples[i].expected_output)) {
            return { ok: false, reason: `sample ${i + 1} output disagrees with the model's own answer` };
        }
    }

    // Hidden: keep the ones the reference solution handled cleanly
    const hiddenTests = [];
    draft.hidden_inputs.forEach((input, j) => {
        const t = run.tests[draft.samples.length + j];
        if (usable(t)) hiddenTests.push({ input, expectedOutput: t.output, explanation: "" });
    });
    hiddenTests.splice(MAX_TESTS_PER_PROBLEM - draft.samples.length);

    if (hiddenTests.length < MIN_HIDDEN_TESTS) {
        return { ok: false, reason: `only ${hiddenTests.length} hidden tests survived` };
    }

    return {
        ok: true,
        question: {
            question: `${draft.title}\n\n${draft.statement}`,
            type: "coding",
            marks: CODING_MARKS[draft.difficulty] ?? 10,
            difficulty: draft.difficulty,
            options: [],
            correctAnswer: "",
            explanation: "",
            coding: {
                inputFormat: draft.input_format,
                outputFormat: draft.output_format,
                constraints: draft.constraints,
                allowedLanguages: [...LANGUAGE_IDS],
                starterCode: starterCodeList(),
                samples: draft.samples.map((s, i) => ({
                    input: s.input,
                    expectedOutput: run.tests[i].output, // from running the code, not the model
                    explanation: s.explanation
                })),
                hiddenTests,
                referenceSolution: { language: "python", code: draft.reference_solution }
            }
        }
    };
};

// Verifies drafts one at a time (each is one API request) and stops as soon as
// enough have passed. Runner outages and busy errors stop everything: they
// are not the draft's fault, and retrying the rest would only burn the quota.
export const buildVerifiedCodingQuestions = async (drafts, wanted) => {
    const questions = [];

    for (const draft of drafts) {
        if (questions.length >= wanted) break;

        try {
            const result = await verifyDraft(draft);
            if (result.ok) {
                questions.push(result.question);
            } else {
                console.warn(`Coding draft "${draft.title}" rejected: ${result.reason}`);
            }
        } catch (err) {
            if (err instanceof CompilerError && err.code !== "rejected") throw err;
            console.warn(`Coding draft "${draft.title}" rejected: ${err.message}`);
        }
    }

    return questions;
};