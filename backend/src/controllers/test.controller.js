import mongoose from "mongoose";
import { z } from "zod";
import { getNotebookById } from "../services/notebook.service.js";
import {
    createTestForNotebook,
    getNotebookTests,
    getUserTests,
    getTestById,
    deleteTest
} from "../services/test.service.js";

const generateSchema = z.object({
    query: z.string().trim().min(3, "Describe the test you want")
});

const notFound = (res, what) =>
    res.status(404).json({ success: false, message: `${what} not found` });

export const generateForNotebook = async (req, res) => {
    const parsed = generateSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            success: false,
            message: parsed.error.issues[0].message
        });
    }

    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return notFound(res, "Notebook");

    try {
        // ownership check: the notebook must belong to this user
        const notebook = await getNotebookById(id, req.user.id);
        if (!notebook) return notFound(res, "Notebook");

        const test = await createTestForNotebook({
            userId: req.user.id,
            notebookId: notebook._id,
            query: parsed.data.query
        });

        res.status(201).json({ success: true, test });
    } catch (error) {
        res.status(error.status || 500).json({
            success: false,
            message: error.message
        });
    }
};

export const listForNotebook = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return notFound(res, "Notebook");

    try {
        const tests = await getNotebookTests(id, req.user.id);
        res.json({ success: true, tests });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const listAll = async (req, res) => {
    try {
        const tests = await getUserTests(req.user.id);
        res.json({ success: true, tests });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getOne = async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return notFound(res, "Test");

    try {
        const test = await getTestById(req.params.id, req.user.id);
        if (!test) return notFound(res, "Test");
        res.json({ success: true, test });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const remove = async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return notFound(res, "Test");

    try {
        const test = await deleteTest(req.params.id, req.user.id);
        if (!test) return notFound(res, "Test");
        res.json({ success: true, message: "Test deleted" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};