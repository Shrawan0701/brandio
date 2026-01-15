import { startUpgrade } from "../lib/payments";
import { useAuth } from "../context/AuthContext";
import Toast from "./Toast";
import { useState } from "react";
import { getDisplayPricing } from "../utils/pricing"; // ✅ ADDED

export default function UpgradeCard() {
  const { user, setUser } = useAuth();
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  // ✅ GUARD
  if (!user || !user.country_code) return null;

  const pricing = getDisplayPricing(user.country_code);

  const handleUpgrade = async (plan) => {
    try {
      setLoading(true);

      const updatedUser = await startUpgrade(plan);
      setUser(updatedUser);

      setToast({
        type: "success",
        message: "🎉 Pro activated successfully!"
      });
    } catch (err) {
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
          Unlock unlimited deals and reminders
        </p>

        <div className="d-flex gap-2">
          <button
            className="btn btn-dark w-100"
            disabled={loading}
            onClick={() => handleUpgrade("monthly")}
          >
            {pricing.monthly} / Month
          </button>

          <button
            className="btn btn-outline-dark w-100"
            disabled={loading}
            onClick={() => handleUpgrade("yearly")}
          >
            {pricing.yearly} / Year
          </button>
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
