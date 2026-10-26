import { Router } from "express";
import { upgrade, webhook, confirmUpgrade } from "../controllers/payment.controller.js";
import { authRequired } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/upgrade", authRequired, upgrade);

router.post("/webhook", webhook);

router.post("/confirm", authRequired, confirmUpgrade);


export default router;
