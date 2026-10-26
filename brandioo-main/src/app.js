import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import "./config/env.js";
import { errorHandler, notFound, rateLimit, securityHeaders } from "./middlewares/security.middleware.js";

/* ROUTES */
import authRoutes from "./routes/auth.routes.js";
import dealsRoutes from "./routes/deals.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import portfolioRoutes from "./routes/portfolio.routes.js";
import contractsRoutes from "./routes/contracts.routes.js";
import inboundRoutes from "./routes/inbound.routes.js";
import mediaKitRoutes from "./routes/mediaKit.routes.js";
import moneyRoutes from "./routes/money.routes.js";
import brandsRoutes from "./routes/brands.routes.js";
import rateRoutes from "./routes/rate.routes.js";
import dealAnalyzerRoutes from "./routes/dealAnalyzer.routes.js";
import deliverablesRoutes from "./routes/deliverables.routes.js";
import intelligenceRoutes from "./routes/intelligence.routes.js";
import roiRoutes from "./routes/roi.routes.js";
import notificationRoutes from "./routes/notifications.routes.js";

const app = express();
const configuredOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = new Set([
  "https://www.brandio.world",
  "https://brandio.world",
  ...configuredOrigins
]);

app.disable("x-powered-by");
app.use(securityHeaders);

/* ✅ SINGLE, CORRECT CORS */
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.has(origin)) return callback(null, true);
      if (process.env.NODE_ENV !== "production" && origin.endsWith(".vercel.app")) return callback(null, true);
      if (
        origin === "http://localhost:5173" ||
        origin === "http://localhost:3000"
      ) return callback(null, true);

      return callback(new Error("CORS not allowed: " + origin));
    },
    credentials: true
  })
);

/* BODY + COOKIES */
// Razorpay signatures are calculated over the exact bytes of the webhook body.
app.use("/api/payments/webhook", express.raw({ type: "application/json", limit: "1mb" }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use(rateLimit({ windowMs: 60_000, max: 180, keyPrefix: "api" }));

// Health check (keep-alive)
const healthCheck = (req, res) => {
  res.status(200).send('OK');
};

app.get('/api/health', healthCheck);


/* ROUTES */
app.use("/api/auth", authRoutes);
app.use("/api/deals", dealsRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/contracts", contractsRoutes);
app.use("/api/inbound", inboundRoutes);
app.use("/api/media-kit", mediaKitRoutes);
app.use("/api/money", moneyRoutes);
app.use("/api/brands", brandsRoutes);
app.use("/api/rate", rateRoutes);
app.use("/api/deal-analyzer", dealAnalyzerRoutes);
app.use("/api/deliverables", deliverablesRoutes);
app.use("/api/intelligence", intelligenceRoutes);
app.use("/api/roi", roiRoutes);
app.use("/api/notifications", notificationRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
