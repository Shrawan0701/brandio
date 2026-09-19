import api from "./api";

export async function startUpgrade(planType, onSuccess) {
  const { data } = await api.post("/payments/upgrade", { planType });

  const options = {
    key: data.key,
    amount: data.amount,
    currency: data.currency,
    name: "Brandio",
    description: "Pro Subscription",
    order_id: data.orderId,
    handler: async function (response) {
      await api.post("/payments/confirm", {
        planType,
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature
      });

      const res = await api.get("/profile/me");
      onSuccess(res.data);
    },
    theme: { color: "#111827" }
  };

  const rzp = new window.Razorpay(options);
  rzp.open();
}
