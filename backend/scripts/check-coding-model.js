import mongoose from "mongoose";
import Test from "../src/models/Test.js";
import { toExamTest } from "../src/services/attempt.service.js";

const t = new Test({
    userId: new mongoose.Types.ObjectId(),
    notebookId: new mongoose.Types.ObjectId(),
    title: "t",
    query: "q",
    totalMarks: 10,
    sections: [{
        title: "Coding",
        marks: 10,
        questions: [{
            question: "Add two integers",
            type: "coding",
            marks: 10,
            coding: {
                samples: [{ input: "1 2\n", expectedOutput: "3\n" }],
                hiddenTests: [{ input: "5 7\n", expectedOutput: "12\n" }],
                referenceSolution: { language: "python", code: "print(12)" }
            }
        }]
    }]
});

console.log("validation:", t.validateSync()?.message ?? "OK");
console.log(JSON.stringify(toExamTest(t).sections[0].questions[0], null, 2));