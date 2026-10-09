import Notebook from "../models/Notebook.js";
import Test from "../models/Test.js";

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
    if (notebook) await Test.deleteMany({ notebookId, userId });
    return notebook;
};
