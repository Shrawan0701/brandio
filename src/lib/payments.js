// src/lib/startUpgrade.js
import api from "./api";

export async function startUpgrade(planType, onSuccess, navigate) {
  const { data } = await api.post("/payments/upgrade", { planType });

  const options = {
    key: data.key,
    amount: data.amount,
    currency: data.currency,
    name: "Brandio",
    description: "Pro Subscription",
    order_id: data.orderId,

    handler: async function () {
      // ✅ refresh user
      const res = await api.get("/profile/me");
      onSuccess(res.data);

      // ✅ redirect AFTER payment
      navigate("/dashboard"); // or "/profile"
    },

    theme: { color: "#facc15" }
  };

  const rzp = new window.Razorpay(options);
  rzp.open();
}
