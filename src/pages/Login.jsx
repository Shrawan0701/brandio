import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import AuthLayout from "../components/AuthLayout";
import Toast from "../components/Toast";

export default function Login() {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [toast, setToast] = useState(null);

  const { refreshUser } = useAuth();

const submit = async (e) => {
  e.preventDefault();

  try {
    await api.post("/auth/login", { email, password });

    setToast({
      type: "success",
      message: "Welcome back"
    });

    await refreshUser(); // 🔥 THIS IS THE FIX

    setTimeout(() => {
      navigate("/dashboard");
    }, 500);

  } catch (err) {
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
            autoComplete="new-password"
            onChange={(e) => setPassword(e.target.value)}
          />
          <button>Sign in</button>
        </form>

        <div className="auth-link">
          Don’t have an account? <Link to="/register">Create one</Link>
        </div>
      </AuthLayout>
    </>
  );
}
