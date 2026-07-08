import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

function formatApiErrorDetail(err) {
  // err can be an Axios error OR a raw detail payload
  const generic = "Something went wrong. Please try again.";

  if (!err) return generic;

  // AxiosError shape
  const status = err?.response?.status;
  const data = err?.response?.data;
  const detail = err?.response?.data?.detail;

  if (typeof detail === "string" && detail.trim()) return detail;

  // Some backends use `message`
  if (typeof data?.message === "string" && data.message.trim()) return data.message;

  // FastAPI sometimes returns { detail: [...] }
  if (Array.isArray(detail)) {
    return detail
      .map((e) => {
        if (!e) return null;
        if (typeof e === "string") return e;
        if (typeof e.msg === "string") return e.msg;
        if (typeof e.detail === "string") return e.detail;
        return null;
      })
      .filter(Boolean)
      .join(" ");
  }

  // If the caller passed the raw detail payload directly
  if (typeof err === "string" && err.trim()) return err;

  if (err && typeof err.msg === "string" && err.msg.trim()) return err.msg;
  if (err && typeof err.detail === "string" && err.detail.trim()) return err.detail;

  if (status) return `${generic} (Error ${status})`;
  return generic;
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    // Skip check if returning from OAuth callback
    if (window.location.hash?.includes('session_id=')) {
      setLoading(false);
      return;
    }

    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/me`,
        { withCredentials: true }
      );
      setUser(data);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []); // setState functions are stable, no deps needed

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email, password) => {
    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/login`,
        { email, password },
        { withCredentials: true }
      );
      setUser(data);
      return { success: true };
    } catch (e) {
      const error = formatApiErrorDetail(e) || e.message;
      return { success: false, error };
    }
  };

  const register = async (email, password, name, role) => {
    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/register`,
        { email, password, name, role },
        { withCredentials: true }
      );
      setUser(data);
      return { success: true };
    } catch (e) {
      const error = formatApiErrorDetail(e) || e.message;
      return { success: false, error };
    }
  };

  const logout = async () => {
    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/logout`,
        {},
        { withCredentials: true }
      );
    } catch (e) {
      console.error('Logout error:', e);
    }
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    setUser,
    checkAuth
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};