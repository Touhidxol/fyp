import {
    createNotebook,
    getUserNotebooks,
    getNotebookById,
    updateNotebook,
    deleteNotebook
} from "../services/notebook.service.js";

export const create = async (req, res) => {
    try {
        const { userId, title, description } = req.body;

        const notebook = await createNotebook({
            userId,
            title,
            description
        });

        res.status(201).json({
            success: true,
            notebook
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const getAll = async (req, res) => {
    try {
        const notebooks = await getUserNotebooks(req.query.userId);

        res.json({
            success: true,
            notebooks
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const getOne = async (req, res) => {
    try {
        const notebook = await getNotebookById(
            req.params.id,
            req.query.userId
        );

        if (!notebook) {
            return res.status(404).json({
                success: false,
                message: "Notebook not found"
            });
        }

        res.json({
            success: true,
            notebook
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const update = async (req, res) => {
    try {
        const { title, description } = req.body;

        const notebook = await updateNotebook(
            req.params.id,
            req.body.userId,
            { title, description }
        );

        if (!notebook) {
            return res.status(404).json({
                success: false,
                message: "Notebook not found"
            });
        }

        res.json({
            success: true,
            notebook
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const remove = async (req, res) => {
    try {
        const notebook = await deleteNotebook(
            req.params.id,
            req.query.userId
        );

        if (!notebook) {
            return res.status(404).json({
                success: false,
                message: "Notebook not found"
            });
        }

        res.json({
            success: true,
            message: "Notebook deleted"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
