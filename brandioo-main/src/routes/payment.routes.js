import { Router } from "express";
import { upgrade, webhook, confirmUpgrade } from "../controllers/payment.controller.js";
import { authRequired } from "../middlewares/auth.middleware.js";
import bodyParser from "body-parser";

const router = Router();

router.post("/upgrade", authRequired, upgrade);

router.post(
  "/webhook",
  bodyParser.raw({ type: "application/json" }),
  webhook
);

router.post("/confirm", authRequired, confirmUpgrade);


export default router;
