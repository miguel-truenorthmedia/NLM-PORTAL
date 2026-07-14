import { Link, NavLink, Navigate, Route, Routes } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute.jsx";
import ThemeToggle from "./components/ThemeToggle.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import { useTheme } from "./context/ThemeContext.jsx";
import CampaignDashboard from "./pages/CampaignDashboard.jsx";
import HomePage from "./pages/HomePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import AccountingLayout from "./pages/accounting/AccountingLayout.jsx";
import BuyersTab from "./pages/accounting/BuyersTab.jsx";
import InvoicesTab from "./pages/accounting/InvoicesTab.jsx";
import ReconciliationTab from "./pages/accounting/ReconciliationTab.jsx";
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
      <nav className="topbar-nav">
        <NavLink to="/" end className={({ isActive }) => (isActive ? "nav-link nav-link--active" : "nav-link")}>
          Home
        </NavLink>
        <NavLink
          to="/campaigns"
          className={({ isActive }) => (isActive ? "nav-link nav-link--active" : "nav-link")}
        >
          Campaign Performance
        </NavLink>
        <NavLink
          to="/accounting"
          className={({ isActive }) => (isActive ? "nav-link nav-link--active" : "nav-link")}
        >
          Accounting
        </NavLink>
      </nav>

      <div className="topbar-right">
        {isAuthenticated ? <span className="user-label">{user?.name || user?.email}</span> : null}
        <Link to="/" className="brand">
          <img src={logoSrc} alt="NorthernLeads Media" className="brand-logo" />
        </Link>
        {isAuthenticated ? (
          <button type="button" className="btn btn-secondary btn-small btn-topbar" onClick={handleLogout}>
            Log out
          </button>
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
        path="/accounting"
        element={
          <ProtectedRoute>
            <AppLayout>
              <AccountingLayout />
            </AppLayout>
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="reconciliation" replace />} />
        <Route path="reconciliation" element={<ReconciliationTab />} />
        <Route path="buyers" element={<BuyersTab />} />
        <Route path="invoices" element={<InvoicesTab />} />
      </Route>
      <Route path="/reconciliation" element={<Navigate to="/accounting/reconciliation" replace />} />
    </Routes>
  );
}
