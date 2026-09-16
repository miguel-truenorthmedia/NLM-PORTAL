import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  addOutreachNote,
  createOutreachProspect,
  fetchOutreachProspects,
  updateOutreachProspect,
} from "../../services/api.js";

const DEFAULT_OUTREACH = ["Email", "Form Fill"];
const DEFAULT_STATUSES = [
  "Awaiting response",
  "Continuing attempt at outreach",
  "No response",
  "Currently in communication",
  "Accepted our business",
  "Declined our business",
];

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
 * @param {{ mode?: "active" | "archived" }} props
 */
export default function OutreachSheetTab({ mode = "active" }) {
  const archivedView = mode === "archived";
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

  const loadProspects = () => {
    setLoading(true);
    setError("");
    return fetchOutreachProspects({ archived: archivedView })
      .then((result) => {
        setRows(result.prospects || []);
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
  }, [archivedView]);

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
    if (Boolean(prospect.archived) !== archivedView) {
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
        if (!archivedView) {
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

  const colSpan = 9;

  return (
    <div className="outreach-sheet">
      <div className="section-head">
        <div>
          <h3>{archivedView ? "Archive" : "Outreach Sheet"}</h3>
          <p className="subtle">
            {archivedView
              ? "Not-interested prospects kept for later. Restore anytime to put them back on the active sheet."
              : "Log outreach with a button, then track status. Form Fill links open their webpage form. Notes are individual per prospect."}
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
          {!archivedView ? (
            <button type="button" className="btn btn-inline" onClick={openAdd}>
              Add prospect
            </button>
          ) : null}
        </div>
      </div>

      {error ? <p className="error-text">{error}</p> : null}
      {loading ? <p className="subtle">Loading prospects...</p> : null}

      <div className="card">
        <div className="table-wrap">
          <table className="outreach-table">
            <thead>
              <tr>
                <th>Date added</th>
                <th>Company Name</th>
                <th>Email</th>
                <th>Form Fill</th>
                <th>Outreach</th>
                <th>Status</th>
                <th>Notes</th>
                <th>Updated by</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {!loading && filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={colSpan} className="subtle">
                    {archivedView ? "Archive is empty." : "No prospects match that search."}
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => {
                  const hasOutreach = Boolean(row.reachOutStatus);
                  const busy = savingId === row.id;
                  return (
                    <tr key={row.id}>
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
                              onChange={(e) => patchRow(row.id, { reachOutStatus: e.target.value })}
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
                          <LogOutreachMenu disabled={busy || archivedView} onPick={(method) => logOutreach(row, method)} />
                        )}
                      </td>
                      <td>
                        {hasOutreach ? (
                          <select
                            className="outreach-select"
                            value={row.followUpStatus || ""}
                            disabled={busy}
                            onChange={(e) => patchRow(row.id, { followUpStatus: e.target.value })}
                            aria-label={`${row.companyName} status`}
                          >
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
                      <td className="outreach-row-actions">
                        {archivedView ? (
                          <button
                            type="button"
                            className="btn btn-secondary btn-small"
                            disabled={busy}
                            onClick={() => patchRow(row.id, { archived: false })}
                          >
                            Restore
                          </button>
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
                Email(s)
                <input
                  type="text"
                  value={form.emails}
                  onChange={(e) => setForm((prev) => ({ ...prev, emails: e.target.value }))}
                  placeholder="name@company.com, other@company.com"
                  required
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
            <p className="subtle">Each note is saved individually with your name and timestamp.</p>
            <div className="outreach-notes-list">
              {(notesRow.notes || []).length === 0 ? (
                <p className="subtle">No notes yet.</p>
              ) : (
                [...(notesRow.notes || [])]
                  .slice()
                  .reverse()
                  .map((note) => (
                    <article key={note.id} className="outreach-note-item">
                      <p>{note.text}</p>
                      <p className="subtle">
                        {note.createdBy?.name || note.createdBy?.email || "Unknown"} ·{" "}
                        {formatEditedAt(note.createdAt)}
                      </p>
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
    </div>
  );
}
