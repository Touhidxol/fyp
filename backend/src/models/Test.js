import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
    {
        question: {
            type: String,
            required: true
        },

        type: {
            type: String,
            enum: ["mcq", "short_answer", "coding"],
            required: true
        },

        marks: {
            type: Number,
            required: true
        },

        options: {
            type: [String],
            default: []
        },

        correctAnswer: {
            type: String,
            default: ""
        },

        explanation: {
            type: String,
            default: ""
        }
    },
    {
        _id: false
    }
);

const sectionSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true
        },

        marks: {
            type: Number,
            required: true
        },

        questions: {
            type: [questionSchema],
            default: []
        }
    },
    {
        _id: false
    }
);

const testSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        notebookId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Notebook",
            default: null
        },

        title: {
            type: String,
            required: true
        },

        query: {
            type: String,
            required: true
        },

        duration: {
            type: Number,
            default: null
        },

        totalMarks: {
            type: Number,
            required: true
        },

        sections: {
            type: [sectionSchema],
            required: true
        }
    },
    {
        timestamps: true
    }
);

const Test = mongoose.model("Test", testSchema);

export default Test;