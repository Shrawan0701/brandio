import api from "./api";

export async function startUpgrade(planType) {
  const { data } = await api.post("/payments/upgrade", { planType });

  const options = {
    key: data.key,
    amount: data.amount,
    currency: data.currency,
    name: "Brandio",
    description: "Pro Subscription",
    order_id: data.orderId,

    handler: async function (response) {
      // 🔥 HARD GUARANTEE — upgrade user NOW
      await api.post("/payments/confirm", {
        planType
      });

      // 🔥 force DB refresh
      const res = await api.get("/profile/me");
      return res.data;
    },

    theme: { color: "#facc15" }
  };

  const rzp = new window.Razorpay(options);
  rzp.open();
}

