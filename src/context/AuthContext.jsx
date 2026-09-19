import { createContext, useContext, useEffect, useState } from "react";
import api, { clearAuthToken, getAuthToken, setAuthToken } from "../lib/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  const fetchMe = async () => {
    try {
      const res = await api.get("/profile/me", {
        headers: {
          "Cache-Control": "no-cache"
        }
      });

      setUser(res.data || null);
      return res.data || null;
    } catch {
      clearAuthToken();
      setUser(null);
      return null;
    }
  };

  const finishAuth = async (token) => {
    if (!token) {
      clearAuthToken();
      setUser(null);
      return null;
    }

    setAuthToken(token);
    return fetchMe();
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      clearAuthToken();
      setUser(null);
    }
  };

  useEffect(() => {
    const restoreAuth = async () => {
      const token = getAuthToken();

      if (token) {
        await fetchMe();
      } else {
        setUser(null);
      }

      setAuthReady(true);
    };

    restoreAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading: !authReady,
        authReady,
        finishAuth,
        logout,
        refreshUser: fetchMe
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
