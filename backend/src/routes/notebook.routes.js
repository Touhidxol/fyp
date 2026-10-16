import express from "express";
import { create, getAll, getOne, update, remove } from "../controllers/notebook.controller.js";
import { generateForNotebook, listForNotebook } from "../controllers/test.controller.js";
import { uploadPdf } from "../middleware/upload.middleware.js";
import { upload, remove as removeDoc } from "../controllers/document.controller.js";

const router = express.Router();

router.post("/", create);
router.get("/", getAll);
router.get("/:id", getOne);
router.patch("/:id", update);
router.delete("/:id", remove);

router.post("/:id/tests", generateForNotebook);
router.get("/:id/tests", listForNotebook);

router.post("/:id/documents", uploadPdf, upload);
router.delete("/:id/documents/:documentId", removeDoc);

export default router;