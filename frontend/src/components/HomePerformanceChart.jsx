import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency, formatDateShort } from "./formatters";

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-title">{formatDateShort(label)}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} style={{ color: entry.color }}>
          {entry.name}: {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  );
}

export default function HomePerformanceChart({ data, title = "Performance", subtitle = "Revenue, ad spend, and profit by day" }) {
  const chartData = data.map((row) => ({
    ...row,
    label: formatDateShort(row.date),
  }));

  return (
    <div className="card chart-card home-chart-card">
      <div className="chart-card-head">
        <h3>{title}</h3>
        <p className="subtle">{subtitle}</p>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={chartData} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
          <XAxis dataKey="label" tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
          <YAxis tick={{ fill: "var(--text-muted)", fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
          <Tooltip content={<ChartTooltip />} />
          <Legend />
          <Line
            type="monotone"
            dataKey="revenue"
            name="Revenue"
            stroke="var(--chart-revenue)"
            strokeWidth={3}
            dot={{ r: 4, fill: "var(--chart-revenue)" }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="adSpend"
            name="Ad Spend"
            stroke="var(--chart-spend)"
            strokeWidth={3}
            dot={{ r: 4, fill: "var(--chart-spend)" }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="profit"
            name="Profit"
            stroke="var(--chart-profit)"
            strokeWidth={3}
            dot={{ r: 4, fill: "var(--chart-profit)" }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
