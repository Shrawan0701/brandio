import { createContext, useContext, useEffect, useState } from "react";
import api from "../lib/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = async () => {
    setLoading(true); // 🔥 THIS WAS MISSING
    try {
      const res = await api.get("/profile/me");
      const incoming = res.data;

      if (!incoming.country_code) {
        throw new Error("country_code missing from backend");
      }

      setUser(incoming);
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
    <AuthContext.Provider
      value={{ user, setUser, loading, refreshUser: fetchMe }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
