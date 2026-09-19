import { Router } from "express";
import { register, login, logout } from "../controllers/auth.controller.js";
import { sendResetOTP, resetPassword } from "../controllers/auth.controller.js";
import { rateLimit } from "../middlewares/security.middleware.js";



const router = Router();

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 12, keyPrefix: "auth" });
const resetLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5, keyPrefix: "password-reset" });

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/forgot-password", resetLimiter, sendResetOTP);
router.post("/reset-password", resetLimiter, resetPassword);

router.post("/logout", logout);

export default router;
