const pick = (obj, keys) =>
    Object.fromEntries(
        keys.filter((k) => obj[k] !== undefined).map((k) => [k, obj[k]])
    );

const PUBLIC_CODING_FIELDS = [
    "inputFormat",
    "outputFormat",
    "constraints",
    "allowedLanguages",
    "starterCode"
];

// What a student may see of a coding problem: statement, formats,
// starter code and sample tests. Hidden tests and reference solution
// never leave the server; only the hidden count is exposed (for "5/8 passed").
const publicCoding = (coding) => ({
    ...pick(coding, PUBLIC_CODING_FIELDS),
    samples: (coding.samples ?? []).map((s) =>
        pick(s, ["input", "expectedOutput", "explanation"])
    ),
    hiddenTestCount: coding.hiddenTests?.length ?? 0
});

// During the exam: no answers, no explanations, no hidden tests.
export const sanitizeQuestion = (q) => {
    const { correctAnswer, explanation, coding, ...rest } = q;
    return q.type === "coding" && coding
        ? { ...rest, coding: publicCoding(coding) }
        : rest;
};

// After submission: MCQ answers/explanations are revealed as before, but
// coding tests stay hidden, because a test can be attempted again and
// revealed hidden tests would let students hardcode outputs.
export const sanitizeQuestionForReview = (q) => {
    if (q.type !== "coding") return q;
    const { coding, ...rest } = q;
    return { ...rest, coding: coding ? publicCoding(coding) : coding };
};