import Test from "../models/Test.js";
import { generateTestFromAI } from "./ai.service.js";

// AI output (snake_case) → our Test document
const mapGeneratedTest = (g) => {
    const sections = g.sections.map((s) => ({
        title: s.section_name,
        instructions: s.instructions ?? "",
        marks: s.questions.reduce((sum, q) => sum + q.marks, 0),
        questions: s.questions.map((q) => ({
            question: q.question,
            type: "short_answer",
            marks: q.marks,
            difficulty: q.difficulty,
            correctAnswer: q.answer
        }))
    }));

    return {
        title: g.test_name,
        subject: g.subject ?? "",
        topic: g.topic ?? "",
        instructions: g.instructions ?? [],
        duration: g.duration_minutes,
        // recompute instead of trusting the LLM's arithmetic
        totalMarks: sections.reduce((sum, s) => sum + s.marks, 0),
        questionCount: sections.reduce((n, s) => n + s.questions.length, 0),
        sections
    };
};

export const createTestForNotebook = async ({ userId, notebookId, query }) => {
    const generated = await generateTestFromAI({ notebookId, query });

    return await Test.create({
        userId,
        notebookId,
        query,
        ...mapGeneratedTest(generated)
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

export const deleteTest = async (testId, userId) =>
    await Test.findOneAndDelete({ _id: testId, userId });