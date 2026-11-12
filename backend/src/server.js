import "dotenv/config";

import app from "./app.js";
import connectDB from "./config/db.js";
import Notebook from "./models/Notebook.js";
import Attempt from "./models/Attempt.js";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    await connectDB();

    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
};

startServer();

await Notebook.updateMany(
    { "documents.status": "processing" },
    {
        $set: {
            "documents.$[d].status": "failed",
            "documents.$[d].error": "Processing was interrupted. Please re-upload."
        }
    },
    { arrayFilters: [{ "d.status": "processing" }] }
);

// An exam that was being graded when the server stopped goes back to
// in_progress so the student can submit again.
await Attempt.updateMany({ status: "grading" }, { $set: { status: "in_progress" } });