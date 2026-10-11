import "dotenv/config";

import app from "./app.js";
import connectDB from "./config/db.js";
import Notebook from "./models/Notebook.js";

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