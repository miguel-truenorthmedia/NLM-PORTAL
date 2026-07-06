import { Link, Route, Routes } from "react-router-dom";
import ThemeToggle from "./components/ThemeToggle.jsx";
import { useTheme } from "./context/ThemeContext.jsx";
import HomePage from "./pages/HomePage.jsx";
import CampaignDashboard from "./pages/CampaignDashboard.jsx";
import ReconciliationPage from "./pages/ReconciliationPage.jsx";
import logoDark from "../assets/nlm_logo_dark.png";
import logoLight from "../assets/nlm_logo_light.png";

function AppHeader() {
  const { theme } = useTheme();
  const logoSrc = theme === "dark" ? logoLight : logoDark;

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
        <ThemeToggle />
      </div>
    </header>
  );
}

export default function App() {
  return (
    <div className="layout">
      <AppHeader />
      <main className="content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/campaigns" element={<CampaignDashboard />} />
          <Route path="/reconciliation" element={<ReconciliationPage />} />
        </Routes>
      </main>
    </div>
  );
}
