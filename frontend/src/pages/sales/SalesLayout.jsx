import { NavLink, Outlet } from "react-router-dom";

const TABS = [{ to: "/sales/outreach", label: "Outreach Sheet" }];

export default function SalesLayout() {
  return (
    <section className="accounting-section">
      <div className="page-header">
        <h2>Sales</h2>
        <p className="subtle">
          Prospect outreach and client acquisition tools — track who to contact, when you reached out, and follow-ups.
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
