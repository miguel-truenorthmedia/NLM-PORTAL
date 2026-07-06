import { formatCurrency, formatPercent } from "./formatters";

export default function KpiCards({ items }) {
  return (
    <div className="kpi-grid">
      {items.map((item) => (
        <div className={`card kpi-card${item.tone ? ` kpi-card--${item.tone}` : ""}`} key={item.label}>
          <p className="kpi-label">{item.label}</p>
          <p className="kpi-value">
            {item.type === "currency"
              ? formatCurrency(item.value)
              : item.type === "percent"
              ? formatPercent(item.value)
              : item.value ?? 0}
          </p>
        </div>
      ))}
    </div>
  );
}
