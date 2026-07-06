import { Link, Route, Routes } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute.jsx";
import ThemeToggle from "./components/ThemeToggle.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import { useTheme } from "./context/ThemeContext.jsx";
import CampaignDashboard from "./pages/CampaignDashboard.jsx";
import HomePage from "./pages/HomePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import ReconciliationPage from "./pages/ReconciliationPage.jsx";
import { redirectToLogin } from "./utils/authRedirect.js";
import logoDark from "../assets/nlm_logo_dark.png";
import logoLight from "../assets/nlm_logo_light.png";
function AppHeader() {
  const { theme } = useTheme();
  const { user, logout, isAuthenticated } = useAuth();
  const logoSrc = theme === "dark" ? logoLight : logoDark;

  async function handleLogout() {
    await logout();
    if (import.meta.env.PROD) {
      redirectToLogin();
    }
  }

  return (
    <header className="topbar">
      <Link to="/" className="brand">
        <img src={logoSrc} alt="NorthernLeads Media" className="brand-logo" />
      </Link>
      <div className="topbar-actions">
        <nav>
          <Link to="/">Home</Link>
          <Link to="/campaigns">Campaign Performance</Link>
          <Link to="/reconciliation">Reconciliation</Link>
        </nav>
        {isAuthenticated ? (
          <div className="user-menu">
            <span className="user-label">{user?.name || user?.email}</span>
            <button type="button" className="btn btn-secondary btn-small" onClick={handleLogout}>
              Log out
            </button>
          </div>
        ) : null}
        <ThemeToggle />
      </div>
    </header>
  );
}

function AppLayout({ children }) {
  return (
    <div className="layout">
      <AppHeader />
      <main className="content">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      {import.meta.env.DEV ? <Route path="/login" element={<LoginPage />} /> : null}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout>
              <HomePage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/campaigns"
        element={
          <ProtectedRoute>
            <AppLayout>
              <CampaignDashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reconciliation"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ReconciliationPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
