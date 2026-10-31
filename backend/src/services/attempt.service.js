import Attempt from "../models/Attempt.js";
import Test from "../models/Test.js";
import { gradeAnswersFromAI } from "./ai.service.js";
import { sanitizeQuestion, sanitizeQuestionForReview } from "../utils/codingSanitizer.js";

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

    // Full test (with answers) only after submission
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

export const submitAttempt = async (attemptId, userId, answers) => {
    const attempt = await Attempt.findOne({ _id: attemptId, userId });
    if (!attempt) throw httpError(404, "Attempt not found");
    if (attempt.status === "submitted") throw httpError(409, "Attempt already submitted");

    const test = await Test.findById(attempt.testId);
    if (!test) throw httpError(404, "The test for this attempt was deleted");

    const given = new Map();
    for (const a of answers ?? attempt.answers) {
        given.set(keyOf(a.sectionIndex, a.questionIndex), a.answer);
    }

    const results = [];
    const needsAI = []; // short answers

    test.sections.forEach((sec, si) => {
        sec.questions.forEach((q, qi) => {
            const answer = String(given.get(keyOf(si, qi)) ?? "").trim();
            const r = {
                sectionIndex: si,
                questionIndex: qi,
                answer,
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
            } else {
                needsAI.push({ r, q });
            }
            results.push(r);
        });
    });

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
    attempt.score = score;
    attempt.totalMarks = test.totalMarks;
    attempt.percentage = test.totalMarks
        ? Math.round((score / test.totalMarks) * 1000) / 10
        : 0;
    attempt.status = "submitted";
    attempt.submittedAt = new Date();
    await attempt.save();

    return attempt;
};