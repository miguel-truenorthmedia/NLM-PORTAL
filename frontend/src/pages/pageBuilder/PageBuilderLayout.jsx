import { NavLink, Outlet } from "react-router-dom";

const TABS = [
  { to: "/page-builder", label: "Landing page builder", end: true },
  { to: "/page-builder/url", label: "URL builder", end: false },
];

export default function PageBuilderLayout() {
  return (
    <section className="accounting-section page-builder-section">
      <div className="page-header">
        <h2>Page Builder</h2>
        <p className="subtle">Landing pages and tracking URLs for media buyers.</p>
      </div>

      <nav className="accounting-tabs" aria-label="Page Builder sections">
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
