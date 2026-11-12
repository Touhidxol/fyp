import mongoose from "mongoose";
import { LANGUAGE_IDS, MAX_TESTS_PER_PROBLEM } from "../config/coding.js";

// ---------- coding question pieces ----------

const testCaseSchema = new mongoose.Schema(
    {
        input: { type: String, default: "", maxlength: 10000 },          // stdin
        expectedOutput: { type: String, default: "", maxlength: 10000 }, // stdout
        explanation: { type: String, default: "" }                       // only shown for samples
    },
    { _id: false }
);

const starterCodeSchema = new mongoose.Schema(
    {
        language: { type: String, enum: LANGUAGE_IDS, required: true },
        code: { type: String, default: "" }
    },
    { _id: false }
);

const codingSchema = new mongoose.Schema(
    {
        inputFormat: { type: String, default: "" },
        outputFormat: { type: String, default: "" },
        constraints: { type: String, default: "" },

        allowedLanguages: {
            type: [String],
            enum: LANGUAGE_IDS,
            default: () => [...LANGUAGE_IDS],
            validate: {
                validator: (v) => v.length > 0,
                message: "At least one language is required"
            }
        },

        // an array (not a Map) so it serialises to JSON without surprises
        starterCode: { type: [starterCodeSchema], default: [] },

        // Visible to the student. Run executes these; Submit executes samples + hidden.
        samples: {
            type: [testCaseSchema],
            default: [],
            validate: {
                validator: (v) => v.length >= 1,
                message: "At least one sample test is required"
            }
        },

        // Never leave the server
        hiddenTests: {
            type: [testCaseSchema],
            default: [],
            validate: {
                validator: function (v) {
                    return (this.samples?.length ?? 0) + v.length <= MAX_TESTS_PER_PROBLEM;
                },
                message: `A problem can have at most ${MAX_TESTS_PER_PROBLEM} tests in total`
            }
        },

        // Optional. Step 5 can use it to verify AI-generated expected outputs.
        // Never leave the server.
        referenceSolution: {
            language: { type: String, enum: LANGUAGE_IDS },
            code: { type: String, default: "" }
        }
    },
    { _id: false }
);

// ---------- existing schemas ----------

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
        explanation: { type: String, default: "" },

        coding: {
            type: codingSchema,
            default: undefined,
            required: [
                function () {
                    return this.type === "coding";
                },
                "A coding question needs a coding block"
            ]
        }
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