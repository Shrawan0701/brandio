import { Router } from "express";
import multer from "multer";
import { analyzeDeal, extractDealFile } from "../controllers/dealAnalyzer.controller.js";
import { authRequired } from "../middlewares/auth.middleware.js";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }
});

router.use(authRequired);

router.post("/analyze", analyzeDeal);
router.post("/extract-file", upload.single("file"), extractDealFile);

export default router;
