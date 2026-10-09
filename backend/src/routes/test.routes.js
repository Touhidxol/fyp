import express from "express";
import { listAll, getOne, remove } from "../controllers/test.controller.js";

const router = express.Router();

router.get("/", listAll);
router.get("/:id", getOne);
router.delete("/:id", remove);

export default router;