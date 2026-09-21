import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  addOutreachNote,
  createBuyer,
  createOutreachProspect,
  fetchBuyers,
  fetchOutreachProspects,
  setOutreachNoteIgnored,
  updateOutreachProspect,
} from "../../services/api.js";

const DEFAULT_OUTREACH = ["Email", "Form Fill"];
const DEFAULT_STATUSES = [
  "Awaiting response",
  "In Communication",
  "Accepted",
  "Declined/not interested",
];

const BUYER_NET_PRESETS = [7, 10, 15, 30, 45, 60];
const BUYER_FREQUENCY_OPTIONS = [
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Every 2 weeks" },
  { value: "monthly", label: "Monthly" },
];
const EMPTY_BUYER_FORM = {
  name: "",
  email: "",
  net: 15,
  invoiceFrequency: "biweekly",
  notes: "",
};

/** Color-coded status dots for the sheet (left of each row + legend). */
const STATUS_DOTS = [
  { status: "", label: "No status yet", tone: "neutral" },
  { status: "Awaiting response", label: "Awaiting response", tone: "white" },
  { status: "In Communication", label: "In Communication", tone: "teal" },
  { status: "Accepted", label: "Accepted", tone: "green" },
  { status: "Declined/not interested", label: "Declined / not interested", tone: "red" },
];

const VIEW_COPY = {
  active: {
    title: "Outreach Sheet",
    description:
      "Log outreach with a button, then track status. Form Fill links open their webpage form. Notes are individual per prospect.",
    empty: "No prospects match that search.",
  },
  no_response: {
    title: "No response",
    description:
      "Auto-moved after 7 days awaiting a reply. Set In Communication to pull them back to the Outreach Sheet, or Declined to archive.",
    empty: "No prospects in No response.",
  },
  follow_up: {
    title: "Follow-up",
    description:
      "Auto-moved after 7 more days with no response. Set In Communication to return them to the Outreach Sheet, or Declined to archive.",
    empty: "No prospects in Follow-up.",
  },
  accepted: {
    title: "Accepted",
    description:
      "Accepted prospects ready to onboard as buyers. Onboard Buyer opens the same Add Buyer form used in Accounting.",
    empty: "No accepted prospects yet.",
  },
  archived: {
    title: "Archive",
    description:
      "Declined / not-interested prospects kept for later. Restore anytime to put them back on the Outreach Sheet.",
    empty: "Archive is empty.",
  },
};

function findMatchedBuyer(prospect, buyers = []) {
  const name = String(prospect?.companyName || "")
    .trim()
    .toLowerCase();
  const emails = new Set(
    (prospect?.emails || []).map((email) => String(email || "").trim().toLowerCase()).filter(Boolean)
  );
  return (
    buyers.find((buyer) => {
      const buyerName = String(buyer.name || "")
        .trim()
        .toLowerCase();
      if (name && buyerName === name) return true;
      const buyerEmail = String(buyer.email || "")
        .trim()
        .toLowerCase();
      if (buyerEmail && emails.has(buyerEmail)) return true;
      return false;
    }) || null
  );
}
function statusDotTone(followUpStatus = "") {
  const hit = STATUS_DOTS.find((item) => item.status === (followUpStatus || ""));
  return hit?.tone || "neutral";
}

function formatEditedAt(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-US", {
    timeZone: "America/New_York",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatAddedAt(row) {
  const fromCreated = formatEditedAt(row.createdAt);
  if (fromCreated) return fromCreated;
  if (!row.dateAdded) return "—";
  const [year, month, day] = String(row.dateAdded).split("-").map(Number);
  if (!year || !month || !day) return String(row.dateAdded);
  return `${month}/${day}`;
}

const EMPTY_FORM = { companyName: "", emails: "", formFillUrl: "" };

function LogOutreachMenu({ disabled, onPick }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div className="row-menu" ref={rootRef}>
      <button
        type="button"
        className="btn btn-secondary btn-small"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
      >
        Log outreach
      </button>
      {open ? (
        <div className="row-menu-dropdown" role="menu">
          {DEFAULT_OUTREACH.map((method) => (
            <button
              key={method}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onPick(method);
              }}
            >
              {method}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/**
 * @param {{ mode?: "active" | "no_response" | "follow_up" | "accepted" | "archived" }} props
 */
export default function OutreachSheetTab({ mode = "active" }) {
  const archivedView = mode === "archived";
  const liveBucket = archivedView ? null : mode;
  const viewCopy = VIEW_COPY[mode] || VIEW_COPY.active;
  const { user, isCeo } = useAuth();
  const [rows, setRows] = useState([]);
  const [reachOptions, setReachOptions] = useState(DEFAULT_OUTREACH);
  const [statusOptions, setStatusOptions] = useState(DEFAULT_STATUSES);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState("");

  const [showAdd, setShowAdd] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [companySuggestOpen, setCompanySuggestOpen] = useState(false);
  const [matchPool, setMatchPool] = useState([]);
  const companyFieldRef = useRef(null);

  const [notesRow, setNotesRow] = useState(null);
  const [noteText, setNoteText] = useState("");
  const [noteError, setNoteError] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);

  const [buyers, setBuyers] = useState([]);
  const [onboardRow, setOnboardRow] = useState(null);
  const [buyerForm, setBuyerForm] = useState(EMPTY_BUYER_FORM);
  const [buyerFormError, setBuyerFormError] = useState("");
  const [buyerSubmitting, setBuyerSubmitting] = useState(false);

  const isAcceptedView = mode === "accepted";
  const colSpan = isAcceptedView ? 7 : 10;

  const belongsInView = (prospect) => {
    if (!prospect) return false;
    if (archivedView) return Boolean(prospect.archived);
    if (prospect.archived) return false;
    if (mode === "accepted") {
      return (
        prospect.followUpStatus === "Accepted" &&
        (prospect.pipelineBucket || "active") === "accepted"
      );
    }
    if ((prospect.pipelineBucket || "active") === "accepted") return false;
    return (prospect.pipelineBucket || "active") === liveBucket;
  };

  const loadProspects = () => {
    setLoading(true);
    setError("");
    return fetchOutreachProspects({ view: mode, archived: archivedView })
      .then((result) => {
        const prospects = result.prospects || [];
        setRows(
          mode === "archived"
            ? prospects
            : prospects.filter((p) => {
                if (mode === "accepted") {
                  return p.followUpStatus === "Accepted" && (p.pipelineBucket || "") === "accepted";
                }
                if ((p.pipelineBucket || "active") === "accepted") return false;
                return (p.pipelineBucket || "active") === mode;
              })
        );
        if (result.meta?.reachOutStatuses?.length) setReachOptions(result.meta.reachOutStatuses);
        if (result.meta?.followUpStatuses?.length) setStatusOptions(result.meta.followUpStatuses);
      })
      .catch((err) => {
        setRows([]);
        setError(err.response?.data?.error || err.message || "Failed to load outreach sheet");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProspects();
  }, [mode]);

  useEffect(() => {
    if (!isAcceptedView) {
      setBuyers([]);
      return undefined;
    }
    let cancelled = false;
    fetchBuyers()
      .then((result) => {
        if (!cancelled) setBuyers(result.buyers || []);
      })
      .catch(() => {
        if (!cancelled) setBuyers([]);
      });
    return () => {
      cancelled = true;
    };
  }, [isAcceptedView]);

  const matchedBuyerByProspectId = useMemo(() => {
    const map = new Map();
    if (!isAcceptedView) return map;
    for (const row of rows) {
      const match = findMatchedBuyer(row, buyers);
      if (match) map.set(row.id, match);
    }
    return map;
  }, [isAcceptedView, rows, buyers]);

  const filteredRows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((row) => {
      const haystack = [
        row.companyName,
        ...(row.emails || []),
        row.formFillUrl,
        row.reachOutStatus,
        row.followUpStatus,
        row.updatedBy?.name,
        row.createdBy?.name,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [rows, search]);

  const companyMatches = useMemo(() => {
    const needle = form.companyName.trim().toLowerCase();
    if (!needle || needle.length < 1) return [];
    const pool = matchPool.length ? matchPool : rows;
    return pool
      .filter((row) => {
        if (editingRow?.id && row.id === editingRow.id) return false;
        return String(row.companyName || "")
          .toLowerCase()
          .includes(needle);
      })
      .slice(0, 8);
  }, [form.companyName, matchPool, rows, editingRow]);

  useEffect(() => {
    if (!showAdd || !companySuggestOpen) return undefined;
    const onDoc = (event) => {
      if (companyFieldRef.current && !companyFieldRef.current.contains(event.target)) {
        setCompanySuggestOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [showAdd, companySuggestOpen]);

  const applyProspect = (prospect) => {
    if (!prospect) return;
    if (!belongsInView(prospect)) {
      setRows((prev) => prev.filter((row) => row.id !== prospect.id));
      return;
    }
    setRows((prev) => {
      const exists = prev.some((row) => row.id === prospect.id);
      if (!exists) return [prospect, ...prev];
      return prev.map((row) => (row.id === prospect.id ? prospect : row));
    });
  };
  const patchRow = async (id, patch) => {
    setSavingId(id);
    setError("");
    try {
      const result = await updateOutreachProspect(id, patch);
      applyProspect(result.prospect);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to save change");
      await loadProspects();
    } finally {
      setSavingId("");
    }
  };

  const logOutreach = async (row, method) => {
    if (method === "Form Fill" && !row.formFillUrl) {
      setError(`Add a Form Fill URL for ${row.companyName} before logging Form Fill outreach.`);
      setEditingRow(row);
      setForm({
        companyName: row.companyName || "",
        emails: (row.emails || []).join(", "),
        formFillUrl: row.formFillUrl || "",
      });
      setFormError("Form Fill URL is required for this outreach method.");
      setCompanySuggestOpen(false);
      setShowAdd(true);
      return;
    }
    await patchRow(row.id, { reachOutStatus: method });
  };

  const openAdd = () => {
    setEditingRow(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setCompanySuggestOpen(false);
    setShowAdd(true);
    setMatchPool(rows);
    // Include archived so duplicates aren't re-created from the other tab
    fetchOutreachProspects({ archived: true })
      .then((result) => {
        const archived = result.prospects || [];
        setMatchPool((prev) => {
          const byId = new Map();
          for (const row of [...prev, ...archived]) byId.set(row.id, row);
          return [...byId.values()];
        });
      })
      .catch(() => {
        /* keep active rows as match pool */
      });
  };

  const openEdit = (row) => {
    setEditingRow(row);
    setForm({
      companyName: row.companyName || "",
      emails: (row.emails || []).join(", "),
      formFillUrl: row.formFillUrl || "",
    });
    setFormError("");
    setCompanySuggestOpen(false);
    setShowAdd(true);
  };

  const selectExistingProspect = (row) => {
    setEditingRow(row);
    setForm({
      companyName: row.companyName || "",
      emails: (row.emails || []).join(", "),
      formFillUrl: row.formFillUrl || "",
    });
    setFormError("");
    setCompanySuggestOpen(false);
  };

  const closeFormModal = () => {
    if (submitting) return;
    setShowAdd(false);
    setEditingRow(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setCompanySuggestOpen(false);
    setMatchPool([]);
  };

  const submitForm = async (event) => {
    event.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      if (editingRow) {
        const result = await updateOutreachProspect(editingRow.id, {
          companyName: form.companyName,
          emails: form.emails,
          formFillUrl: form.formFillUrl,
        });
        applyProspect(result.prospect);
      } else {
        const result = await createOutreachProspect({
          companyName: form.companyName,
          emails: form.emails,
          formFillUrl: form.formFillUrl,
        });
        if (!archivedView && mode === "active") {
          setRows((prev) => [result.prospect, ...prev]);
        }
      }
      closeFormModal();
    } catch (err) {
      setFormError(err.response?.data?.error || err.message || "Failed to save prospect");
    } finally {
      setSubmitting(false);
    }
  };

  const openOnboardBuyer = (row) => {
    setOnboardRow(row);
    setBuyerForm({
      name: row.companyName || "",
      email: (row.emails || [])[0] || "",
      net: 15,
      invoiceFrequency: "biweekly",
      notes: "",
    });
    setBuyerFormError("");
  };

  const closeOnboardBuyer = ({ force = false } = {}) => {
    if (buyerSubmitting && !force) return;
    setOnboardRow(null);
    setBuyerForm(EMPTY_BUYER_FORM);
    setBuyerFormError("");
  };

  const submitOnboardBuyer = async (event) => {
    event.preventDefault();
    if (!onboardRow) return;
    setBuyerFormError("");
    setBuyerSubmitting(true);
    try {
      const result = await createBuyer({
        name: buyerForm.name.trim(),
        email: buyerForm.email.trim(),
        net: Number(buyerForm.net),
        invoiceFrequency: buyerForm.invoiceFrequency,
        notes: buyerForm.notes.trim(),
        active: true,
      });
      const created = result.buyer || result;
      setBuyers((prev) => {
        const next = [...prev];
        const id = created?.id;
        if (id && !next.some((b) => b.id === id)) next.push(created);
        return next;
      });
      closeOnboardBuyer({ force: true });
    } catch (err) {
      setBuyerFormError(err.response?.data?.error || err.message || "Failed to add buyer");
      try {
        const refreshed = await fetchBuyers();
        setBuyers(refreshed.buyers || []);
      } catch {
        /* ignore */
      }
    } finally {
      setBuyerSubmitting(false);
    }
  };

  const openNotes = (row) => {
    setNotesRow(row);
    setNoteText("");
    setNoteError("");
  };

  const closeNotes = () => {
    if (noteSaving) return;
    setNotesRow(null);
    setNoteText("");
    setNoteError("");
  };

  const submitNote = async (event) => {
    event.preventDefault();
    if (!notesRow) return;
    setNoteSaving(true);
    setNoteError("");
    try {
      const result = await addOutreachNote(notesRow.id, { text: noteText });
      applyProspect(result.prospect);
      setNotesRow(result.prospect);
      setNoteText("");
    } catch (err) {
      setNoteError(err.response?.data?.error || err.message || "Failed to save note");
    } finally {
      setNoteSaving(false);
    }
  };

  const toggleNoteIgnored = async (note) => {
    if (!notesRow || !note?.id) return;
    const nextIgnored = !note.ignored;
    setNotesRow((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        notes: (prev.notes || []).map((n) =>
          n.id === note.id ? { ...n, ignored: nextIgnored } : n
        ),
      };
    });
    try {
      const result = await setOutreachNoteIgnored(notesRow.id, note.id, nextIgnored);
      applyProspect(result.prospect);
      setNotesRow(result.prospect);
    } catch (err) {
      setNotesRow((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          notes: (prev.notes || []).map((n) =>
            n.id === note.id ? { ...n, ignored: Boolean(note.ignored) } : n
          ),
        };
      });
      setNoteError(err.response?.data?.error || err.message || "Failed to update note");
    }
  };

  return (
    <div className="outreach-sheet">
      <div className="section-head">
        <div>
          <h3>{viewCopy.title}</h3>
          <p className="subtle">
            {viewCopy.description}
            {user?.name || user?.email ? ` Signed in as ${user.name || user.email}.` : ""}
          </p>
        </div>
        <div className="outreach-actions">
          <label className="outreach-search">
            <span className="visually-hidden">Search</span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search company or email"
              autoComplete="off"
            />
          </label>
          {mode === "active" ? (
            <button type="button" className="btn btn-inline" onClick={openAdd}>
              Add prospect
            </button>
          ) : null}
        </div>
      </div>

      {!isAcceptedView ? (
        <div className="outreach-status-legend" aria-label="Status color legend">
          {STATUS_DOTS.map((item) => (
            <span key={item.tone + item.label} className="outreach-status-legend-item">
              <span
                className={`outreach-status-dot outreach-status-dot--${item.tone}`}
                aria-hidden="true"
              />
              {item.label}
            </span>
          ))}
        </div>
      ) : null}

      {error ? <p className="error-text">{error}</p> : null}
      {loading ? <p className="subtle">Loading prospects...</p> : null}

      <div className="card">
        <div className="table-wrap">
          <table className="outreach-table">
            <thead>
              <tr>
                <th className="outreach-status-col" scope="col">
                  <span className="visually-hidden">Status color</span>
                </th>
                <th>Date added</th>
                <th>Company Name</th>
                <th>Email</th>
                {!isAcceptedView ? (
                  <>
                    <th>Form Fill</th>
                    <th>Outreach</th>
                    <th>Status</th>
                  </>
                ) : null}
                <th>Notes</th>
                <th>Updated by</th>
                <th>{isAcceptedView ? "Buyer" : ""}</th>
              </tr>
            </thead>
            <tbody>
              {!loading && filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={colSpan} className="subtle">
                    {search.trim() ? "No prospects match that search." : viewCopy.empty}
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => {
                  const hasOutreach = Boolean(row.reachOutStatus);
                  const busy = savingId === row.id;
                  const tone = statusDotTone(hasOutreach ? row.followUpStatus : "");
                  const statusLabel =
                    STATUS_DOTS.find((item) => item.status === (hasOutreach ? row.followUpStatus || "" : ""))
                      ?.label || "No status yet";
                  const matchedBuyer = isAcceptedView
                    ? matchedBuyerByProspectId.get(row.id) || null
                    : null;
                  return (
                    <tr key={row.id}>
                      <td className="outreach-status-col">
                        <span
                          className={`outreach-status-dot outreach-status-dot--${tone}`}
                          title={statusLabel}
                          aria-label={statusLabel}
                        />
                      </td>
                      <td className="outreach-date-cell">{formatAddedAt(row)}</td>
                      <td>
                        <strong>{row.companyName}</strong>
                      </td>
                      <td>
                        <div className="outreach-emails">
                          {(row.emails || []).map((email) => (
                            <a key={email} href={`mailto:${email}`} className="outreach-email">
                              {email}
                            </a>
                          ))}
                        </div>
                      </td>
                      {!isAcceptedView ? (
                        <>
                          <td>
                            {row.formFillUrl ? (
                              <a
                                className="outreach-form-link"
                                href={row.formFillUrl}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Form Fill
                              </a>
                            ) : (
                              <span className="subtle">—</span>
                            )}
                          </td>
                          <td className="outreach-cell">
                            {hasOutreach ? (
                              <div className="outreach-select-stack">
                                <select
                                  className="outreach-select"
                                  value={row.reachOutStatus}
                                  disabled={busy}
                                  onChange={(e) =>
                                    patchRow(row.id, { reachOutStatus: e.target.value })
                                  }
                                  aria-label={`${row.companyName} outreach method`}
                                >
                                  {reachOptions.map((option) => (
                                    <option key={option} value={option}>
                                      {option}
                                    </option>
                                  ))}
                                </select>
                                {isCeo ? (
                                  <button
                                    type="button"
                                    className="btn btn-secondary btn-small"
                                    disabled={busy}
                                    title="Reset outreach to default"
                                    onClick={() => {
                                      if (
                                        window.confirm(
                                          `Reset outreach for ${row.companyName} back to default? Status will clear too.`
                                        )
                                      ) {
                                        patchRow(row.id, { reachOutStatus: "" });
                                      }
                                    }}
                                  >
                                    Reset
                                  </button>
                                ) : null}
                              </div>
                            ) : (
                              <LogOutreachMenu
                                disabled={busy || archivedView}
                                onPick={(method) => logOutreach(row, method)}
                              />
                            )}
                          </td>
                          <td>
                            {hasOutreach ? (
                              <select
                                className="outreach-select"
                                value={row.followUpStatus || ""}
                                disabled={busy}
                                onChange={(e) =>
                                  patchRow(row.id, { followUpStatus: e.target.value })
                                }
                                aria-label={`${row.companyName} status`}
                              >
                                <option value="">No status yet</option>
                                {statusOptions.map((option) => (
                                  <option key={option} value={option}>
                                    {option}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span className="subtle">—</span>
                            )}
                          </td>
                        </>
                      ) : null}
                      <td>
                        <button
                          type="button"
                          className="btn btn-secondary btn-small"
                          onClick={() => openNotes(row)}
                        >
                          Notes{row.noteCount ? ` (${row.noteCount})` : ""}
                        </button>
                      </td>
                      <td className="outreach-actor-cell">
                        <div>{row.updatedBy?.name || row.createdBy?.name || "—"}</div>
                        <div className="subtle">{formatEditedAt(row.lastEditedAt)}</div>
                      </td>
                      <td className={isAcceptedView ? "outreach-buyer-cell" : undefined}>
                        <div
                          className={`outreach-row-actions${isAcceptedView ? " outreach-row-actions--buyer" : ""}`}
                        >
                        {archivedView ? (
                          <button
                            type="button"
                            className="btn btn-secondary btn-small"
                            disabled={busy}
                            onClick={() => patchRow(row.id, { archived: false })}
                          >
                            Restore
                          </button>
                        ) : isAcceptedView ? (
                          matchedBuyer ? (
                            <span
                              className="outreach-onboarded-badge"
                              title={`Matched buyer: ${matchedBuyer.name}`}
                            >
                              Already on buyers list
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-inline btn-small"
                              onClick={() => openOnboardBuyer(row)}
                            >
                              Onboard Buyer
                            </button>
                          )
                        ) : (
                          <>
                            <button
                              type="button"
                              className="btn btn-secondary btn-small"
                              disabled={busy}
                              title="Not interested — move to Archive"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Archive ${row.companyName}? They’ll move to the Archive tab.`
                                  )
                                ) {
                                  patchRow(row.id, { archived: true });
                                }
                              }}
                            >
                              Not interested
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary btn-small"
                              disabled={busy}
                              onClick={() => openEdit(row)}
                            >
                              Edit
                            </button>
                          </>
                        )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <p className="subtle outreach-footer">
          Showing {filteredRows.length} of {rows.length} prospects
        </p>
      </div>

      {showAdd ? (
        <div className="modal-backdrop" role="presentation" onClick={closeFormModal}>
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-label={editingRow ? "Edit prospect" : "Add prospect"}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>{editingRow ? "Update prospect" : "Add prospect"}</h3>
            <p className="subtle">
              {editingRow
                ? editingRow.archived
                  ? "This prospect is in Archive. Saving updates that record."
                  : "Existing prospect selected — update instead of creating a duplicate."
                : "Date added and your name are saved automatically. Start typing a company to find existing prospects."}
            </p>
            <form className="spend-form" onSubmit={submitForm} autoComplete="off">
              <label className="outreach-company-field" ref={companyFieldRef}>
                Company Name
                <input
                  type="text"
                  value={form.companyName}
                  onChange={(e) => {
                    const companyName = e.target.value;
                    setForm((prev) => ({ ...prev, companyName }));
                    setCompanySuggestOpen(true);
                    if (
                      editingRow &&
                      companyName.trim().toLowerCase() !==
                        String(editingRow.companyName || "").trim().toLowerCase()
                    ) {
                      // Typing a different name after a match → back to create mode
                      setEditingRow(null);
                    }
                  }}
                  onFocus={() => setCompanySuggestOpen(true)}
                  required
                  autoFocus
                  autoComplete="off"
                />
                {companySuggestOpen && companyMatches.length > 0 ? (
                  <ul className="outreach-company-suggest" role="listbox">
                    {companyMatches.map((row) => (
                      <li key={row.id}>
                        <button
                          type="button"
                          role="option"
                          onClick={() => selectExistingProspect(row)}
                        >
                          <span>{row.companyName}</span>
                          <span className="subtle">
                            {(row.emails || []).join(", ") || "No email"}
                            {row.archived ? " · Archive" : ""}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </label>
              <label>
                Email(s) <span className="subtle">(optional)</span>
                <input
                  type="text"
                  value={form.emails}
                  onChange={(e) => setForm((prev) => ({ ...prev, emails: e.target.value }))}
                  placeholder="name@company.com, other@company.com — leave blank if none"
                  autoComplete="off"
                />
              </label>
              <label>
                Form Fill URL (optional)
                <input
                  type="url"
                  value={form.formFillUrl}
                  onChange={(e) => setForm((prev) => ({ ...prev, formFillUrl: e.target.value }))}
                  placeholder="https://example.com/apply"
                  autoComplete="off"
                />
              </label>
              {formError ? <p className="error-text">{formError}</p> : null}
              <div className="modal-actions">
                <button type="button" className="preset" onClick={closeFormModal} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-inline" disabled={submitting}>
                  {submitting ? "Saving..." : editingRow ? "Update" : "Add prospect"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {notesRow ? (
        <div className="modal-backdrop" role="presentation" onClick={closeNotes}>
          <div
            className="modal-card modal-card--wide"
            role="dialog"
            aria-modal="true"
            aria-label={`Notes for ${notesRow.companyName}`}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Notes — {notesRow.companyName}</h3>
            <p className="subtle">
              Each note is saved individually with your name and timestamp. Mark a note to cross it
              out when it no longer matters.
            </p>
            <div className="outreach-notes-list">
              {(notesRow.notes || []).length === 0 ? (
                <p className="subtle">No notes yet.</p>
              ) : (
                [...(notesRow.notes || [])]
                  .slice()
                  .reverse()
                  .map((note) => (
                    <article
                      key={note.id}
                      className={
                        note.ignored
                          ? "outreach-note-item outreach-note-item--ignored"
                          : "outreach-note-item"
                      }
                    >
                      <label
                        className="outreach-note-ignore"
                        title={note.ignored ? "Uncross note" : "Cross out / ignore note"}
                      >
                        <input
                          type="checkbox"
                          className="outreach-note-ignore-input"
                          checked={Boolean(note.ignored)}
                          onChange={() => toggleNoteIgnored(note)}
                          aria-label={note.ignored ? "Uncross note" : "Ignore note"}
                        />
                        <span className="outreach-note-ignore-mark" aria-hidden="true" />
                      </label>
                      <div className="outreach-note-body">
                        <p className={note.ignored ? "outreach-note-text--ignored" : undefined}>
                          {note.text}
                        </p>
                        <p className="subtle">
                          {note.createdBy?.name || note.createdBy?.email || "Unknown"} ·{" "}
                          {formatEditedAt(note.createdAt)}
                          {note.ignored ? " · ignored" : ""}
                        </p>
                      </div>
                    </article>
                  ))
              )}
            </div>
            <form className="spend-form" onSubmit={submitNote}>
              <label>
                Add note
                <textarea
                  rows={3}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Call notes, objections, next steps…"
                  required
                />
              </label>
              {noteError ? <p className="error-text">{noteError}</p> : null}
              <div className="modal-actions">
                <button type="button" className="preset" onClick={closeNotes} disabled={noteSaving}>
                  Close
                </button>
                <button type="submit" className="btn btn-inline" disabled={noteSaving}>
                  {noteSaving ? "Saving..." : "Add note"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {onboardRow ? (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => closeOnboardBuyer()}
        >
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="onboard-buyer-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="onboard-buyer-title">Add Buyer</h3>
            <p className="subtle">
              Onboarding <strong>{onboardRow.companyName}</strong> into Accounting → Buyers.
            </p>
            <form className="buyer-form" onSubmit={submitOnboardBuyer} autoComplete="off">
              <label>
                Buyer name
                <input
                  type="text"
                  value={buyerForm.name}
                  onChange={(e) => setBuyerForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Elijay Marketing"
                  required
                  autoFocus
                  autoComplete="off"
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={buyerForm.email}
                  onChange={(e) => setBuyerForm((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="billing@buyer.com"
                  required
                  autoComplete="off"
                />
              </label>
              <label>
                Net pay
                <select
                  value={Number(buyerForm.net)}
                  onChange={(e) =>
                    setBuyerForm((prev) => ({ ...prev, net: Number(e.target.value) }))
                  }
                  required
                >
                  {BUYER_NET_PRESETS.map((days) => (
                    <option key={days} value={days}>
                      Net {days}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Invoice frequency
                <select
                  value={buyerForm.invoiceFrequency}
                  onChange={(e) =>
                    setBuyerForm((prev) => ({ ...prev, invoiceFrequency: e.target.value }))
                  }
                  required
                >
                  {BUYER_FREQUENCY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Notes (optional)
                <input
                  type="text"
                  value={buyerForm.notes}
                  onChange={(e) => setBuyerForm((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Optional"
                  autoComplete="off"
                />
              </label>
              {buyerFormError ? <p className="error-text">{buyerFormError}</p> : null}
              <div className="modal-actions">
                <button
                  type="button"
                  className="preset"
                  onClick={() => closeOnboardBuyer()}
                  disabled={buyerSubmitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-inline" disabled={buyerSubmitting}>
                  {buyerSubmitting ? "Saving..." : "Add buyer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
