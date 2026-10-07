import express from "express";
import { register, login, me, logout } from "../controllers/auth.controller.js";
import { auth } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", auth, me);
router.post("/logout", logout);

export default router;