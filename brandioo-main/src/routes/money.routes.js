import { Router } from "express";
import {
  getMoneyCockpit,
  updateMoneySettings
} from "../controllers/money.controller.js";
import { authRequired } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authRequired);

router.get("/", getMoneyCockpit);
router.put("/settings", updateMoneySettings);

export default router;
