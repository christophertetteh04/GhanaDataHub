import { createContext, useContext, useState, useEffect } from "react";
import { authApi } from "../services/api";
import {
  logInfo,
  clearUser,
  setUser as setLoggedUser,
} from "../services/logger";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      authApi
        .me()
        .then((r) => setUser(r.data))
        .catch(() => {
          localStorage.clear();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const { data } = await authApi.login({ email, password });
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("refresh_token", data.refresh_token);
    const me = await authApi.me();
    setUser(me.data);
    setLoggedUser(me.data.id, me.data.email);
    logInfo("user_logged_in", { userId: me.data.id, role: me.data.role });
    // Post-login destination: always go to the protected dashboard.
    // (Return is kept for callers that may do additional logic.)
    return me.data;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {}
    logInfo("user_logged_out");
    clearUser();
    localStorage.clear();
    setUser(null);
  };

  const register = async (payload) => {
    const { data } = await authApi.register(payload);
    return data;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
