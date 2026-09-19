import crypto from "crypto";
import {
  createOrder,
  savePayment,
  upgradeUserPlan
} from "../services/payment.service.js";
import pool from "../config/db.js";
import razorpay from "../config/razorpay.js";
import { sendPaymentActivatedEmail } from "../services/email.service.js";
import { createNotificationOnce } from "../services/notification.service.js";

export const upgrade = async (req, res) => {
  try {
    const { planType } = req.body;
    const userId = req.user.id;

    if (!["monthly", "yearly"].includes(planType)) {
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

export const webhook = async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const receivedSignature = req.headers["x-razorpay-signature"];
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(req.body)
    .digest("hex");

  if (expectedSignature !== receivedSignature) {
    return res.status(400).json({ message: "Invalid signature" });
  }

  const event = JSON.parse(req.body.toString());

  if (event.event === "payment.captured" || event.event === "order.paid") {
    const paymentEntity = event.payload.payment?.entity || event.payload.order?.entity;
    const notes = event.payload.payment?.entity?.notes || event.payload.order?.entity?.notes;

    if (!notes?.user_id || !notes?.plan) {
      return res.json({ received: true });
    }

    if (event.payload.payment?.entity) {
      await savePayment({
        userId: notes.user_id,
        orderId: paymentEntity.order_id,
        paymentId: paymentEntity.id,
        amount: paymentEntity.amount / 100,
        currency: paymentEntity.currency,
        plan: notes.plan,
        status: "success"
      });
    }

    await upgradeUserPlan(notes.user_id, notes.plan);
  }

  res.json({ received: true });
};

export const confirmUpgrade = async (req, res) => {
  const userId = req.user.id;
  const { planType, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!["monthly", "yearly"].includes(planType)) {
    return res.status(400).json({ message: "Invalid plan" });
  }

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ message: "Missing payment verification details" });
  }

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ message: "Payment verification failed" });
  }

  const payment = await razorpay.payments.fetch(razorpay_payment_id);
  if (payment.order_id !== razorpay_order_id || payment.status !== "captured") {
    return res.status(400).json({ message: "Payment was not captured" });
  }

  await upgradeUserPlan(userId, planType);
  await savePayment({
    userId,
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    amount: payment.amount / 100,
    currency: payment.currency,
    plan: planType,
    status: "success"
  }).catch(() => null);

  const { rows } = await pool.query(
    `SELECT id, username, public_slug, email, plan, plan_expiry, country_code,
            profile_image_url, social_links, media_kit_enabled, media_kit
     FROM users WHERE id=$1`,
    [userId]
  );

  const user = rows[0];
  createNotificationOnce({
    userId,
    eventKey: `subscription:${razorpay_payment_id}:payment_success`,
    type: "subscription_payment_success",
    title: "Plan activated",
    message: `Your PRO ${planType} plan is now active.`,
    entityType: "subscription",
    actionUrl: "/billing",
    metadata: {
      planType,
      paymentId: razorpay_payment_id
    }
  }).catch(() => {});

  sendPaymentActivatedEmail({
    to: user.email,
    username: user.username,
    planType,
    planExpiry: user.plan_expiry,
    amount: payment.amount / 100,
    currency: payment.currency,
    userId
  }).catch(() => {});

  res.json(user);
};
