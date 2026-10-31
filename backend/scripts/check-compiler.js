import "dotenv/config";
import {
    runSamples,
    judgeSubmission,
    toJudgeSummary,
    isCompilerConfigured,
    CompilerError
} from "../src/services/compiler.service.js";

const coding = {
    samples: [
        { input: "1 2\n", expectedOutput: "3\n" },
        { input: "-4 10\n", expectedOutput: "6\n" }
    ],
    hiddenTests: [{ input: "99 1\n", expectedOutput: "100\n" }]
};

const cases = [
    ["python correct", "python", "a, b = map(int, input().split())\nprint(a + b)"],
    ["python wrong", "python", "a, b = map(int, input().split())\nprint(a - b)"],
    ["cpp compile error", "cpp", "int main() { return 0 }"],
    ["js runtime error", "javascript", "throw new Error('boom')"]
];

console.log("configured:", isCompilerConfigured());

for (const [name, language, code] of cases) {
    const result = await judgeSubmission({ language, code, coding });
    console.log(`\n== ${name} ==`);
    console.log(JSON.stringify(toJudgeSummary(result), null, 2));
    // hidden entries must carry a status and nothing else
    const leak = result.tests.find((t) => !t.sample && Object.keys(t).length > 2);
    console.log("hidden test leaks data:", Boolean(leak));
}

console.log("\n== run samples (python correct) ==");
const run = await runSamples({
    language: "python",
    code: cases[0][2],
    coding
});
console.log(run.tests.map((t) => `${t.status} -> ${JSON.stringify(t.output)}`));

console.log("\n== missing key ==");
const savedKey = process.env.ONLINECOMPILER_API_KEY;
delete process.env.ONLINECOMPILER_API_KEY;
try {
    await runSamples({ language: "python", code: "print(1)", coding });
} catch (err) {
    console.log(err instanceof CompilerError, err.code, err.status, err.message);
}
process.env.ONLINECOMPILER_API_KEY = savedKey;