import axios from "axios";

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