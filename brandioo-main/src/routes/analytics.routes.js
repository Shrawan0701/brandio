import express from "express";
import {authRequired} from "../middlewares/auth.middleware.js";
import { analytics, exportCSV } from "../controllers/analytics.controller.js";

const router = express.Router();

router.get("/", authRequired, analytics);
router.get("/export", authRequired, exportCSV);

export default router;
