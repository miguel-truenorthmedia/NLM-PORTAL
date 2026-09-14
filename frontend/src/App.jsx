import { Link, NavLink, Navigate, Route, Routes } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute.jsx";
import ThemeToggle from "./components/ThemeToggle.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import { useTheme } from "./context/ThemeContext.jsx";
import CampaignDashboard from "./pages/CampaignDashboard.jsx";
import HomePage from "./pages/HomePage.jsx";
import InviteAcceptPage from "./pages/InviteAcceptPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import UsersPage from "./pages/UsersPage.jsx";
import AccountingLayout from "./pages/accounting/AccountingLayout.jsx";
import BuyersTab from "./pages/accounting/BuyersTab.jsx";
import InvoicesTab from "./pages/accounting/InvoicesTab.jsx";
import PnLHistoricalTab from "./pages/accounting/PnLHistoricalTab.jsx";
import PnLTab from "./pages/accounting/PnLTab.jsx";
import ReconciliationTab from "./pages/accounting/ReconciliationTab.jsx";
import SalesLayout from "./pages/sales/SalesLayout.jsx";
import OutreachSheetTab from "./pages/sales/OutreachSheetTab.jsx";
import TodoLayout from "./pages/todo/TodoLayout.jsx";
import TodoSheetTab from "./pages/todo/TodoSheetTab.jsx";
import SopPage from "./pages/SopPage.jsx";
import { redirectToLogin } from "./utils/authRedirect.js";
import logoDark from "../assets/nlm_logo_dark.png";
import logoLight from "../assets/nlm_logo_light.png";

function AppHeader() {
  const { theme } = useTheme();
  const { user, logout, isAuthenticated, isCeo, canAccessTodo } = useAuth();
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
        <NavLink to="/sales" className={({ isActive }) => (isActive ? "nav-link nav-link--active" : "nav-link")}>
          Sales
        </NavLink>
        <NavLink to="/sop" className={({ isActive }) => (isActive ? "nav-link nav-link--active" : "nav-link")}>
          SOP
        </NavLink>
        {canAccessTodo ? (
          <NavLink to="/todo" className={({ isActive }) => (isActive ? "nav-link nav-link--active" : "nav-link")}>
            Todo
          </NavLink>
        ) : null}
        {isCeo ? (
          <NavLink to="/users" className={({ isActive }) => (isActive ? "nav-link nav-link--active" : "nav-link")}>
            Users
          </NavLink>
        ) : null}
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
      <Route path="/invite/:token" element={<InviteAcceptPage mode="invite" />} />
      <Route path="/reset-password/:token" element={<InviteAcceptPage mode="password_reset" />} />
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
        <Route path="pnl" element={<PnLTab />} />
        <Route path="pnl-historical" element={<PnLHistoricalTab />} />
      </Route>
      <Route
        path="/sales"
        element={
          <ProtectedRoute>
            <AppLayout>
              <SalesLayout />
            </AppLayout>
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="outreach" replace />} />
        <Route path="outreach" element={<OutreachSheetTab mode="active" />} />
        <Route path="archive" element={<OutreachSheetTab mode="archived" />} />
      </Route>
      <Route
        path="/sop"
        element={
          <ProtectedRoute>
            <AppLayout>
              <SopPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/todo"
        element={
          <ProtectedRoute todoOwnerOnly>
            <AppLayout>
              <TodoLayout />
            </AppLayout>
          </ProtectedRoute>
        }
      >
        <Route index element={<TodoSheetTab mode="active" />} />
        <Route path="archive" element={<TodoSheetTab mode="archived" />} />
      </Route>
      <Route
        path="/users"
        element={
          <ProtectedRoute ceoOnly>
            <AppLayout>
              <UsersPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route path="/reconciliation" element={<Navigate to="/accounting/reconciliation" replace />} />
    </Routes>
  );
}
