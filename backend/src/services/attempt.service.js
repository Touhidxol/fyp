import Attempt from "../models/Attempt.js";
import Test from "../models/Test.js";
import { gradeAnswersFromAI } from "./ai.service.js";
import {
    runSamples,
    judgeSubmission,
    toJudgeSummary,
    CompilerError
} from "./compiler.service.js";
import {
    sanitizeQuestion,
    sanitizeQuestionForReview
} from "../utils/codingSanitizer.js";
import { hitLimit } from "../utils/rateLimit.js";
import { RUN_LIMIT_PER_MINUTE } from "../config/coding.js";

const httpError = (status, message) => {
    const e = new Error(message);
    e.status = status;
    return e;
};

const norm = (s) => String(s ?? "").trim().toLowerCase().replace(/\s+/g, " ");
const keyOf = (s, q) => `${s}:${q}`;

// While the exam is running, the student must never receive the answers
export const toExamTest = (test) => {
    const obj = test.toObject();
    obj.sections = obj.sections.map((sec) => ({
        ...sec,
        questions: sec.questions.map(sanitizeQuestion)
    }));
    return obj;
};

// After submission: reveal MCQ answers, still hide coding tests
export const toReviewTest = (test) => {
    const obj = test.toObject();
    obj.sections = obj.sections.map((sec) => ({
        ...sec,
        questions: sec.questions.map(sanitizeQuestionForReview)
    }));
    return obj;
};

export const startAttempt = async (userId, testId) => {
    const test = await Test.findOne({ _id: testId, userId });
    if (!test) throw httpError(404, "Test not found");

    // Resume an unfinished attempt instead of creating a second one
    let attempt = await Attempt.findOne({ userId, testId, status: "in_progress" });
    if (!attempt) {
        attempt = await Attempt.create({
            userId,
            testId,
            notebookId: test.notebookId,
            durationMinutes: test.duration,
            totalMarks: test.totalMarks
        });
    }
    return { attempt, test: toExamTest(test) };
};

export const getAttemptWithTest = async (attemptId, userId) => {
    const attempt = await Attempt.findOne({ _id: attemptId, userId });
    if (!attempt) throw httpError(404, "Attempt not found");

    const test = await Test.findById(attempt.testId);
    if (!test) throw httpError(404, "The test for this attempt was deleted");

    return {
        attempt,
        test: attempt.status === "submitted" ? toReviewTest(test) : toExamTest(test)
    };
};

export const listAttempts = async (userId) =>
    await Attempt.find({ userId })
        .select("-answers")
        .populate("testId", "title questionCount")
        .sort({ createdAt: -1 });

export const saveAnswers = async (attemptId, userId, answers) => {
    const attempt = await Attempt.findOneAndUpdate(
        { _id: attemptId, userId, status: "in_progress" },
        { $set: { answers } },
        { new: true }
    );
    if (!attempt) throw httpError(409, "Attempt not found or already submitted");
    return attempt;
};

// ---------- Run (sample tests only) ----------

export const runCode = async (
    attemptId,
    userId,
    { sectionIndex, questionIndex, language, code }
) => {
    const attempt = await Attempt.findOne({
        _id: attemptId,
        userId,
        status: "in_progress"
    });
    if (!attempt) throw httpError(409, "Attempt not found or already submitted");

    const test = await Test.findById(attempt.testId);
    if (!test) throw httpError(404, "The test for this attempt was deleted");

    const q = test.sections[sectionIndex]?.questions[questionIndex];
    if (!q || q.type !== "coding" || !q.coding) {
        throw httpError(400, "That is not a coding question");
    }
    if (!q.coding.allowedLanguages.includes(language)) {
        throw httpError(400, "That language is not allowed for this question");
    }

    // Protect the shared free-plan quota from one user mashing Run
    const wait = hitLimit(`run:${userId}`, RUN_LIMIT_PER_MINUTE, 60 * 1000);
    if (wait > 0) {
        throw new CompilerError(`Too many runs. Try again in ${wait}s.`, {
            status: 429,
            code: "rate_limited",
            retryAfter: wait
        });
    }

    return await runSamples({ language, code, coding: q.coding });
};

// ---------- Submit ----------

const OUTAGE_CODES = ["not_configured", "misconfigured", "unreachable", "unavailable"];
const UNJUDGED_MESSAGE =
    "The code runner was unavailable, so this answer could not be judged.";

// Saved as "none" so a runner outage never turns into a silent zero
const markUnjudged = (r, message) => {
    r.isCorrect = null;
    r.marksAwarded = 0;
    r.feedback = message;
    r.gradedBy = "none";
    r.judge = { verdict: "unavailable", passed: 0, total: 0, message: "", tests: [] };
};

export const submitAttempt = async (attemptId, userId, answers) => {
    const attempt = await Attempt.findOne({ _id: attemptId, userId });
    if (!attempt) throw httpError(404, "Attempt not found");
    if (attempt.status === "submitted") throw httpError(409, "Attempt already submitted");

    const test = await Test.findById(attempt.testId);
    if (!test) throw httpError(404, "The test for this attempt was deleted");

    const given = new Map();
    for (const a of answers ?? attempt.answers) {
        given.set(keyOf(a.sectionIndex, a.questionIndex), {
            answer: a.answer,
            language: a.language
        });
    }

    const results = [];
    const needsAI = []; // short answers
    const needsJudge = []; // coding answers

    test.sections.forEach((sec, si) => {
        sec.questions.forEach((q, qi) => {
            const entry = given.get(keyOf(si, qi));
            const answer = String(entry?.answer ?? "").trim();
            const r = {
                sectionIndex: si,
                questionIndex: qi,
                answer,
                language: "",
                isCorrect: null,
                marksAwarded: 0,
                feedback: "",
                gradedBy: "none"
            };

            if (!answer) {
                r.isCorrect = false;
                r.feedback = "Not answered";
                r.gradedBy = "auto";
            } else if (q.type === "mcq") {
                r.isCorrect = norm(answer) === norm(q.correctAnswer);
                r.marksAwarded = r.isCorrect ? q.marks : 0;
                r.gradedBy = "auto";
            } else if (q.type === "coding") {
                const language = entry?.language || q.coding?.allowedLanguages?.[0] || "";
                r.language = language;
                if (!q.coding || !q.coding.allowedLanguages.includes(language)) {
                    r.isCorrect = false;
                    r.feedback = "That language is not allowed for this question";
                    r.gradedBy = "auto";
                } else {
                    needsJudge.push({ r, q });
                }
            } else {
                needsAI.push({ r, q });
            }
            results.push(r);
        });
    });

    // Coding: one question at a time. Each request can use all of the free
    // plan's pending slots, so parallel judging would only cause 429s.
    let runnerDown = false;
    for (const { r, q } of needsJudge) {
        if (runnerDown) {
            markUnjudged(r, UNJUDGED_MESSAGE);
            continue;
        }

        try {
            const result = await judgeSubmission({
                language: r.language,
                code: r.answer,
                coding: q.coding
            });

            const ratio = result.total ? result.passed / result.total : 0;
            r.marksAwarded = Math.round(q.marks * ratio * 100) / 100;
            r.isCorrect = result.total > 0 && result.passed === result.total;
            r.feedback = `${result.passed}/${result.total} tests passed`;
            r.gradedBy = "judge";
            r.judge = toJudgeSummary(result);
        } catch (err) {
            console.error("Code judging failed:", err.message);
            if (err instanceof CompilerError && OUTAGE_CODES.includes(err.code)) {
                runnerDown = true; // skip the rest instead of waiting on each
            }
            const userFacing =
                err instanceof CompilerError &&
                    ["rejected", "bad_language"].includes(err.code)
                    ? err.message
                    : UNJUDGED_MESSAGE;
            markUnjudged(r, userFacing);
        }
    }

    // Short answers: AI grading, unchanged
    if (needsAI.length > 0) {
        try {
            const graded = await gradeAnswersFromAI(
                needsAI.map(({ r, q }, i) => ({
                    id: i,
                    question: q.question,
                    correct_answer: q.correctAnswer,
                    marks: q.marks,
                    student_answer: r.answer
                }))
            );
            const byId = new Map(graded.map((g) => [g.id, g]));

            needsAI.forEach(({ r, q }, i) => {
                const g = byId.get(i);
                if (!g) {
                    r.feedback = "Could not be graded automatically";
                    return;
                }
                // never trust the LLM beyond the allowed range
                const marks = Math.min(q.marks, Math.max(0, Number(g.marks_awarded) || 0));
                r.marksAwarded = marks;
                r.isCorrect = marks >= q.marks;
                r.feedback = g.feedback ?? "";
                r.gradedBy = "ai";
            });
        } catch (err) {
            console.error("AI grading failed:", err.message);
            needsAI.forEach(({ r }) => {
                r.feedback = "Could not be graded automatically";
            });
        }
    }

    const score = results.reduce((sum, r) => sum + r.marksAwarded, 0);

    attempt.answers = results;
    attempt.score = Math.round(score * 100) / 100;
    attempt.totalMarks = test.totalMarks;
    attempt.percentage = test.totalMarks
        ? Math.round((score / test.totalMarks) * 1000) / 10
        : 0;
    attempt.status = "submitted";
    attempt.submittedAt = new Date();
    await attempt.save();

    return attempt;
};