import express from "express";
import { authRequired } from "../middlewares/auth.middleware.js";
import { intelligence, aiBrief } from "../controllers/intelligence.controller.js";

const router = express.Router();

router.get("/", authRequired, intelligence);
router.get("/brief", authRequired, aiBrief);

export default router;
