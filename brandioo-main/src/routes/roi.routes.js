import { Router } from "express";
import { getRoi } from "../controllers/roi.controller.js";
import { authRequired } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(authRequired);
router.get("/", getRoi);

export default router;
