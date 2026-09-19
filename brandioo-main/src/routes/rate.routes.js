import { Router } from "express";
import { calculateRate, listQuotes, saveQuote } from "../controllers/rate.controller.js";
import { authRequired } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authRequired);

router.post("/calculate", calculateRate);
router.get("/quotes", listQuotes);
router.post("/quotes", saveQuote);

export default router;
