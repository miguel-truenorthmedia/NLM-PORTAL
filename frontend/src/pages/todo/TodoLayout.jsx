import { NavLink, Outlet } from "react-router-dom";

const TABS = [
  { to: "/todo", label: "Active", end: true },
  { to: "/todo/archive", label: "Archive", end: false },
];

export default function TodoLayout() {
  return (
    <section className="accounting-section todo-section">
      <div className="page-header">
        <h2>Todo</h2>
        <p className="subtle">
          Personal tasks — Start → Testing → Done (archives). Visible only to you.
        </p>
      </div>

      <nav className="accounting-tabs" aria-label="Todo sections">
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
