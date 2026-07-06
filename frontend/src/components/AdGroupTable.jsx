import { useMemo, useState } from "react";
import { formatCurrency, formatPercent, formatRoas } from "./formatters";

const columns = [
  { key: "campaign", label: "Campaign", type: "text" },
  { key: "publisher", label: "Publisher", type: "text" },
  { key: "adGroup", label: "Ad Group", type: "text" },
  { key: "spend", label: "Spend", type: "currency" },
  { key: "calls", label: "Calls", type: "number" },
  { key: "connectedCalls", label: "Connected", type: "number" },
  { key: "paidCalls", label: "Paid Calls", type: "number" },
  { key: "revenue", label: "Revenue", type: "currency" },
  { key: "cpa", label: "CPA", type: "currency" },
  { key: "rpc", label: "RPC", type: "currency" },
  { key: "roas", label: "ROAS", type: "roas" },
  { key: "profit", label: "Profit", type: "currency" },
  { key: "margin", label: "Margin", type: "percent" },
  { key: "avgDuration", label: "Avg Duration", type: "number" },
];

function formatValue(value, type) {
  if (type === "text") return value ?? "";
  if (type === "currency") return formatCurrency(value);
  if (type === "percent") return formatPercent(value);
  if (type === "roas") return formatRoas(value);
  return value ?? 0;
}

export default function AdGroupTable({ rows }) {
  const [sortKey, setSortKey] = useState("profit");
  const [direction, setDirection] = useState("desc");

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      const aValue = a[sortKey];
      const bValue = b[sortKey];
      const result =
        typeof aValue === "string"
          ? String(aValue).localeCompare(String(bValue))
          : Number(aValue || 0) - Number(bValue || 0);
      return direction === "asc" ? result : -result;
    });
  }, [rows, sortKey, direction]);

  const onSort = (key) => {
    if (key === sortKey) {
      setDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setDirection("desc");
  };

  return (
    <div className="card">
      <h3>Performance by Ad Group</h3>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key}>
                  <button type="button" className="sort-btn" onClick={() => onSort(col.key)}>
                    {col.label}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row) => (
              <tr key={`${row.campaign}-${row.publisher}-${row.adGroup}`}>
                {columns.map((col) => (
                  <td key={col.key}>{formatValue(row[col.key], col.type)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
