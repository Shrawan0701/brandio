import { startUpgrade } from "../lib/payments";
import { useAuth } from "../context/AuthContext";
import Toast from "./Toast";
import { useState } from "react";
import { getPaidPlans } from "../utils/pricing";

export default function UpgradeCard() {
  const { user, setUser } = useAuth();
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!user || !user.country_code) return null;

  const plans = getPaidPlans(user.country_code);

  const handleUpgrade = async (plan) => {
    try {
      setLoading(true);

      await startUpgrade(plan, setUser, user.country_code);

      setToast({
        type: "success",
        message: "🎉 Pro activated successfully!"
      });
    } catch {
      setToast({
        type: "error",
        message: "Payment failed"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="upgrade-card-modern">
        <h5 className="fw-bold mb-1">Upgrade to Pro</h5>
        <p className="text-muted mb-3">
          Keep every feature and add unlimited brand deals.
        </p>

        <div className="d-flex flex-wrap gap-2">
          {plans.map((plan) => (
            <button key={plan.id} className="btn btn-dark" disabled={loading} onClick={() => handleUpgrade(plan.id)}>
              {plan.price} {plan.cadence}
            </button>
          ))}
        </div>
      </div>

      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
