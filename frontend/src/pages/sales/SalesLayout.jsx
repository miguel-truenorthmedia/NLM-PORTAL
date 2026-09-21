import { NavLink, Outlet } from "react-router-dom";

const TABS = [
  { to: "/sales/outreach", label: "Outreach Sheet" },
  { to: "/sales/no-response", label: "No response" },
  { to: "/sales/follow-up", label: "Follow-up" },
  { to: "/sales/accepted", label: "Accepted" },
  { to: "/sales/archive", label: "Archive" },
];

export default function SalesLayout() {
  return (
    <section className="accounting-section">
      <div className="page-header">
        <h2>Sales</h2>
        <p className="subtle">
          Prospect outreach and client acquisition — track contact method, status, notes, and archived leads.
        </p>
      </div>

      <nav className="accounting-tabs" aria-label="Sales sections">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
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
