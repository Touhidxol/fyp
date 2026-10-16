import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        path: { type: String, required: true },
        summary: { type: String, default: "" },
        pages: { type: Number, default: 0 },
        chunks: { type: Number, default: 0 },
        error: { type: String, default: "" },
        status: {
            type: String,
            enum: ["uploaded", "processing", "ready", "failed"],
            default: "uploaded"
        }
    },
    {
        timestamps: true,
        toJSON: {
            transform: (doc, ret) => {
                delete ret.path; // hide server filesystem paths
                return ret;
            }
        }
    }
);

const notebookSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        title: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            default: ""
        },

        documents: {
            type: [documentSchema],
            default: []
        },

        summary: {
            type: String,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

const Notebook = mongoose.model("Notebook", notebookSchema);

export default Notebook;