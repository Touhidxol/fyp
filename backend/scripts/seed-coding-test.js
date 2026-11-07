import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../src/config/db.js";
import User from "../src/models/User.js";
import Notebook from "../src/models/Notebook.js";
import Test from "../src/models/Test.js";

const email = process.argv[2];
if (!email) {
    console.error("Usage: node scripts/seed-coding-test.js <your account email>");
    process.exit(1);
}

await connectDB();

const user = await User.findOne({ email: email.toLowerCase() });
if (!user) {
    console.error("No user with that email");
    process.exit(1);
}

const notebook = await Notebook.findOne({ userId: user._id });
if (!notebook) {
    console.error("That user has no notebook. Create one first.");
    process.exit(1);
}

const test = await Test.create({
    userId: user._id,
    notebookId: notebook._id,
    title: "Coding smoke test",
    query: "seed",
    subject: "Programming",
    topic: "Basics",
    instructions: ["Read from stdin and write to stdout."],
    duration: 30,
    totalMarks: 12,
    questionCount: 2,
    sections: [
        {
            title: "Warm-up",
            marks: 2,
            questions: [
                {
                    question: "Which keyword defines a function in Python?",
                    type: "mcq",
                    marks: 2,
                    difficulty: "Easy",
                    options: ["func", "def", "function", "lambda"],
                    correctAnswer: "def",
                    explanation: "Python functions are defined with def."
                }
            ]
        },
        {
            title: "Coding",
            marks: 10,
            questions: [
                {
                    question:
                        "Read two integers a and b from one line of input and print their sum.",
                    type: "coding",
                    marks: 10,
                    difficulty: "Easy",
                    coding: {
                        inputFormat: "One line with two integers a and b.",
                        outputFormat: "A single integer: a + b.",
                        constraints: "-10^9 <= a, b <= 10^9",
                        allowedLanguages: ["python", "javascript", "cpp", "java"],
                        starterCode: [
                            { language: "python", code: "# read a and b, print a + b\n" },
                            {
                                language: "javascript",
                                code: "// read stdin, print a + b\nconst input = require('fs').readFileSync(0, 'utf8');\n"
                            },
                            {
                                language: "cpp",
                                code: "#include <iostream>\nusing namespace std;\n\nint main() {\n    return 0;\n}\n"
                            }
                        ],
                        samples: [
                            { input: "1 2\n", expectedOutput: "3\n", explanation: "1 + 2 = 3" },
                            { input: "10 20\n", expectedOutput: "30\n" }
                        ],
                        hiddenTests: [
                            { input: "-5 3\n", expectedOutput: "-2\n" },
                            { input: "0 0\n", expectedOutput: "0\n" },
                            { input: "1000000000 1000000000\n", expectedOutput: "2000000000\n" }
                        ],
                        referenceSolution: {
                            language: "python",
                            code: "a, b = map(int, input().split())\nprint(a + b)\n"
                        }
                    }
                }
            ]
        }
    ]
});

console.log("Created test:", String(test._id));
await mongoose.disconnect();