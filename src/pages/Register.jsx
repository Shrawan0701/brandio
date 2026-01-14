import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import AuthLayout from "../components/AuthLayout";
import Toast from "../components/Toast";
import { COUNTRIES } from "../utils/countries";
import CountrySelect from "../components/CountrySelect";


export default function Register() {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    country: "IN"
  });

  const submit = async (e) => {
  e.preventDefault();

  try {
    const res = await api.post("/auth/register", form);

    // ✅ SUCCESS TOAST HERE
    setToast({
      type: "success",
      message: "Account created successfully"
    });

    setUser(res.data);

    // give user time to see toast
    setTimeout(() => {
      navigate("/dashboard");
    }, 800);

  } catch (err) {
    const msg =
      err.response?.status === 409
        ? "Email already registered"
        : "Something went wrong. Try again";

    setToast({
      type: "error",
      message: msg
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

      <AuthLayout title="Create your Account">
        <form onSubmit={submit}>
          <input
            placeholder="Username"
            onChange={(e) =>
              setForm({ ...form, username: e.target.value })
            }
          />
          <input
            placeholder="Email address"
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
          />
          <input
            type="password"
            placeholder="Password"
            autoComplete="new-password"
            onChange={(e) =>
              setForm({ ...form, password: e.target.value })
            }
          />

          <CountrySelect
         
  value={form.country}          // default already "IN"
  onChange={(code) =>
    setForm({ ...form, country: code })
  }
/>



          <button>Create account</button>
        </form>

        <div className="auth-link">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </AuthLayout>
    </>
  );
}
