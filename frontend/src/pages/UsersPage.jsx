import { useEffect, useMemo, useState } from "react";

import {
  createPasswordResetLink,
  createUserInvite,
  deleteUser,
  fetchUsersAdmin,
  updateUser,
} from "../services/authApi.js";
import { useAuth } from "../context/AuthContext.jsx";

const ROLE_OPTIONS = [
  { value: "media_buyer", label: "Media buyer" },
  { value: "admin", label: "Admin" },
  { value: "ceo", label: "CEO" },
];

function formatWhen(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}

function buildLink(token, kind) {
  const base = String(import.meta.env.BASE_URL || "/").replace(/\/$/, "");
  const path = kind === "password_reset" ? "reset-password" : "invite";
  return `${window.location.origin}${base}/${path}/${token}`;
}

function statusTone(status) {
  if (status === "pending") return "users-status--pending";
  if (status === "used") return "users-status--used";
  if (status === "expired") return "users-status--expired";
  return "users-status--revoked";
}

export default function UsersPage() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [roles, setRoles] = useState(ROLE_OPTIONS.map((r) => r.value));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [email, setEmail] = useState("");
  const [role, setRole] = useState("media_buyer");
  const [creating, setCreating] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState(false);

  const [busyId, setBusyId] = useState("");
  const [resetLink, setResetLink] = useState("");
  const [resetCopied, setResetCopied] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchUsersAdmin();
      setUsers(data.users || []);
      setInvites(data.invites || []);
      if (data.meta?.roles?.length) setRoles(data.meta.roles);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const pendingInvites = useMemo(
    () => (invites || []).filter((row) => row.status === "pending"),
    [invites]
  );
  const recentInvites = useMemo(() => (invites || []).slice(0, 20), [invites]);

  const copyText = async (text, kind) => {
    try {
      await navigator.clipboard.writeText(text);
      if (kind === "invite") {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        setResetCopied(true);
        setTimeout(() => setResetCopied(false), 2000);
      }
    } catch {
      setError("Could not copy — select the link and copy manually");
    }
  };

  const submitInvite = async (event) => {
    event.preventDefault();
    setCreating(true);
    setError("");
    setMessage("");
    setInviteLink("");
    try {
      const invite = await createUserInvite({ email, role });
      const link = buildLink(invite.token, "invite");
      setInviteLink(link);
      setMessage(`Invite created for ${invite.email}. Link expires in 24 hours and works once.`);
      setEmail("");
      await load();
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to create invite");
    } finally {
      setCreating(false);
    }
  };

  const changeRole = async (userId, nextRole) => {
    setBusyId(userId);
    setError("");
    setMessage("");
    try {
      await updateUser(userId, { role: nextRole });
      setMessage("Role updated");
      await load();
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to update role");
    } finally {
      setBusyId("");
    }
  };

  const removeUser = async (user) => {
    if (!window.confirm(`Delete ${user.email}? This cannot be undone.`)) return;
    setBusyId(user._id || user.id);
    setError("");
    setMessage("");
    try {
      await deleteUser(user._id || user.id);
      setMessage(`Deleted ${user.email}`);
      await load();
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to delete user");
    } finally {
      setBusyId("");
    }
  };

  const resetPassword = async (user) => {
    setBusyId(user._id || user.id);
    setError("");
    setMessage("");
    setResetLink("");
    try {
      const invite = await createPasswordResetLink(user._id || user.id);
      const link = buildLink(invite.token, "password_reset");
      setResetLink(link);
      setMessage(`Password reset link created for ${user.email} (24h, one-time).`);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to create reset link");
    } finally {
      setBusyId("");
    }
  };

  return (
    <div className="users-page">
      <div className="section-head">
        <div>
          <h2>Users</h2>
          <p className="subtle">
            CEO-only. Invite by company email (that email is their login). Links expire in 24 hours and can only be
            used once.
          </p>
        </div>
      </div>

      {error ? <p className="error-text">{error}</p> : null}
      {message ? <p className="subtle">{message}</p> : null}

      <div className="users-grid">
        <section className="card">
          <h3>Invite user</h3>
          <p className="subtle">Choose role first, then copy the link and send it yourself.</p>
          <form className="spend-form" onSubmit={submitInvite}>
            <label>
              Company email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
              />
            </label>
            <label>
              Role
              <select value={role} onChange={(e) => setRole(e.target.value)} required>
                {ROLE_OPTIONS.filter((opt) => roles.includes(opt.value)).map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className="btn btn-inline" disabled={creating}>
              {creating ? "Creating..." : "Create invite link"}
            </button>
          </form>

          {inviteLink ? (
            <div className="users-link-box">
              <label>
                Copy invite link
                <textarea readOnly rows={3} value={inviteLink} onFocus={(e) => e.target.select()} />
              </label>
              <button type="button" className="btn btn-inline" onClick={() => copyText(inviteLink, "invite")}>
                {copied ? "Copied" : "Copy link"}
              </button>
            </div>
          ) : null}
        </section>

        <section className="card">
          <h3>Pending invites</h3>
          <p className="subtle">{pendingInvites.length} active · expired ones need a new link</p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Expires</th>
                </tr>
              </thead>
              <tbody>
                {recentInvites.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="subtle">
                      No invites yet.
                    </td>
                  </tr>
                ) : (
                  recentInvites.map((row) => (
                    <tr key={row.id}>
                      <td>{row.email}</td>
                      <td>{row.role}</td>
                      <td>
                        <span className={`users-status ${statusTone(row.status)}`}>{row.status}</span>
                      </td>
                      <td className="subtle">{formatWhen(row.expiresAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {resetLink ? (
        <section className="card users-link-box">
          <h3>Password reset link</h3>
          <label>
            Copy reset link
            <textarea readOnly rows={3} value={resetLink} onFocus={(e) => e.target.select()} />
          </label>
          <button type="button" className="btn btn-inline" onClick={() => copyText(resetLink, "reset")}>
            {resetCopied ? "Copied" : "Copy link"}
          </button>
        </section>
      ) : null}

      <section className="card">
        <div className="section-head">
          <div>
            <h3>Manage users</h3>
            <p className="subtle">Change roles, issue password reset links, or delete accounts.</p>
          </div>
        </div>
        {loading ? <p className="subtle">Loading users...</p> : null}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Name</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const id = user._id || user.id;
                const isSelf = id === (me?._id || me?.id);
                const busy = busyId === id;
                return (
                  <tr key={id}>
                    <td>
                      <strong>{user.email}</strong>
                      {isSelf ? <div className="subtle">You</div> : null}
                    </td>
                    <td>{user.name || "—"}</td>
                    <td>
                      <select
                        value={user.role}
                        disabled={busy}
                        onChange={(e) => changeRole(id, e.target.value)}
                      >
                        {ROLE_OPTIONS.filter((opt) => roles.includes(opt.value)).map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <span className={`users-status ${user.active ? "users-status--used" : "users-status--revoked"}`}>
                        {user.active ? "active" : "inactive"}
                      </span>
                    </td>
                    <td className="users-actions">
                      <button
                        type="button"
                        className="btn btn-secondary btn-small"
                        disabled={busy}
                        onClick={() => resetPassword(user)}
                      >
                        Reset password
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-small"
                        disabled={busy || isSelf}
                        onClick={() => removeUser(user)}
                        title={isSelf ? "You cannot delete yourself" : "Delete user"}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
