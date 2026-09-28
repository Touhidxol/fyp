import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import notebookRoutes from "./routes/notebook.routes.js";

const app = express();

app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.use("/api/notebooks", notebookRoutes);

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "Backend is running"
    });
});

export default app;