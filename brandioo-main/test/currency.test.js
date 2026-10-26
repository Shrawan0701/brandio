import test from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { currencySql, normalizeCurrency, pickCurrency } from "../src/utils/currency.js";
import { formatMoney } from "../../src/utils/deals.js";

const queries = [];
globalThis.__brandioCurrencyTestPool = {
  async query(sql, args = []) {
    queries.push({ sql, args });
    if (sql.includes("SELECT money_settings")) return { rows: [{ money_settings: {} }] };
    if (sql.includes("SELECT DISTINCT")) return { rows: [{ currency: "INR" }, { currency: "USD" }] };
    assert.match(sql, /CASE WHEN UPPER\(TRIM\(currency\)\)/);
    assert.equal(args[0], "creator-1");
    assert.ok(["INR", "USD"].includes(args[1]));
    const value = args[1] === "USD" ? 193 : 499;
    if (sql.includes("AS earned_this_month")) {
      assert.match(sql, /payment_due_date >= CURRENT_DATE/);
      assert.match(sql, /status IN \('pending','active','overdue'\)/);
      return { rows: [{ earned_this_month: 0, pending: value, overdue: 0, expected: value, paid: 0, recorded_expenses: 0 }] };
    }
    if (sql.includes("AS expected")) return { rows: [{ key: "2026-10", label: "Oct 2026", expected: value }] };
    if (sql.includes("AS revenue")) return { rows: [] };
    throw new Error(`Unexpected query: ${sql}`);
  }
};
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "../config/db.js") {
      return { url: "data:text/javascript,export default globalThis.__brandioCurrencyTestPool", shortCircuit: true };
    }
    return nextResolve(specifier, context);
  }
});

const { getMoneyCockpitDB } = await import("../src/services/money.service.js");

test("USD and INR money summaries stay separate", async () => {
  assert.equal(normalizeCurrency("$"), "USD");
  assert.equal(normalizeCurrency("₹"), "INR");
  assert.equal(pickCurrency(["INR", "USD"], "$"), "USD");
  assert.equal(formatMoney(193, "USD"), "$193");
  assert.equal(formatMoney(193, "$"), "$193");
  assert.equal(formatMoney(193, "INR"), "₹193");
  assert.match(currencySql(), /USD/);

  const usd = await getMoneyCockpitDB("creator-1", "USD");
  const inr = await getMoneyCockpitDB("creator-1", "INR");
  assert.deepEqual(usd.availableCurrencies, ["INR", "USD"]);
  assert.equal(usd.currency, "USD");
  assert.equal(usd.summary.pending, 193);
  assert.equal(inr.currency, "INR");
  assert.equal(inr.summary.pending, 499);
  assert.ok(queries.filter(({ args }) => args[1] === "USD").length >= 6);
  assert.ok(queries.filter(({ args }) => args[1] === "INR").length >= 6);
});
