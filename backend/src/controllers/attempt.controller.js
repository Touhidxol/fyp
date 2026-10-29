import mongoose from "mongoose";
import { z } from "zod";
import {
    startAttempt,
    getAttemptWithTest,
    listAttempts,
    saveAnswers,
    submitAttempt
} from "../services/attempt.service.js";

const startSchema = z.object({ testId: z.string() });

const answersSchema = z.object({
    answers: z
        .array(
            z.object({
                sectionIndex: z.number().int().min(0),
                questionIndex: z.number().int().min(0),
                answer: z.string().max(5000)
            })
        )
        .max(200)
});

const fail = (res, error) =>
    res.status(error.status || 500).json({ success: false, message: error.message });

const badId = (res) =>
    res.status(404).json({ success: false, message: "Attempt not found" });

export const start = async (req, res) => {
    const parsed = startSchema.safeParse(req.body);
    if (!parsed.success || !mongoose.isValidObjectId(parsed.data.testId)) {
        return res.status(400).json({ success: false, message: "A valid testId is required" });
    }
    try {
        const { attempt, test } = await startAttempt(req.user.id, parsed.data.testId);
        res.status(201).json({ success: true, attempt, test });
    } catch (error) {
        fail(res, error);
    }
};

export const list = async (req, res) => {
    try {
        const attempts = await listAttempts(req.user.id);
        res.json({ success: true, attempts });
    } catch (error) {
        fail(res, error);
    }
};

export const getOne = async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return badId(res);
    try {
        const { attempt, test } = await getAttemptWithTest(req.params.id, req.user.id);
        res.json({ success: true, attempt, test });
    } catch (error) {
        fail(res, error);
    }
};

export const autosave = async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return badId(res);
    const parsed = answersSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ success: false, message: "Invalid answers" });
    }
    try {
        await saveAnswers(req.params.id, req.user.id, parsed.data.answers);
        res.json({ success: true });
    } catch (error) {
        fail(res, error);
    }
};

export const submit = async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return badId(res);
    const parsed = answersSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ success: false, message: "Invalid answers" });
    }
    try {
        const attempt = await submitAttempt(req.params.id, req.user.id, parsed.data.answers);
        res.json({ success: true, attempt });
    } catch (error) {
        fail(res, error);
    }
};