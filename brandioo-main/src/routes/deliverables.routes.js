import { Router } from "express";
import {
  createDeliverable,
  deleteDeliverable,
  listDealDeliverables,
  listDeliverables,
  updateDeliverable
} from "../controllers/deliverables.controller.js";
import { authRequired } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authRequired);

router.get("/", listDeliverables);
router.get("/deal/:dealId", listDealDeliverables);
router.post("/deal/:dealId", createDeliverable);
router.put("/:id", updateDeliverable);
router.delete("/:id", deleteDeliverable);

export default router;
