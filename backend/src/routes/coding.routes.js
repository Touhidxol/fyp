import express from "express";
import { isCompilerConfigured } from "../services/compiler.service.js";
import { LANGUAGES } from "../config/coding.js";

const router = express.Router();

router.get("/status", (req, res) => {
    res.json({
        success: true,
        available: isCompilerConfigured(),
        languages: Object.entries(LANGUAGES).map(([id, { label }]) => ({ id, label }))
    });
});

export default router;