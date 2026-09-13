import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { acceptInviteToken, peekInviteToken, setAuthToken } from "../services/authApi.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import logoDark from "../../assets/nlm_logo_dark.png";
import logoLight from "../../assets/nlm_logo_light.png";

export default function InviteAcceptPage({ mode = "invite" }) {
  const { token } = useParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const { theme } = useTheme();
  const logoSrc = theme === "dark" ? logoLight : logoDark;

  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isReset = mode === "password_reset" || invite?.type === "password_reset";

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    peekInviteToken(token)
      .then((data) => {
        if (cancelled) return;
        setInvite(data);
        if (data.type === "invite") {
          setName(String(data.email || "").split("@")[0] || "");
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setInvite(null);
        setError(err.response?.data?.error || err.message || "Invalid or expired link");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setSubmitting(true);
    try {
      const result = await acceptInviteToken(token, {
        password,
        confirmPassword,
        name: isReset ? undefined : name,
      });
      setAuthToken(result.token);
      await refreshUser();
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Could not complete request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <img src={logoSrc} alt="NorthernLeads Media" className="login-logo" />
        <h2 style={{ margin: "0 0 0.35rem", fontSize: "1.15rem" }}>
          {isReset ? "Set a new password" : "Create your account"}
        </h2>
        <p className="subtle" style={{ marginTop: 0 }}>
          {isReset
            ? "This link works once and expires in 24 hours."
            : "Your company email is your login. This invite works once and expires in 24 hours."}
        </p>

        {loading ? <p className="subtle">Checking link...</p> : null}

        {!loading && invite ? (
          <form className="login-form" onSubmit={handleSubmit}>
            <label>
              Email
              <input type="email" value={invite.email} readOnly />
            </label>
            {!isReset ? (
              <label>
                Role
                <input type="text" value={invite.role} readOnly />
              </label>
            ) : null}
            {!isReset ? (
              <label>
                Display name
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
              </label>
            ) : null}
            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
                minLength={8}
              />
            </label>
            <label>
              Confirm password
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
                minLength={8}
              />
            </label>
            {error ? <p className="login-error">{error}</p> : null}
            <button type="submit" className="btn" disabled={submitting}>
              {submitting ? "Saving..." : isReset ? "Save password" : "Create account"}
            </button>
          </form>
        ) : null}

        {!loading && !invite ? (
          <>
            {error ? <p className="login-error">{error}</p> : null}
            <p className="subtle">Ask your CEO to send a new link.</p>
            <Link to="/login" className="btn btn-secondary">
              Back to login
            </Link>
          </>
        ) : null}
      </div>
    </div>
  );
}
