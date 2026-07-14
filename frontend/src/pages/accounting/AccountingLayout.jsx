import { NavLink, Outlet } from "react-router-dom";

const TABS = [
  { to: "/accounting/reconciliation", label: "Reconciliation" },
  { to: "/accounting/buyers", label: "Buyers" },
  { to: "/accounting/invoices", label: "Invoices" },
];

export default function AccountingLayout() {
  return (
    <section className="accounting-section">
      <div className="page-header">
        <h2>Accounting</h2>
        <p className="subtle">
          Reconciliation reports, buyer billing profiles, and invoices — one place for weekly reports and biweekly
          billing.
        </p>
      </div>

      <nav className="accounting-tabs" aria-label="Accounting sections">
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
