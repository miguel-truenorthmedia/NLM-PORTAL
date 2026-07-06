const PRESETS = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "last7", label: "Last 7 days" },
  { key: "last30", label: "Last 30 days" },
  { key: "custom", label: "Custom" },
];

export default function DateRangeSelector({ preset, startDate, endDate, onPresetChange, onDateChange }) {
  return (
    <div className="card">
      <div className="date-controls">
        <div className="preset-group">
          {PRESETS.map((item) => (
            <button
              key={item.key}
              type="button"
              className={item.key === preset ? "preset active" : "preset"}
              onClick={() => onPresetChange(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="custom-range">
          <input type="date" value={startDate} onChange={(e) => onDateChange("startDate", e.target.value)} />
          <span>to</span>
          <input type="date" value={endDate} onChange={(e) => onDateChange("endDate", e.target.value)} />
        </div>
      </div>
    </div>
  );
}
