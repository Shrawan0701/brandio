import crypto from "crypto";
import {
  createOrder,
  activateCapturedPayment
} from "../services/payment.service.js";
import { isValidPlanType } from "../utils/pricing.js";
import pool from "../config/db.js";
import razorpay from "../config/razorpay.js";
import { sendPaymentActivatedEmail } from "../services/email.service.js";
import { createNotificationOnce } from "../services/notification.service.js";

const announceActivation = ({ user, planType, payment }) => {
  createNotificationOnce({
    userId: user.id,
    eventKey: `subscription:${payment.id}:payment_success`,
    type: "subscription_payment_success",
    title: "Plan activated",
    message: `Your PRO ${planType} plan is now active.`,
    entityType: "subscription",
    actionUrl: "/billing",
    metadata: { planType, paymentId: payment.id }
  }).catch(() => {});

  sendPaymentActivatedEmail({
    to: user.email,
    username: user.username,
    planType,
    planExpiry: user.plan_expiry,
    amount: payment.amount / 100,
    currency: payment.currency,
    userId: user.id
  }).catch(() => {});
};

const getPaymentUser = async (userId) => {
  const { rows } = await pool.query(
    `SELECT id, username, public_slug, email, plan, plan_expiry, country_code,
            profile_image_url, social_links, media_kit_enabled, media_kit
     FROM users WHERE id=$1`,
    [userId]
  );
  return rows[0];
};

export const upgrade = async (req, res) => {
  try {
    const { planType } = req.body;
    const userId = req.user.id;

    if (!isValidPlanType(planType)) {
      return res.status(400).json({ message: "Invalid plan" });
    }

    const { order, pricing } = await createOrder(userId, planType);

    res.json({
      orderId: order.id,
      amount: pricing.amount,
      currency: pricing.currency,
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (err) {
    console.error("UPGRADE ERROR:", err);
    res.status(500).json({ message: "Failed to initiate payment" });
  }
};

export const webhook = async (req, res, next) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const receivedSignature = req.headers["x-razorpay-signature"];
    if (!secret || !Buffer.isBuffer(req.body)) return res.status(400).json({ message: "Webhook is unavailable" });
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(req.body)
      .digest("hex");

    if (!signaturesMatch(expectedSignature, receivedSignature)) {
      return res.status(400).json({ message: "Invalid signature" });
    }

    const event = JSON.parse(req.body.toString());

    if (event.event === "payment.captured" || event.event === "order.paid") {
      const payment = event.payload?.payment?.entity;
      if (!payment?.order_id) return res.json({ received: true });
      const order = await razorpay.orders.fetch(payment.order_id);
      if (!order.notes?.user_id || !isValidPlanType(order.notes?.plan)) return res.json({ received: true });
      const activation = await activateCapturedPayment({ payment, order });
      if (activation.activated) {
        const user = await getPaymentUser(activation.userId);
        if (user) announceActivation({ user, planType: activation.planType, payment });
      }
    }

    res.json({ received: true });
  } catch (err) {
    next(err);
  }
};

const signaturesMatch = (expected, received) => typeof received === "string" &&
  expected.length === received.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received));

export const confirmUpgrade = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { planType, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!isValidPlanType(planType)) {
      return res.status(400).json({ message: "Invalid plan" });
    }

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Missing payment verification details" });
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (!signaturesMatch(expectedSignature, razorpay_signature)) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    const [payment, order] = await Promise.all([
      razorpay.payments.fetch(razorpay_payment_id),
      razorpay.orders.fetch(razorpay_order_id)
    ]);
    const activation = await activateCapturedPayment({ payment, order, userId, planType });

    const user = await getPaymentUser(userId);
    if (activation.activated) announceActivation({ user, planType, payment });

    res.json(user);
  } catch (err) {
    next(err);
  }
};
