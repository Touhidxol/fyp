import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
    {
        question: { type: String, required: true },
        type: {
            type: String,
            enum: ["mcq", "short_answer", "coding"],
            default: "short_answer"
        },
        marks: { type: Number, required: true },
        difficulty: { type: String, default: "" },
        options: { type: [String], default: [] },
        correctAnswer: { type: String, default: "" },
        explanation: { type: String, default: "" }
    },
    { _id: false }
);

const sectionSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        instructions: { type: String, default: "" },
        marks: { type: Number, required: true },
        questions: { type: [questionSchema], default: [] }
    },
    { _id: false }
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
            required: true,
            index: true
        },
        title: { type: String, required: true },
        query: { type: String, required: true },
        subject: { type: String, default: "" },
        topic: { type: String, default: "" },
        instructions: { type: [String], default: [] },
        duration: { type: Number, default: null },
        totalMarks: { type: Number, required: true },
        questionCount: { type: Number, default: 0 },
        sections: { type: [sectionSchema], required: true }
    },
    { timestamps: true }
);

const Test = mongoose.model("Test", testSchema);

export default Test;