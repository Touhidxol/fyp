import Test from "../models/Test.js";
import { generateTestFromAI } from "./ai.service.js";
import Attempt from "../models/Attempt.js";
import { isCompilerConfigured, CompilerError } from "./compiler.service.js";
import { buildVerifiedCodingQuestions } from "./codingGeneration.service.js";
import { CODING_MINUTES_EACH } from "../config/coding.js";

// AI output (snake_case) + verified coding questions → our Test document
const mapGeneratedTest = (g, codingQuestions = []) => {
    const sections = g.sections.map((s) => ({
        title: s.section_name,
        instructions: s.instructions ?? "",
        marks: s.questions.reduce((sum, q) => sum + q.marks, 0),
        questions: s.questions.map((q) => ({
            question: q.question,
            type: q.type ?? "short_answer",
            marks: q.marks,
            difficulty: q.difficulty,
            options: q.options ?? [],
            correctAnswer: q.answer,
            explanation: q.explanation ?? ""
        }))
    }));

    if (codingQuestions.length > 0) {
        sections.push({
            title: "Coding",
            instructions:
                "Write a program that reads from standard input and prints to standard output. " +
                "Run checks your code on the sample tests; Submit also checks hidden tests.",
            marks: codingQuestions.reduce((sum, q) => sum + q.marks, 0),
            questions: codingQuestions
        });
    }

    return {
        title: g.test_name,
        subject: g.subject ?? "",
        topic: g.topic ?? "",
        instructions: g.instructions ?? [],
        // coding problems need more time than the MCQ-based estimate
        duration:
            typeof g.duration_minutes === "number"
                ? g.duration_minutes + codingQuestions.length * CODING_MINUTES_EACH
                : g.duration_minutes,
        // recompute instead of trusting the LLM's arithmetic
        totalMarks: sections.reduce((sum, s) => sum + s.marks, 0),
        questionCount: sections.reduce((n, s) => n + s.questions.length, 0),
        sections
    };
};

export const createTestForNotebook = async ({
    userId, notebookId, query, numQuestions, difficulty, duration, numCoding = 0
}) => {
    // Fail before spending any Gemini call if coding can't be verified anyway
    if (numCoding > 0 && !isCompilerConfigured()) {
        throw new CompilerError(
            "Coding questions need the code runner, which is not configured on this server",
            { status: 503, code: "not_configured" }
        );
    }

    const generated = await generateTestFromAI({
        notebookId, query, numQuestions, difficulty, duration, numCoding
    });

    let codingQuestions = [];
    if (numCoding > 0) {
        codingQuestions = await buildVerifiedCodingQuestions(
            generated.coding_problems ?? [],
            numCoding
        );

        if (codingQuestions.length === 0) {
            const e = new Error(
                "None of the generated coding problems passed verification. Please try again."
            );
            e.status = 502;
            throw e;
        }
    }

    return await Test.create({
        userId,
        notebookId,
        query,
        ...mapGeneratedTest(generated, codingQuestions)
    });
};

const listFields = "-sections"; // lists don't need every question

export const getNotebookTests = async (notebookId, userId) =>
    await Test.find({ notebookId, userId })
        .select(listFields)
        .sort({ createdAt: -1 });

export const getUserTests = async (userId) =>
    await Test.find({ userId })
        .select(listFields)
        .populate("notebookId", "title")
        .sort({ createdAt: -1 });

export const getTestById = async (testId, userId) =>
    await Test.findOne({ _id: testId, userId });

export const deleteTest = async (testId, userId) => {
    const test = await Test.findOneAndDelete({ _id: testId, userId });
    if (test) await Attempt.deleteMany({ testId, userId });
    return test;
};