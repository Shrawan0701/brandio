import { Router } from "express";
import {
  createDeal,
  getDeal,
  getDeals,
  updateDeal,
  deleteDeal,
  getDealUploadSignature,
  addDealImage
} from "../controllers/deals.controller.js";
import { authRequired } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authRequired);

router.post("/", createDeal);
router.get("/", getDeals);
router.get("/:id", getDeal);
router.put("/:id", updateDeal);
router.delete("/:id", deleteDeal);
router.get(
  "/:id/upload-signature",
  authRequired,
  getDealUploadSignature
);

router.post(
  "/:id/add-image",
  authRequired,
  addDealImage
);


export default router;
