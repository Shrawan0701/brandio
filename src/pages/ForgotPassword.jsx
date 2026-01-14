import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import AuthLayout from "../components/AuthLayout";
import Toast from "../components/Toast";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [toast, setToast] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/auth/forgot-password", { email });
      navigate("/reset-password", { state: { email } });
    } catch {
      setToast({ type: "error", message: "Email not found" });
    }
  };

  return (
    <>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <AuthLayout title="Reset your password">
        <form onSubmit={submit}>
          <input
            placeholder="Enter your email"
            onChange={(e) => setEmail(e.target.value)}
          />
          <button>Send OTP</button>
        </form>
      </AuthLayout>
    </>
  );
}
