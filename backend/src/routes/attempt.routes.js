import express from "express";
import {
    start,
    list,
    getOne,
    autosave,
    run,
    submit
} from "../controllers/attempt.controller.js";

const router = express.Router();

router.post("/", start);
router.get("/", list);
router.get("/:id", getOne);
router.patch("/:id/answers", autosave);
router.post("/:id/run", run);
router.post("/:id/submit", submit);

export default router;