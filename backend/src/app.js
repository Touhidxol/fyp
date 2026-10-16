import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
import notebookRoutes from "./routes/notebook.routes.js";
import testRoutes from "./routes/test.routes.js";
import { auth } from "./middleware/auth.middleware.js";

const app = express();

app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/notebooks", auth, notebookRoutes);
app.use("/api/tests", auth, testRoutes);

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "Backend is running"
    });
});

export default app;