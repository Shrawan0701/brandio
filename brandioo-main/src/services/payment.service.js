import razorpay from "../config/razorpay.js";
import pool from "../config/db.js";
import { getPricing } from "../utils/pricing.js";

export const createOrder = async (userId, planType) => {
  const { rows } = await pool.query(
    `SELECT country_code FROM users WHERE id=$1`,
    [userId]
  );

  const pricing = getPricing(rows[0].country_code, planType);

  const order = await razorpay.orders.create({
    amount: pricing.amount,
    currency: pricing.currency,
    receipt: `br_${Date.now()}`,
    notes: {
      user_id: userId,
      plan: planType
    }
  });

  return { order, pricing };
};

export const savePayment = async ({
  userId,
  orderId,
  paymentId,
  amount,
  currency,
  plan,
  status
}) => {
  await pool.query(
    `INSERT INTO payments
     (user_id, razorpay_order_id, razorpay_payment_id, amount, currency, plan, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [userId, orderId, paymentId, amount, currency, plan, status]
  );
};

export const upgradeUserPlan = async (userId, planType) => {
  const expiry =
    planType === "yearly"
      ? "NOW() + INTERVAL '1 year'"
      : "NOW() + INTERVAL '1 month'";

  await pool.query(
    `UPDATE users
     SET plan='pro', plan_expiry=${expiry}
     WHERE id=$1`,
    [userId]
  );
};
