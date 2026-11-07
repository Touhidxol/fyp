import mongoose from "mongoose";
import { z } from "zod";
import {
    startAttempt,
    getAttemptWithTest,
    listAttempts,
    saveAnswers,
    submitAttempt,
    runCode
} from "../services/attempt.service.js";
import { CompilerError } from "../services/compiler.service.js";
import { LANGUAGE_IDS, MAX_CODE_CHARS } from "../config/coding.js";

const startSchema = z.object({ testId: z.string() });

const answersSchema = z.object({
    answers: z
        .array(
            z.object({
                sectionIndex: z.number().int().min(0),
                questionIndex: z.number().int().min(0),
                answer: z.string().max(MAX_CODE_CHARS), // code can be long
                language: z.string().max(20).optional() // coding answers only
            })
        )
        .max(200)
});

const runSchema = z.object({
    sectionIndex: z.number().int().min(0),
    questionIndex: z.number().int().min(0),
    language: z.enum(LANGUAGE_IDS),
    code: z.string().max(MAX_CODE_CHARS)
});

// Compiler errors carry a machine-readable `code` (busy, rate_limited,
// not_configured, ...) so the UI can react. Retry-After is set for 429s.
const fail = (res, error) => {
    if (error.retryAfter) res.set("Retry-After", String(Math.ceil(error.retryAfter)));
    res.status(error.status || 500).json({
        success: false,
        message: error.message,
        code: error instanceof CompilerError ? error.code : undefined,
        retryAfter: error.retryAfter
    });
};

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

export const run = async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return badId(res);
    const parsed = runSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ success: false, message: "Invalid run request" });
    }
    try {
        const result = await runCode(req.params.id, req.user.id, parsed.data);
        res.json({ success: true, result });
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