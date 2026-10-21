import Notebook from "../models/Notebook.js";
import Test from "../models/Test.js";
import fs from "fs";
import { deleteNotebookFromAI } from "./ai.service.js";
import Attempt from "../models/Attempt.js";

export const createNotebook = async (data) => {
    return await Notebook.create(data);
};

export const getUserNotebooks = async (userId) => {
    return await Notebook.find({ userId }).sort({ createdAt: -1 });
};

export const getNotebookById = async (notebookId, userId) => {
    return await Notebook.findOne({
        _id: notebookId,
        userId
    });
};

export const updateNotebook = async (notebookId, userId, data) => {
    return await Notebook.findOneAndUpdate(
        {
            _id: notebookId,
            userId
        },
        {
            $set: data
        },
        {
            new: true,
            runValidators: true
        }
    );
};

export const deleteNotebook = async (notebookId, userId) => {
    const notebook = await Notebook.findOneAndDelete({ _id: notebookId, userId });
    if (notebook) {
        await Test.deleteMany({ notebookId, userId });
        await Attempt.deleteMany({ notebookId, userId });
        await Promise.all(
            notebook.documents.map((d) => fs.promises.unlink(d.path).catch(() => {}))
        );
        await deleteNotebookFromAI(notebookId).catch((e) =>
            console.error("Qdrant cleanup failed:", e.message)
        );
    }
    return notebook;
};
