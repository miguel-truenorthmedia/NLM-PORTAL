import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  createOutreachProspect,
  fetchOutreachProspects,
  updateOutreachProspect,
} from "../../services/api.js";

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

const EMPTY_FORM = { companyName: "", emails: "" };

export default function OutreachSheetTab() {
  const { user, isCeo } = useAuth();
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadProspects = () => {
    setLoading(true);
    setError("");
    return fetchOutreachProspects()
      .then((result) => {
        setRows(result.prospects || []);
      })
      .catch((err) => {
        setRows([]);
        setError(err.response?.data?.error || err.message || "Failed to load outreach sheet");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProspects();
  }, []);

  const filteredRows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((row) => {
      const haystack = [
        row.companyName,
        ...(row.emails || []),
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

  const patchRow = async (id, patch) => {
    setSavingId(id);
    setError("");
    // Optimistic UI so radio selection switches immediately
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        const next = {
          ...row,
          ...patch,
          lastEditedAt: new Date().toISOString(),
          updatedBy: {
            userId: user?.id || user?._id || "",
            name: user?.name || user?.email || row.updatedBy?.name || "",
            email: user?.email || row.updatedBy?.email || "",
          },
        };
        // Mirror backend: clearing outreach also clears status
        if (Object.prototype.hasOwnProperty.call(patch, "reachOutStatus") && !patch.reachOutStatus) {
          next.followUpStatus = "";
          next.dateReachOut = "";
          next.dateFollowUp = "";
        }
        if (patch.reachOutStatus === "Emailed" && !row.reachOutStatus) {
          next.followUpStatus = next.followUpStatus || "No response";
        }
        return next;
      })
    );
    try {
      const result = await updateOutreachProspect(id, patch);
      setRows((prev) => prev.map((row) => (row.id === id ? result.prospect : row)));
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to save change");
      await loadProspects();
    } finally {
      setSavingId("");
    }
  };

  const setStatus = (row, nextStatus) => {
    if (!row.reachOutStatus || savingId === row.id) return;
    if (row.followUpStatus === nextStatus) return;
    patchRow(row.id, { followUpStatus: nextStatus });
  };

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setFormError("");
    setShowAdd(true);
  };

  const closeAdd = () => {
    if (submitting) return;
    setShowAdd(false);
    setForm(EMPTY_FORM);
    setFormError("");
  };

  const submitAdd = async (event) => {
    event.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      const result = await createOutreachProspect({
        companyName: form.companyName,
        emails: form.emails,
      });
      setRows((prev) => [result.prospect, ...prev]);
      closeAdd();
    } catch (err) {
      setFormError(err.response?.data?.error || err.message || "Failed to add prospect");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="outreach-sheet">
      <div className="section-head">
        <div>
          <h3>Outreach Sheet</h3>
          <p className="subtle">
            Mark Outreach when you email them — it locks after the first click. Status defaults to No response; switch to
            Responded when they reply.
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
          <button type="button" className="btn btn-inline" onClick={openAdd}>
            Add prospect
          </button>
        </div>
      </div>

      {error ? <p className="error-text">{error}</p> : null}

      <div className="card">
        <div className="table-wrap">
          <table className="outreach-table">
            <thead>
              <tr>
                <th>Date added</th>
                <th>Company Name</th>
                <th>Email</th>
                <th>Outreach</th>
                <th>Status</th>
                <th>Updated by</th>
              </tr>
            </thead>
            <tbody>
              {!loading && filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="subtle">
                    No prospects match that search.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => {
                  const hasOutreach = Boolean(row.reachOutStatus);
                  const busy = savingId === row.id;
                  const outreachLocked = hasOutreach && !isCeo;
                  // Mutual exclusivity: only one status selected at a time
                  const statusValue =
                    row.followUpStatus === "Responded" ? "Responded" : hasOutreach ? "No response" : "";
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
                      <td className="outreach-cell">
                        <label
                          className={`outreach-radio outreach-radio--emailed${hasOutreach ? " is-on" : ""}${
                            outreachLocked ? " is-locked" : ""
                          }`}
                          title={outreachLocked ? "Only CEO can undo outreach" : undefined}
                        >
                          <input
                            type="checkbox"
                            checked={hasOutreach}
                            disabled={busy || outreachLocked}
                            aria-label={`${row.companyName} outreach emailed`}
                            onChange={() => {
                              if (hasOutreach) {
                                if (!isCeo) return;
                                // Backend clears follow-up when outreach is cleared
                                patchRow(row.id, { reachOutStatus: "" });
                                return;
                              }
                              patchRow(row.id, { reachOutStatus: "Emailed" });
                            }}
                          />
                        </label>
                      </td>
                      <td>
                        {hasOutreach ? (
                          <div className="outreach-radio-group" role="radiogroup" aria-label={`${row.companyName} status`}>
                            <label
                              className={`outreach-radio outreach-radio--no-response${
                                statusValue === "No response" ? " is-on" : ""
                              }`}
                            >
                              <input
                                type="radio"
                                name={`status-${row.id}`}
                                value="No response"
                                checked={statusValue === "No response"}
                                disabled={busy}
                                onChange={() => setStatus(row, "No response")}
                              />
                              <span>No response</span>
                            </label>
                            <label
                              className={`outreach-radio outreach-radio--responded${
                                statusValue === "Responded" ? " is-on" : ""
                              }`}
                            >
                              <input
                                type="radio"
                                name={`status-${row.id}`}
                                value="Responded"
                                checked={statusValue === "Responded"}
                                disabled={busy}
                                onChange={() => setStatus(row, "Responded")}
                              />
                              <span>Responded</span>
                            </label>
                          </div>
                        ) : (
                          <span className="subtle">—</span>
                        )}
                      </td>
                      <td className="outreach-actor-cell">
                        <div>{row.updatedBy?.name || row.createdBy?.name || "—"}</div>
                        <div className="subtle">{formatEditedAt(row.lastEditedAt)}</div>
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
        <div className="modal-backdrop" role="presentation" onClick={closeAdd}>
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-label="Add prospect"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Add prospect</h3>
            <p className="subtle">
              Date added and your name are saved automatically. No need to enter dates.
            </p>
            <form className="spend-form" onSubmit={submitAdd}>
              <label>
                Company Name
                <input
                  type="text"
                  value={form.companyName}
                  onChange={(e) => setForm((prev) => ({ ...prev, companyName: e.target.value }))}
                  required
                  autoFocus
                />
              </label>
              <label>
                Email(s)
                <input
                  type="text"
                  value={form.emails}
                  onChange={(e) => setForm((prev) => ({ ...prev, emails: e.target.value }))}
                  placeholder="name@company.com, other@company.com"
                  required
                />
              </label>
              {formError ? <p className="error-text">{formError}</p> : null}
              <div className="modal-actions">
                <button type="button" className="preset" onClick={closeAdd} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-inline" disabled={submitting}>
                  {submitting ? "Saving..." : "Add prospect"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
