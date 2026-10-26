import razorpay from "../config/razorpay.js";
import pool from "../config/db.js";
import { getPricing, isValidPlanType, PLAN_MONTHS } from "../utils/pricing.js";
import { randomUUID } from "node:crypto";

const paymentError = (message) => Object.assign(new Error(message), { status: 400 });

export const createOrder = async (userId, planType) => {
  const { rows } = await pool.query(
    `SELECT country_code FROM users WHERE id=$1`,
    [userId]
  );

  if (!rows.length) throw paymentError("Account not found");
  const pricing = getPricing(rows[0].country_code, planType);

  const order = await razorpay.orders.create({
    amount: pricing.amount,
    currency: pricing.currency,
    receipt: `br_${randomUUID()}`,
    notes: {
      user_id: userId,
      plan: planType
    }
  });

  return { order, pricing };
};

// Both checkout confirmation and webhooks use the server-created order.
// The lock prevents duplicate deliveries from extending the subscription twice.
export const activateCapturedPayment = async ({ payment, order, userId, planType }) => {
  const ownerId = order?.notes?.user_id;
  const purchasedPlan = order?.notes?.plan;
  if (!ownerId || !isValidPlanType(purchasedPlan)) throw paymentError("Invalid payment order");
  if ((userId && String(ownerId) !== String(userId)) || (planType && purchasedPlan !== planType)) {
    throw paymentError("Payment does not match this account or plan");
  }
  if (!payment?.id || !order.id || payment.order_id !== order.id || payment.status !== "captured" ||
      Number(payment.amount) !== Number(order.amount) || Number(order.amount) <= 0 || payment.currency !== order.currency) {
    throw paymentError("Payment was not captured for the full order amount");
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", [order.id]);
    const existing = await client.query(
      `SELECT id FROM payments
       WHERE (razorpay_payment_id=$1 OR razorpay_order_id=$2) AND status='success'`,
      [payment.id, order.id]
    );
    if (existing.rows.length) {
      await client.query("COMMIT");
      return { userId: ownerId, planType: purchasedPlan, activated: false };
    }
    const updated = await client.query(
      `UPDATE users
       SET plan='pro',
           plan_expiry=GREATEST(COALESCE(plan_expiry, NOW()), NOW()) + make_interval(months => $2::int)
       WHERE id=$1
       RETURNING id`,
      [ownerId, PLAN_MONTHS[purchasedPlan]]
    );
    if (!updated.rows.length) throw paymentError("Account not found");
    await client.query(
      `INSERT INTO payments
       (user_id, razorpay_order_id, razorpay_payment_id, amount, currency, plan, status)
       VALUES ($1,$2,$3,$4,$5,$6,'success')`,
      [ownerId, order.id, payment.id, payment.amount / 100, payment.currency, purchasedPlan]
    );
    await client.query("COMMIT");
    return { userId: ownerId, planType: purchasedPlan, activated: true };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};
