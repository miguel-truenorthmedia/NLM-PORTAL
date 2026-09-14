import { useEffect, useMemo, useState } from "react";
import { createTodo, deleteTodo, fetchTodos, updateTodo } from "../../services/api.js";

function formatWhen(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-US", {
    timeZone: "America/New_York",
    month: "numeric",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const EMPTY_FORM = { title: "", note: "" };

/**
 * @param {{ mode?: "active" | "archived" }} props
 */
export default function TodoSheetTab({ mode = "active" }) {
  const archivedView = mode === "archived";
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [editForm, setEditForm] = useState(EMPTY_FORM);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchTodos({ archived: archivedView });
      setRows(data.todos || []);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to load todos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [archivedView]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (row) =>
        String(row.title || "").toLowerCase().includes(q) ||
        String(row.note || "").toLowerCase().includes(q)
    );
  }, [rows, search]);

  const submitCreate = async (event) => {
    event.preventDefault();
    if (!form.title.trim()) {
      setError("Title is required");
      return;
    }
    setCreating(true);
    setError("");
    setMessage("");
    try {
      await createTodo({ title: form.title.trim(), note: form.note.trim(), status: "ongoing" });
      setForm(EMPTY_FORM);
      setMessage("Task added");
      await load();
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to add task");
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (row) => {
    setEditingId(row.id);
    setEditForm({ title: row.title || "", note: row.note || "" });
    setError("");
    setMessage("");
  };

  const cancelEdit = () => {
    setEditingId("");
    setEditForm(EMPTY_FORM);
  };

  const saveEdit = async (id) => {
    if (!editForm.title.trim()) {
      setError("Title is required");
      return;
    }
    setBusyId(id);
    setError("");
    setMessage("");
    try {
      await updateTodo(id, { title: editForm.title.trim(), note: editForm.note.trim() });
      setEditingId("");
      setEditForm(EMPTY_FORM);
      setMessage("Task updated");
      await load();
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to update task");
    } finally {
      setBusyId("");
    }
  };

  const setStatus = async (row, status) => {
    setBusyId(row.id);
    setError("");
    setMessage("");
    try {
      await updateTodo(row.id, { status });
      setMessage(status === "done" ? "Marked done — moved to archive" : "Restored to active");
      await load();
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to update status");
    } finally {
      setBusyId("");
    }
  };

  const remove = async (row) => {
    if (!window.confirm(`Delete “${row.title}”? This cannot be undone.`)) return;
    setBusyId(row.id);
    setError("");
    setMessage("");
    try {
      await deleteTodo(row.id);
      setMessage("Task deleted");
      if (editingId === row.id) cancelEdit();
      await load();
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to delete task");
    } finally {
      setBusyId("");
    }
  };

  return (
    <div className="todo-sheet">
      {!archivedView ? (
        <form className="todo-create" onSubmit={submitCreate}>
          <div className="todo-create-fields">
            <label>
              <span>Task</span>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="What needs doing?"
                maxLength={200}
                disabled={creating}
              />
            </label>
            <label className="todo-create-note">
              <span>Note</span>
              <textarea
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                placeholder="Optional note"
                rows={2}
                disabled={creating}
              />
            </label>
          </div>
          <button type="submit" className="btn btn-primary" disabled={creating}>
            {creating ? "Adding…" : "Add task"}
          </button>
        </form>
      ) : null}

      <div className="todo-toolbar">
        <input
          type="search"
          className="todo-search"
          placeholder="Search tasks…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className="subtle">{filtered.length} task{filtered.length === 1 ? "" : "s"}</span>
      </div>

      {error ? <p className="error-text">{error}</p> : null}
      {message ? <p className="success-text">{message}</p> : null}

      {loading ? (
        <p className="subtle">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="subtle">{archivedView ? "No archived tasks." : "No active tasks yet."}</p>
      ) : (
        <div className="table-wrap">
          <table className="data-table todo-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Task</th>
                <th>Note</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const busy = busyId === row.id;
                const editing = editingId === row.id;
                return (
                  <tr key={row.id} className={row.status === "done" ? "todo-row--done" : undefined}>
                    <td>
                      <span
                        className={
                          row.status === "done" ? "todo-status todo-status--done" : "todo-status todo-status--ongoing"
                        }
                      >
                        {row.status === "done" ? "Done" : "Ongoing"}
                      </span>
                    </td>
                    <td>
                      {editing ? (
                        <input
                          type="text"
                          value={editForm.title}
                          onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                          disabled={busy}
                          maxLength={200}
                        />
                      ) : (
                        <strong>{row.title}</strong>
                      )}
                    </td>
                    <td className="todo-note-cell">
                      {editing ? (
                        <textarea
                          value={editForm.note}
                          onChange={(e) => setEditForm((f) => ({ ...f, note: e.target.value }))}
                          rows={2}
                          disabled={busy}
                        />
                      ) : (
                        <span className="subtle">{row.note || "—"}</span>
                      )}
                    </td>
                    <td className="subtle">{formatWhen(row.lastEditedAt || row.updatedAt)}</td>
                    <td>
                      <div className="todo-actions">
                        {editing ? (
                          <>
                            <button
                              type="button"
                              className="btn btn-primary btn-small"
                              disabled={busy}
                              onClick={() => saveEdit(row.id)}
                            >
                              Save
                            </button>
                            <button type="button" className="btn btn-secondary btn-small" disabled={busy} onClick={cancelEdit}>
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            {!archivedView ? (
                              <button
                                type="button"
                                className="btn btn-primary btn-small"
                                disabled={busy}
                                onClick={() => setStatus(row, "done")}
                              >
                                Mark done
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="btn btn-secondary btn-small"
                                disabled={busy}
                                onClick={() => setStatus(row, "ongoing")}
                              >
                                Restore
                              </button>
                            )}
                            <button
                              type="button"
                              className="btn btn-secondary btn-small"
                              disabled={busy}
                              onClick={() => startEdit(row)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary btn-small"
                              disabled={busy}
                              onClick={() => remove(row)}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
