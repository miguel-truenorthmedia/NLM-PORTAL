import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  formatDisplayDate,
  getDateRangePreset,
  getThisMonthRange,
  parseLocalDate,
  toLocalDateString,
} from "../utils/dateHelpers.js";

const PRESETS = [
  { key: "thisWeek", label: "This week" },
  { key: "thisMonth", label: "This month" },
  { key: "lastMonth", label: "Last month" },
  { key: "last6Months", label: "Last 6 months" },
  { key: "thisYear", label: "This Year" },
  { key: "custom", label: "Custom Range" },
];

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const POPOVER_GAP = 8;
const VIEWPORT_PAD = 12;

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date, count) {
  return new Date(date.getFullYear(), date.getMonth() + count, 1);
}

function buildMonthCells(monthDate) {
  const first = startOfMonth(monthDate);
  const startPad = first.getDay();
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - startPad);

  const cells = [];
  for (let i = 0; i < 42; i += 1) {
    const day = new Date(gridStart);
    day.setDate(gridStart.getDate() + i);
    cells.push({
      date: day,
      iso: toLocalDateString(day),
      inMonth: day.getMonth() === monthDate.getMonth(),
      label: day.getDate(),
    });
  }
  return cells;
}

function detectPreset(startDate, endDate) {
  for (const preset of PRESETS) {
    if (preset.key === "custom") continue;
    const range = getDateRangePreset(preset.key);
    if (range && range.startDate === startDate && range.endDate === endDate) {
      return preset.key;
    }
  }
  return "custom";
}

function compareIso(a, b) {
  return String(a || "").localeCompare(String(b || ""));
}

function computePopoverPosition(triggerEl, popoverEl) {
  if (!triggerEl) return null;
  const rect = triggerEl.getBoundingClientRect();
  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;
  const width = Math.min(720, viewportW - VIEWPORT_PAD * 2);
  const preferredHeight = popoverEl?.offsetHeight || 420;

  let left = rect.right - width;
  if (left < VIEWPORT_PAD) left = VIEWPORT_PAD;
  if (left + width > viewportW - VIEWPORT_PAD) {
    left = Math.max(VIEWPORT_PAD, viewportW - VIEWPORT_PAD - width);
  }

  let top = rect.bottom + POPOVER_GAP;
  const spaceBelow = viewportH - rect.bottom - VIEWPORT_PAD;
  const spaceAbove = rect.top - VIEWPORT_PAD;
  if (preferredHeight > spaceBelow && spaceAbove > spaceBelow) {
    top = Math.max(VIEWPORT_PAD, rect.top - preferredHeight - POPOVER_GAP);
  } else if (top + preferredHeight > viewportH - VIEWPORT_PAD) {
    top = Math.max(VIEWPORT_PAD, viewportH - VIEWPORT_PAD - preferredHeight);
  }

  return {
    top: Math.round(top),
    left: Math.round(left),
    width: Math.round(width),
  };
}

export default function DateRangePicker({
  startDate,
  endDate,
  onChange,
  className = "",
}) {
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);
  const defaultRange = getThisMonthRange();
  const [open, setOpen] = useState(false);
  const [popoverStyle, setPopoverStyle] = useState(null);
  const [draftStart, setDraftStart] = useState(startDate || defaultRange.startDate);
  const [draftEnd, setDraftEnd] = useState(endDate || defaultRange.endDate);
  const [preset, setPreset] = useState(() => detectPreset(startDate, endDate));
  const [hoverDate, setHoverDate] = useState(null);
  const [customStep, setCustomStep] = useState("start"); // start | end
  const [leftMonth, setLeftMonth] = useState(() => {
    const parsed = parseLocalDate(startDate || defaultRange.startDate) || new Date();
    return startOfMonth(parsed);
  });

  const rightMonth = useMemo(() => addMonths(leftMonth, 1), [leftMonth]);
  const leftCells = useMemo(() => buildMonthCells(leftMonth), [leftMonth]);
  const rightCells = useMemo(() => buildMonthCells(rightMonth), [rightMonth]);

  const reposition = () => {
    if (!open) return;
    const next = computePopoverPosition(triggerRef.current, popoverRef.current);
    if (next) setPopoverStyle(next);
  };

  useEffect(() => {
    if (!open) {
      setDraftStart(startDate || defaultRange.startDate);
      setDraftEnd(endDate || defaultRange.endDate);
      setPreset(detectPreset(startDate, endDate));
      setCustomStep("start");
      setHoverDate(null);
      const parsed = parseLocalDate(startDate || defaultRange.startDate) || new Date();
      setLeftMonth(startOfMonth(parsed));
      setPopoverStyle(null);
    }
  }, [open, startDate, endDate]);

  useLayoutEffect(() => {
    if (!open) return undefined;
    reposition();
    const frame = window.requestAnimationFrame(reposition);
    return () => window.cancelAnimationFrame(frame);
  }, [open, draftStart, draftEnd, preset, leftMonth]);

  useEffect(() => {
    if (!open) return undefined;
    const onDocMouseDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onReposition = () => reposition();
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [open]);

  const displayStart = formatDisplayDate(startDate);
  const displayEnd = formatDisplayDate(endDate);

  const effectiveEnd =
    preset === "custom" && customStep === "end" && hoverDate && draftStart
      ? compareIso(hoverDate, draftStart) >= 0
        ? hoverDate
        : draftStart
      : draftEnd;

  const rangeStart = draftStart;
  const rangeEnd = effectiveEnd;

  const applyPreset = (key) => {
    setPreset(key);
    setHoverDate(null);
    if (key === "custom") {
      setCustomStep("start");
      return;
    }
    const range = getDateRangePreset(key);
    if (!range) return;
    setDraftStart(range.startDate);
    setDraftEnd(range.endDate);
    setCustomStep("start");
    setLeftMonth(startOfMonth(parseLocalDate(range.startDate) || new Date()));
  };

  const onDayClick = (iso) => {
    setPreset("custom");
    if (customStep === "start" || !draftStart) {
      setDraftStart(iso);
      setDraftEnd(iso);
      setCustomStep("end");
      setHoverDate(null);
      return;
    }

    if (compareIso(iso, draftStart) < 0) {
      setDraftStart(iso);
      setDraftEnd(iso);
      setCustomStep("end");
      setHoverDate(null);
      return;
    }

    setDraftEnd(iso);
    setCustomStep("start");
    setHoverDate(null);
  };

  const handleApply = () => {
    if (!draftStart || !draftEnd) return;
    const start = compareIso(draftStart, draftEnd) <= 0 ? draftStart : draftEnd;
    const end = compareIso(draftStart, draftEnd) <= 0 ? draftEnd : draftStart;
    onChange?.({ startDate: start, endDate: end, preset });
    setOpen(false);
  };

  const handleCancel = () => {
    setOpen(false);
  };

  const dayClassName = (cell) => {
    const classes = ["drp-day"];
    if (!cell.inMonth) classes.push("is-outside");
    if (!rangeStart || !rangeEnd) return classes.join(" ");

    const isStart = cell.iso === rangeStart;
    const isEnd = cell.iso === rangeEnd;
    const inRange =
      compareIso(cell.iso, rangeStart) >= 0 && compareIso(cell.iso, rangeEnd) <= 0;

    if (inRange) classes.push("in-range");
    if (isStart) classes.push("is-start");
    if (isEnd) classes.push("is-end");
    if (isStart && isEnd) classes.push("is-single");
    return classes.join(" ");
  };

  const renderMonth = (monthDate, cells, { showPrev, showNext }) => (
    <div className="drp-month">
      <div className="drp-month-head">
        {showPrev ? (
          <button
            type="button"
            className="drp-nav"
            onClick={() => setLeftMonth((prev) => addMonths(prev, -1))}
            aria-label="Previous month"
          >
            ‹
          </button>
        ) : (
          <span className="drp-nav-spacer" />
        )}
        <strong>
          {monthDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </strong>
        {showNext ? (
          <button
            type="button"
            className="drp-nav"
            onClick={() => setLeftMonth((prev) => addMonths(prev, 1))}
            aria-label="Next month"
          >
            ›
          </button>
        ) : (
          <span className="drp-nav-spacer" />
        )}
      </div>
      <div className="drp-weekdays">
        {WEEKDAYS.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="drp-grid">
        {cells.map((cell) => (
          <button
            key={cell.iso + (cell.inMonth ? "" : "-o")}
            type="button"
            className={dayClassName(cell)}
            onClick={() => onDayClick(cell.iso)}
            onMouseEnter={() => {
              if (preset === "custom" && customStep === "end") setHoverDate(cell.iso);
            }}
            onMouseLeave={() => {
              if (preset === "custom" && customStep === "end") setHoverDate(null);
            }}
          >
            <span>{cell.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className={`date-range-picker ${className}`.trim()} ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className={`drp-trigger${open ? " is-open" : ""}`}
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
      >
        <span className="drp-trigger-icon" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M3 10h18M8 3v4M16 3v4" />
          </svg>
        </span>
        <span className="drp-trigger-text">
          {displayStart && displayEnd ? `${displayStart} – ${displayEnd}` : "Select date range"}
        </span>
        <span className="drp-trigger-caret" aria-hidden="true">
          ▾
        </span>
      </button>

      {open ? (
        <div
          ref={popoverRef}
          className="drp-popover"
          role="dialog"
          aria-label="Date range"
          style={
            popoverStyle
              ? {
                  top: `${popoverStyle.top}px`,
                  left: `${popoverStyle.left}px`,
                  width: `${popoverStyle.width}px`,
                }
              : { visibility: "hidden" }
          }
        >
          <div className="drp-inputs">
            <div className="drp-input-box">
              <span className="drp-input-label">From</span>
              <strong>{formatDisplayDate(draftStart) || "—"}</strong>
            </div>
            <div className="drp-input-box">
              <span className="drp-input-label">To</span>
              <strong>{formatDisplayDate(draftEnd) || "—"}</strong>
            </div>
          </div>

          {preset === "custom" ? (
            <p className="drp-hint">
              {customStep === "end"
                ? "Click an end date (on or after the start)."
                : "Click a start date, then an end date."}
            </p>
          ) : null}

          <div className="drp-body">
            <div className="drp-calendars">
              {renderMonth(leftMonth, leftCells, { showPrev: true, showNext: false })}
              {renderMonth(rightMonth, rightCells, { showPrev: false, showNext: true })}
            </div>
            <aside className="drp-presets">
              {PRESETS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={preset === item.key ? "drp-preset is-active" : "drp-preset"}
                  onClick={() => applyPreset(item.key)}
                >
                  {item.label}
                </button>
              ))}
            </aside>
          </div>

          <div className="drp-actions">
            <button type="button" className="btn btn-inline" onClick={handleApply}>
              Apply
            </button>
            <button type="button" className="btn btn-inline btn-secondary" onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
