import { startUpgrade } from "../lib/payments";
import { useAuth } from "../context/AuthContext";
import Toast from "./Toast";
import { useState } from "react";
import api from "../lib/api";

export default function UpgradeCard() {
  const { setUser } = useAuth();
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async (plan) => {
    try {
      setLoading(true);

      await startUpgrade(plan, async () => {
        // 🔥 AFTER SUCCESSFUL PAYMENT
        const res = await api.get("/profile/me");
        setUser(res.data);

        setToast({
          type: "success",
          message: "🎉 Pro activated successfully!"
        });
      });

    } catch (err) {
      setToast({
        type: "error",
        message: "Payment failed or cancelled"
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
            ₹199 / Month
          </button>

          <button
            className="btn btn-outline-dark w-100"
            disabled={loading}
            onClick={() => handleUpgrade("yearly")}
          >
            ₹1499 / Year
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
