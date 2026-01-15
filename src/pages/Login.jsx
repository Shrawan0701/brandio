import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import AuthLayout from "../components/AuthLayout";
import Toast from "../components/Toast";

export default function Login() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [toast, setToast] = useState(null);

  const submit = async (e) => {
    e.preventDefault();

    try {
      await api.post("/auth/login", { email, password });

      await refreshUser(); // fetch fresh /me

      navigate("/dashboard", { replace: true }); // 🔥 FORCE REDIRECT
    } catch {
      setToast({
        type: "error",
        message: "Invalid email or password"
      });
    }
  };

  return (
    <>
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      <AuthLayout title="Sign in to Brandio">
        <form onSubmit={submit}>
          <input
            placeholder="Email address"
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
          />

          <div className="auth-link">
            <Link to="/forgot-password">Forgot password?</Link>
          </div>

          <button>Sign in</button>
        </form>

        <div className="auth-link">
          Don’t have an account? <Link to="/register">Create one</Link>
        </div>
      </AuthLayout>
    </>
  );
}
