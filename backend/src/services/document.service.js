import fs from "fs";
import mongoose from "mongoose";
import Notebook from "../models/Notebook.js";
import { ingestDocumentToAI, deleteDocumentFromAI } from "./ai.service.js";

// Atomic update of one document inside a notebook (no read-modify-save races)
const setDocumentFields = (notebookId, documentId, fields) => {
    const $set = {};
    for (const [key, value] of Object.entries(fields)) {
        $set[`documents.$.${key}`] = value;
    }
    return Notebook.updateOne(
        { _id: notebookId, "documents._id": documentId },
        { $set }
    );
};

export const addDocument = async ({ notebookId, userId, file }) => {
    // Generate the _id ourselves so we know it without re-reading the notebook.
    // This same value is what the ai-service stores in Qdrant as document_id.
    const documentId = new mongoose.Types.ObjectId();

    const document = {
        _id: documentId,
        name: file.originalname,
        path: file.path,
        status: "processing"
    };

    await Notebook.updateOne(
        { _id: notebookId, userId },
        { $push: { documents: document } }
    );

    return document;
};

// Runs in the background after the HTTP response has been sent
export const processDocument = async ({ notebookId, userId, document }) => {
    let fields;

    try {
        const result = await ingestDocumentToAI({
            filePath: document.path,
            originalName: document.name,
            userId,
            notebookId,
            documentId: document._id
        });
        fields = {
            status: "ready",
            pages: result.pages,
            chunks: result.chunks,
            error: ""
        };
    } catch (err) {
        fields = { status: "failed", error: err.message };
    }

    try {
        await setDocumentFields(notebookId, document._id, fields);
    } catch (err) {
        console.error("Failed to update document status:", err.message);
    }
};

export const removeDocument = async ({ notebookId, documentId, userId }) => {
    const notebook = await Notebook.findOne({ _id: notebookId, userId });
    const document = notebook?.documents.id(documentId);
    if (!document) return null;

    if (document.status === "processing") {
        const e = new Error("Document is still processing. Try again in a moment.");
        e.status = 409;
        throw e;
    }

    // Chunks first: if the ai-service is down we keep the record so the user can retry
    await deleteDocumentFromAI(document._id);

    await Notebook.updateOne(
        { _id: notebookId },
        { $pull: { documents: { _id: document._id } } }
    );
    await fs.promises.unlink(document.path).catch(() => {});

    return document;
};