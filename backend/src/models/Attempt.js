import mongoose from "mongoose";

// Result of running a coding answer. Counts and statuses only, never test data.
const judgeSchema = new mongoose.Schema(
    {
        // accepted | partial | wrong_answer | runtime_error | compilation_error | unavailable
        verdict: { type: String, default: "" },
        passed: { type: Number, default: 0 },
        total: { type: Number, default: 0 },
        // compiler / runtime message. Truncate in the service before saving.
        message: { type: String, default: "" },
        tests: {
            type: [
                new mongoose.Schema(
                    {
                        sample: { type: Boolean, default: false },
                        status: { type: String, default: "" }
                    },
                    { _id: false }
                )
            ],
            default: []
        }
    },
    { _id: false }
);

const answerSchema = new mongoose.Schema(
    {
        sectionIndex: { type: Number, required: true },
        questionIndex: { type: Number, required: true },
        answer: { type: String, default: "" }, // option text, short answer, or source code
        language: { type: String, default: "" }, // coding answers only
        isCorrect: { type: Boolean, default: null },
        marksAwarded: { type: Number, default: 0 },
        feedback: { type: String, default: "" },
        gradedBy: { type: String, enum: ["auto", "ai", "judge", "none"], default: "none" },
        judge: { type: judgeSchema, default: undefined }
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