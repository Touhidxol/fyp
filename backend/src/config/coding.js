// Our language ids -> OnlineCompiler.io compiler ids
export const LANGUAGES = {
    python: { label: "Python 3", compiler: "python-3.14" },
    javascript: { label: "JavaScript (Node 24)", compiler: "nodejs-24" },
    cpp: { label: "C++ (g++ 15)", compiler: "g++-15" },
    java: { label: "Java (OpenJDK 25)", compiler: "openjdk-25" }
};

export const LANGUAGE_IDS = Object.keys(LANGUAGES);

// Free plan: max 8 tests per request. Capping a problem at 8 total tests
// (samples + hidden) means a submit is always exactly one API request.
export const MAX_TESTS_PER_PROBLEM = 8;

export const MAX_CODE_CHARS = 20000;

// Seconds each test may run (API default is 2, max 30).
export const TIME_LIMIT_SECONDS = 2;

// How output is compared: trim | exact | tokens | float | rows.
// "tokens" ignores spacing and line breaks, which is fairer for students and
// safer for AI-written expected outputs. Use "trim" for stricter, Judge0-style
// comparison.
export const CHECKER = "tokens";