import { NavLink, Outlet } from "react-router-dom";

const TABS = [
  { to: "/accounting/reconciliation", label: "Reconciliation" },
  { to: "/accounting/buyers", label: "Buyers" },
  { to: "/accounting/invoices", label: "Invoices" },
  { to: "/accounting/pnl", label: "P&L" },
  { to: "/accounting/pnl-historical", label: "P&L Historical" },
];

export default function AccountingLayout() {
  return (
    <section className="accounting-section">
      <div className="page-header">
        <h2>Accounting</h2>
        <p className="subtle">
          Reconciliation, buyers, invoices, and P&amp;L — monthly and historical company performance in one place.
        </p>
      </div>

      <nav className="accounting-tabs" aria-label="Accounting sections">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to !== "/accounting/invoices"}
            className={({ isActive }) =>
              isActive ? "accounting-tab accounting-tab--active" : "accounting-tab"
            }
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
