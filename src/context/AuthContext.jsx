import { createContext, useContext, useEffect, useState } from "react";
import api from "../lib/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = async () => {
  try {
    const res = await api.get("/profile/me");
    const incoming = res.data;

    setUser(prev => ({
      ...prev,                 // keep previous values
      ...incoming,             // overwrite with fresh backend data

      // 🔒 HARD GUARANTEE
      country_code:
        incoming.country_code ||
        incoming.country ||
        prev?.country_code ||
        "IN"                   // absolute fallback (only if all else fails)
    }));
  } catch {
    setUser(null);
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    fetchMe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading, refreshUser: fetchMe }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
