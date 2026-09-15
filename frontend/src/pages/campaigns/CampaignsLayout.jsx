import { NavLink, Outlet } from "react-router-dom";

const TABS = [
  { to: "/campaigns", label: "Overview", end: true },
  { to: "/campaigns/controller", label: "Campaign controller", end: false },
];

export default function CampaignsLayout() {
  return (
    <section className="accounting-section campaigns-section">
      <div className="page-header">
        <h2>Campaign Performance</h2>
        <p className="subtle">
          Ringba performance overview, plus BIGO campaign tracking and live ad set metrics.
        </p>
      </div>

      <nav className="accounting-tabs" aria-label="Campaign Performance sections">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) => (isActive ? "accounting-tab accounting-tab--active" : "accounting-tab")}
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>

      <div className="accounting-tab-panel">
        <Outlet />
      </div>
    </section>
  );
}
