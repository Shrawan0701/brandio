import { Router } from "express";
import {
  getMediaKit,
  getPublicMediaKit,
  updateMediaKit
} from "../controllers/mediaKit.controller.js";
import { authRequired } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/public/:username", getPublicMediaKit);
router.get("/", authRequired, getMediaKit);
router.put("/", authRequired, updateMediaKit);

export default router;
