import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function formatApiErrorDetail(detail) {
  if (detail == null) return "Something went wrong. Please try again.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail.map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e))).filter(Boolean).join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
}

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Emergent redirect/callback is removed.
    // For safety, just send user back to login.
    navigate('/login', { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#002FA7] mx-auto"></div>
        <p className="mt-4 text-[#4B5563]">Redirecting...</p>
      </div>
    </div>
  );
};


export default AuthCallback;