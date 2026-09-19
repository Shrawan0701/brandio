import { Router } from "express";
import { getBrandRelationships } from "../controllers/brands.controller.js";
import { authRequired } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authRequired);

router.get("/", getBrandRelationships);

export default router;
