import multer from "multer";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

export const MAX_FILE_MB = Number(process.env.MAX_FILE_MB || 25); // keep equal to the ai-service limit

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(process.cwd(), "uploads", req.user.id);
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    // never trust the client's filename on disk
    filename: (req, file, cb) => cb(null, `${randomUUID()}.pdf`)
});

const upload = multer({
    storage,
    limits: { fileSize: MAX_FILE_MB * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const isPdf =
            file.mimetype === "application/pdf" &&
            file.originalname.toLowerCase().endsWith(".pdf");
        cb(isPdf ? null : new Error("Only PDF files are allowed"), isPdf);
    }
});

// Wrapper so multer errors become clean JSON responses
export const uploadPdf = (req, res, next) => {
    upload.single("file")(req, res, (err) => {
        if (!err) return next();

        const tooBig = err.code === "LIMIT_FILE_SIZE";
        res.status(tooBig ? 413 : 400).json({
            success: false,
            message: tooBig ? `File is larger than ${MAX_FILE_MB} MB` : err.message
        });
    });
};