import test from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { getPricing, FREE_DEAL_LIMIT, PLAN_MONTHS } from "../src/utils/pricing.js";
import { assertCheckoutPrice, getDisplayPricing, isFreeDealLimitUsed } from "../../src/utils/pricing.js";

const state = {
  user: { id: "user-1", country_code: "IN", plan: "free", plan_expiry: null, deal_creations_used: 0 },
  payments: [],
  orders: []
};

const pool = {
  async query(sql, args = []) {
    if (sql.includes("SELECT country_code")) return { rows: [state.user] };
    if (sql.includes("SET deal_creations_used = deal_creations_used + 1")) {
      assert.equal(sql.includes("deal_creations_used < $2"), true);
      const paid = state.user.plan === "pro" && (!state.user.plan_expiry || state.user.plan_expiry > new Date());
      if (state.user.id !== args[0] || (!paid && state.user.deal_creations_used >= args[1])) return { rows: [] };
      state.user.deal_creations_used++;
      return { rows: [{ email: "creator@example.test", plan: state.user.plan, deal_creations_used: state.user.deal_creations_used }] };
    }
    throw new Error(`Unexpected pool query: ${sql}`);
  },
  async connect() {
    return {
      async query(sql, args = []) {
        if (sql === "BEGIN" || sql === "COMMIT" || sql === "ROLLBACK" || sql.includes("pg_advisory_xact_lock")) return { rows: [] };
        if (sql.includes("SELECT id FROM payments")) {
          return { rows: state.payments.filter((entry) => entry.paymentId === args[0] || entry.orderId === args[1]) };
        }
        if (sql.includes("UPDATE users")) {
          assert.equal(args[0], state.user.id);
          const start = state.user.plan_expiry && state.user.plan_expiry > new Date()
            ? new Date(state.user.plan_expiry) : new Date();
          start.setUTCMonth(start.getUTCMonth() + args[1]);
          state.user.plan_expiry = start;
          state.user.plan = "pro";
          return { rows: [{ id: state.user.id }] };
        }
        if (sql.includes("INSERT INTO payments")) {
          state.payments.push({ orderId: args[1], paymentId: args[2], amount: args[3], plan: args[5] });
          return { rows: [] };
        }
        throw new Error(`Unexpected transaction query: ${sql}`);
      },
      release() {}
    };
  }
};

const razorpay = {
  orders: {
    async create(options) {
      const order = { ...options, id: `order-${state.orders.length + 1}` };
      state.orders.push(order);
      return order;
    }
  }
};

globalThis.__brandioTestPool = pool;
globalThis.__brandioTestRazorpay = razorpay;
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "../config/db.js") {
      return { url: "data:text/javascript,export default globalThis.__brandioTestPool", shortCircuit: true };
    }
    if (specifier === "../config/razorpay.js") {
      return { url: "data:text/javascript,export default globalThis.__brandioTestRazorpay", shortCircuit: true };
    }
    return nextResolve(specifier, context);
  }
});

const { createOrder, activateCapturedPayment } = await import("../src/services/payment.service.js");
const { reserveDealCreation } = await import("../src/services/deals.service.js");

test("all displayed paid prices match the checkout amounts", () => {
  for (const [country, symbol] of [["IN", "₹"], ["US", "$"]]) {
    const displayed = getDisplayPricing(country);
    for (const plan of Object.keys(PLAN_MONTHS)) {
      const amount = Number(displayed[plan].replaceAll(/[₹$,]/g, ""));
      assert.equal(getPricing(country, plan).amount, amount * 100);
      assert.doesNotThrow(() => assertCheckoutPrice(country, plan, getPricing(country, plan)));
      assert.ok(displayed[plan].startsWith(symbol));
    }
  }
});

test("checkout rejects an API still serving old prices", () => {
  assert.throws(() => assertCheckoutPrice("IN", "yearly", { amount: 49900, currency: "INR" }), /out of date/);
  assert.throws(() => assertCheckoutPrice("IN", "quarterly", { amount: 119900, currency: "USD" }), /out of date/);
  assert.throws(() => assertCheckoutPrice("US", "monthly", { amount: 500, currency: "USD" }), /out of date/);
});

test("free accounts get one lifetime deal, even after deleting it", async () => {
  assert.equal(FREE_DEAL_LIMIT, 1);
  assert.equal(isFreeDealLimitUsed({ plan: "free", deal_creations_used: 0 }, 0), false);
  assert.equal(isFreeDealLimitUsed({ plan: "free", deal_creations_used: 1 }, 0), true);
  assert.equal(isFreeDealLimitUsed({ plan: "pro", deal_creations_used: 1, plan_expiry: "2999-01-01" }, 1), false);
  assert.equal(isFreeDealLimitUsed({ plan: "pro", deal_creations_used: 1, plan_expiry: "2000-01-01" }, 0), true);
  state.user.deal_creations_used = 0;
  state.user.plan = "free";
  state.user.plan_expiry = null;
  assert.ok(await reserveDealCreation("user-1"));
  assert.equal(await reserveDealCreation("user-1"), null);
  state.user.plan = "pro";
  state.user.plan_expiry = new Date("2999-01-01");
  assert.ok(await reserveDealCreation("user-1"));
  state.user.plan_expiry = new Date("2000-01-01");
  assert.equal(await reserveDealCreation("user-1"), null);
});

test("quarterly checkout uses the server price and grants three months only once", async () => {
  state.user = { id: "user-1", country_code: "IN", plan: "free", plan_expiry: null };
  state.payments = [];
  state.orders = [];
  const { order, pricing } = await createOrder("user-1", "quarterly");
  assert.deepEqual(pricing, { amount: 119900, currency: "INR" });
  assert.deepEqual(order.notes, { user_id: "user-1", plan: "quarterly" });
  const payment = { id: "pay-1", order_id: order.id, status: "captured", amount: order.amount, currency: order.currency };

  const first = await activateCapturedPayment({ payment, order, userId: "user-1", planType: "quarterly" });
  assert.equal(first.activated, true);
  assert.equal(state.payments.length, 1);
  assert.equal(state.payments[0].amount, 1199);
  const firstExpiry = state.user.plan_expiry.getTime();
  const duplicate = await activateCapturedPayment({ payment, order, userId: "user-1", planType: "quarterly" });
  assert.equal(duplicate.activated, false);
  assert.equal(state.user.plan_expiry.getTime(), firstExpiry);

  const renewal = await createOrder("user-1", "monthly");
  await activateCapturedPayment({
    payment: { id: "pay-2", order_id: renewal.order.id, status: "captured", amount: renewal.order.amount, currency: "INR" },
    order: renewal.order,
    userId: "user-1",
    planType: "monthly"
  });
  assert.ok(state.user.plan_expiry.getTime() > firstExpiry);
});

test("captured payments cannot be applied to another account, plan, or amount", async () => {
  const { order } = await createOrder("user-1", "yearly");
  const payment = { id: "pay-3", order_id: order.id, status: "captured", amount: order.amount, currency: order.currency };
  const before = state.payments.length;
  await assert.rejects(activateCapturedPayment({ payment, order, userId: "another-user", planType: "yearly" }), /account or plan/);
  await assert.rejects(activateCapturedPayment({ payment, order, userId: "user-1", planType: "monthly" }), /account or plan/);
  await assert.rejects(activateCapturedPayment({ payment: { ...payment, amount: 1 }, order, userId: "user-1", planType: "yearly" }), /full order amount/);
  assert.equal(state.payments.length, before);
});
