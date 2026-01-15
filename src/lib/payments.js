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
      const res = await api.get("/profile/me");
      onSuccess(res.data);

      // ✅ REDIRECT AFTER PAYMENT
      navigate("/dashboard", { replace: true });
    },

    theme: { color: "#facc15" }
  };

  const rzp = new window.Razorpay(options);
  rzp.open();
}
