import axios from "axios";
import fs from "fs";

export const generateTestFromAI = async ({ notebookId, query }) => {
    const baseURL = process.env.AI_SERVICE_URL || "http://localhost:8000";

    try {
        const { data } = await axios.post(
            `${baseURL}/generate-test`,
            { notebook_id: notebookId, query },
            { timeout: 120000 } // Gemini can take a while
        );
        return data;
    } catch (err) {
        if (err.response) {
            const e = new Error(
                err.response.data?.detail || "AI service error"
            );
            e.status = err.response.status === 404 ? 404 : 502;
            throw e;
        }
        const e = new Error("AI service is unreachable");
        e.status = 503;
        throw e;
    }
};

const aiBaseURL = () => process.env.AI_SERVICE_URL || "http://localhost:8000";

const aiError = async (res) => {
    const body = await res.json().catch(() => ({}));
    const e = new Error(
        typeof body.detail === "string" ? body.detail : "AI service error"
    );
    e.status = res.status;
    return e;
};

const unreachable = () => {
    const e = new Error("AI service is unreachable");
    e.status = 503;
    return e;
};

export const ingestDocumentToAI = async ({
    filePath, originalName, userId, notebookId, documentId
}) => {
    const form = new FormData();
    form.append(
        "file",
        new Blob([await fs.promises.readFile(filePath)], { type: "application/pdf" }),
        originalName
    );
    form.append("user_id", String(userId));
    form.append("notebook_id", String(notebookId));
    form.append("document_id", String(documentId));
    form.append("document_name", originalName);

    let res;
    try {
        res = await fetch(`${aiBaseURL()}/ingest`, {
            method: "POST",
            body: form,                               // fetch sets the multipart boundary itself
            signal: AbortSignal.timeout(10 * 60 * 1000) // embedding big PDFs is slow
        });
    } catch {
        throw unreachable();
    }

    if (!res.ok) throw await aiError(res);
    return await res.json(); // { document_id, pages, chunks }
};

export const deleteDocumentFromAI = async (documentId) => {
    let res;
    try {
        res = await fetch(`${aiBaseURL()}/documents/${documentId}`, { method: "DELETE" });
    } catch {
        throw unreachable();
    }
    if (!res.ok) throw await aiError(res);
};

export const deleteNotebookFromAI = async (notebookId) => {
    let res;
    try {
        res = await fetch(`${aiBaseURL()}/notebooks/${notebookId}`, { method: "DELETE" });
    } catch {
        throw unreachable();
    }
    if (!res.ok) throw await aiError(res);
};