import mongoose from "mongoose";

const answerSchema = new mongoose.Schema(
    {
        sectionIndex: { type: Number, required: true },
        questionIndex: { type: Number, required: true },
        answer: { type: String, default: "" },
        isCorrect: { type: Boolean, default: null },
        marksAwarded: { type: Number, default: 0 },
        feedback: { type: String, default: "" },
        gradedBy: { type: String, enum: ["auto", "ai", "none"], default: "none" }
    },
    { _id: false }
);

const attemptSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        testId: { type: mongoose.Schema.Types.ObjectId, ref: "Test", required: true, index: true },
        notebookId: { type: mongoose.Schema.Types.ObjectId, ref: "Notebook", required: true },
        status: { type: String, enum: ["in_progress", "submitted"], default: "in_progress" },
        startedAt: { type: Date, default: Date.now },
        submittedAt: { type: Date, default: null },
        durationMinutes: { type: Number, default: null },
        answers: { type: [answerSchema], default: [] },
        score: { type: Number, default: 0 },
        totalMarks: { type: Number, required: true },
        percentage: { type: Number, default: 0 }
    },
    { timestamps: true }
);

const Attempt = mongoose.model("Attempt", attemptSchema);

export default Attempt;