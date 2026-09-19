import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../lib/api";
import AuthLayout from "../components/AuthLayout";
import Toast from "../components/Toast";

export default function ResetPassword() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [toast, setToast] = useState(null);

  const submit = async (e) => {
    e.preventDefault();

    if (password !== confirm) {
      return setToast({ type: "error", message: "Passwords do not match" });
    }

    try {
      await api.post("/auth/reset-password", {
        email: state.email,
        otp,
        password
      });

      setToast({ type: "success", message: "Password reset successfully" });

      setTimeout(() => navigate("/login"), 700);
    } catch {
      setToast({ type: "error", message: "Invalid OTP" });
    }
  };

  return (
    <>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <AuthLayout title="Create new password">
        <form onSubmit={submit}>
          <input placeholder="OTP" onChange={(e) => setOtp(e.target.value)} />
          <input
            type="password"
            placeholder="New password"
            onChange={(e) => setPassword(e.target.value)}
          />
          <input
            type="password"
            placeholder="Confirm password"
            onChange={(e) => setConfirm(e.target.value)}
          />
          <button>Reset password</button>
        </form>
      </AuthLayout>
    </>
  );
}
