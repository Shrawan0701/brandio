import { startUpgrade } from "../lib/payments";
import { useAuth } from "../context/AuthContext";
import Toast from "./Toast";
import { useState } from "react";

export default function UpgradeCard() {
  const { user, setUser } = useAuth();
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const countryCode = user.country_code || "IN";
  const isIndia = countryCode === "IN";

  const monthlyLabel = isIndia ? "₹99 / Month" : "$5 / Month";
  const yearlyLabel = isIndia ? "₹499 / Year" : "$49 / Year";

  const handleUpgrade = async (plan) => {
    try {
      setLoading(true);

      const updatedUser = await startUpgrade(plan);
      setUser(updatedUser);

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
          Unlock unlimited deals and reminders
        </p>

        <div className="d-flex gap-2">
          <button
            className="btn btn-dark w-100"
            disabled={loading}
            onClick={() => handleUpgrade("monthly")}
          >
            {monthlyLabel}
          </button>

          <button
            className="btn btn-outline-dark w-100"
            disabled={loading}
            onClick={() => handleUpgrade("yearly")}
          >
            {yearlyLabel}
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
