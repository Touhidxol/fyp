import fs from "fs";
import mongoose from "mongoose";
import { getNotebookById } from "../services/notebook.service.js";
import {
    addDocument,
    processDocument,
    removeDocument
} from "../services/document.service.js";

const notFound = (res, what) =>
    res.status(404).json({ success: false, message: `${what} not found` });

// multer already wrote the file; remove it if we end up rejecting the request
const discard = (file) => file && fs.promises.unlink(file.path).catch(() => { });

export const upload = async (req, res) => {
    const { id } = req.params;

    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'No file received. Send a PDF in the "file" field.'
        });
    }

    if (!mongoose.isValidObjectId(id)) {
        await discard(req.file);
        return notFound(res, "Notebook");
    }

    try {
        const notebook = await getNotebookById(id, req.user.id);
        if (!notebook) {
            await discard(req.file);
            return notFound(res, "Notebook");
        }

        const document = await addDocument({
            notebookId: notebook._id,
            userId: req.user.id,
            file: req.file
        });

        // 202 Accepted: the file is saved, indexing continues in the background
        res.status(202).json({
            success: true,
            document: { ...document, path: undefined }
        });

        // Deliberately not awaited
        processDocument({
            notebookId: notebook._id,
            userId: req.user.id,
            document
        });
    } catch (error) {
        await discard(req.file);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const remove = async (req, res) => {
    const { id, documentId } = req.params;
    if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(documentId)) {
        return notFound(res, "Document");
    }

    try {
        const document = await removeDocument({
            notebookId: id,
            documentId,
            userId: req.user.id
        });
        if (!document) return notFound(res, "Document");
        res.json({ success: true, message: "Document deleted" });
    } catch (error) {
        res.status(error.status || 500).json({
            success: false,
            message: error.message
        });
    }
};