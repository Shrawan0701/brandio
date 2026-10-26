import api from "./api";
import { assertCheckoutPrice } from "../utils/pricing";

export async function startUpgrade(planType, onSuccess, countryCode) {
  if (!window.Razorpay) throw new Error("Checkout is unavailable. Please refresh and try again.");
  const { data } = await api.post("/payments/upgrade", { planType });
  assertCheckoutPrice(countryCode, planType, data);

  return new Promise((resolve, reject) => {
    let verifying = false;
    const options = {
      key: data.key,
      amount: data.amount,
      currency: data.currency,
      name: "Brandio",
      description: `Brandio Pro ${planType}`,
      order_id: data.orderId,
      handler: async function (response) {
        verifying = true;
        try {
          await api.post("/payments/confirm", {
            planType,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature
          });
          const res = await api.get("/profile/me");
          await onSuccess?.(res.data);
          resolve(res.data);
        } catch (err) {
          reject(err);
        }
      },
      modal: {
        ondismiss: () => {
          if (!verifying) reject(new Error("Checkout cancelled. No plan change was made."));
        }
      },
      theme: { color: "#111827" }
    };

    const rzp = new window.Razorpay(options);
    rzp.on("payment.failed", (response) => reject(new Error(response.error?.description || "Payment failed")));
    rzp.open();
  });
}
