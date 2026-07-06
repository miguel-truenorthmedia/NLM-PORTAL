import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";
import { redirectToLogin } from "../utils/authRedirect.js";

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="auth-loading">
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (import.meta.env.DEV) {
      return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    }

    const returnPath = `${window.location.pathname}${window.location.search}`;
    redirectToLogin(returnPath);
    return null;
  }

  if (adminOnly && user?.role !== "admin") {
    window.location.assign("/admin/");
    return null;
  }

  return children;
}
