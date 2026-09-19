import { Router } from "express";
import { analyzeDeal } from "../controllers/dealAnalyzer.controller.js";
import { authRequired } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authRequired);

router.post("/analyze", analyzeDeal);

export default router;
