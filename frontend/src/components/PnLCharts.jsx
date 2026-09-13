import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "./formatters";

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-title">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} style={{ color: entry.color }}>
          {entry.name}: {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  );
}

export function PnLTrendChart({
  data,
  title = "6-month trend",
  subtitle = "Revenue, ad spend, campaign profit, and net profit",
}) {
  return (
    <div className="card chart-card">
      <div className="chart-card-head">
        <h3>{title}</h3>
        <p className="subtle">{subtitle}</p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
          <XAxis dataKey="label" tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
          <YAxis tick={{ fill: "var(--text-muted)", fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
          <Tooltip content={<ChartTooltip />} />
          <Legend />
          <Line type="monotone" dataKey="revenue" name="Revenue" stroke="var(--chart-revenue)" strokeWidth={2.5} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="adSpend" name="Ad Spend" stroke="var(--chart-spend)" strokeWidth={2.5} dot={{ r: 3 }} />
          <Line
            type="monotone"
            dataKey="campaignProfit"
            name="Campaign Profit"
            stroke="var(--chart-profit)"
            strokeWidth={2.5}
            dot={{ r: 3 }}
          />
          <Line type="monotone" dataKey="netProfit" name="Net Profit" stroke="#38bdf8" strokeWidth={2.5} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PnLExpenseBreakdownChart({
  data,
  title = "Expenses by category",
  subtitle = "Operating costs for the selected month",
}) {
  return (
    <div className="card chart-card">
      <div className="chart-card-head">
        <h3>{title}</h3>
        <p className="subtle">{subtitle}</p>
      </div>
      {data.length === 0 ? (
        <p className="subtle pnl-empty-chart">No expenses recorded yet.</p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
            <XAxis dataKey="category" tick={{ fill: "var(--text-muted)", fontSize: 11 }} angle={-25} textAnchor="end" height={60} />
            <YAxis tick={{ fill: "var(--text-muted)", fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
            <Tooltip content={<ChartTooltip />} />
            <Bar dataKey="amount" name="Amount" fill="var(--chart-spend)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
