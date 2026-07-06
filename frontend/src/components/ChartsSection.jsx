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

export default function ChartsSection({ byDay, byAdGroup }) {
  return (
    <div className="charts-grid">
      <div className="card chart-card">
        <h3>Revenue vs Spend by Day</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={byDay}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke="#0f766e" strokeWidth={2} />
            <Line type="monotone" dataKey="spend" stroke="#334155" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="card chart-card">
        <h3>Revenue by Ad Group</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={byAdGroup}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="adGroup" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="revenue" fill="#2563eb" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
