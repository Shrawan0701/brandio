import { Router } from "express";
import {
  createPublicInquiry,
  getCreatorPage,
  listInquiries,
  updateInquiry
} from "../controllers/inbound.controller.js";
import { authRequired } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/public/:username", getCreatorPage);
router.post("/public/:username", createPublicInquiry);

router.get("/", authRequired, listInquiries);
router.patch("/:id", authRequired, updateInquiry);

export default router;
