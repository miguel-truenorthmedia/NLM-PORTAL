import { useMemo, useState } from "react";
import { formatCurrency, formatDateShort, formatPercent } from "./formatters";

const columns = [
  { key: "date", label: "Date", type: "date", sortable: true, defaultDirection: "desc" },
  { key: "campaign", label: "Campaign", type: "text", sortable: false },
  { key: "adAccount", label: "Ad Account", type: "text", sortable: false },
  { key: "adSpend", label: "Ad Spend", type: "currency", sortable: true, defaultDirection: "asc" },
  { key: "revenue", label: "Revenue", type: "currency", sortable: true, defaultDirection: "asc" },
  { key: "profit", label: "Profit", type: "currency", sortable: true, defaultDirection: "asc" },
  { key: "roi", label: "ROI%", type: "percent", sortable: true, defaultDirection: "asc" },
  { key: "calls", label: "Calls", type: "number", sortable: true, defaultDirection: "asc" },
  { key: "convertedCalls", label: "Converted Calls", type: "number", sortable: true, defaultDirection: "asc" },
  { key: "convertedPercent", label: "Converted %", type: "percent", sortable: true, defaultDirection: "asc" },
  { key: "rpc", label: "RPC", type: "currency", sortable: true, defaultDirection: "asc" },
  { key: "costPerCall", label: "Cost/Call", type: "currency", sortable: true, defaultDirection: "asc" },
];

function formatValue(value, type) {
  if (type === "date") return formatDateShort(value);
  if (type === "currency") return formatCurrency(value);
  if (type === "percent") return formatPercent(value);
  return value ?? 0;
}

function SortArrow({ direction }) {
  if (direction === "asc") return <span className="sort-arrow">↑</span>;
  if (direction === "desc") return <span className="sort-arrow">↓</span>;
  return null;
}

function TrendArrow({ value }) {
  const num = Number(value);
  if (!Number.isFinite(num) || num === 0) return null;

  const direction = num > 0 ? "up" : "down";
  return <span className={`trend-arrow trend-arrow--${direction}`} aria-hidden="true" />;
}

function renderCell(row, col) {
  const value = row[col.key];
  const formatted = formatValue(value, col.type);

  if (col.key === "profit" || col.key === "roi") {
    return (
      <span className="trend-indicator">
        <TrendArrow value={value} />
        <span>{formatted}</span>
      </span>
    );
  }

  return formatted;
}

export default function CampaignTable({ rows }) {
  const [sortKey, setSortKey] = useState("date");
  const [direction, setDirection] = useState("desc");

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      const aValue = a[sortKey];
      const bValue = b[sortKey];
      const result =
        sortKey === "date"
          ? String(aValue).localeCompare(String(bValue))
          : Number(aValue || 0) - Number(bValue || 0);
      return direction === "asc" ? result : -result;
    });
  }, [rows, sortKey, direction]);

  const onSort = (col) => {
    if (!col.sortable) return;
    if (sortKey === col.key) {
      setDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(col.key);
    setDirection(col.defaultDirection);
  };

  return (
    <div className="card">
      <h3>Campaign Performance</h3>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key}>
                  {col.sortable ? (
                    <button type="button" className="sort-btn" onClick={() => onSort(col)}>
                      {col.label}
                      {sortKey === col.key ? <SortArrow direction={direction} /> : null}
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="subtle">
                  No data for the selected filters.
                </td>
              </tr>
            ) : (
              sortedRows.map((row) => (
                <tr key={`${row.date}-${row.adAccount}`}>
                  {columns.map((col) => (
                    <td key={col.key}>{renderCell(row, col)}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
