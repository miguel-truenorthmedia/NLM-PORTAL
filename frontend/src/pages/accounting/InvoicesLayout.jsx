import { NavLink, Outlet } from "react-router-dom";

const SUB_TABS = [
  { to: "/accounting/invoices", end: true, label: "Invoice Overview" },
  { to: "/accounting/invoices/buyers", end: true, label: "Buyers" },
];

export default function InvoicesLayout() {
  return (
    <div className="invoices-layout">
      <nav className="invoices-subtabs" aria-label="Invoice views">
        {SUB_TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              isActive ? "invoices-subtab invoices-subtab--active" : "invoices-subtab"
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}
