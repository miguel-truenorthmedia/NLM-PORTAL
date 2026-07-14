import { useEffect, useState } from "react";
import { createBuyer, deleteBuyer, fetchBuyers, updateBuyer } from "../../services/api.js";

const NET_PRESETS = [7, 15, 30, 45, 60];
const FREQUENCY_OPTIONS = [
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Every 2 weeks" },
  { value: "monthly", label: "Monthly" },
];

const EMPTY_FORM = {
  name: "",
  email: "",
  net: 15,
  invoiceFrequency: "biweekly",
  notes: "",
};

function frequencyLabel(value) {
  return FREQUENCY_OPTIONS.find((option) => option.value === value)?.label || value || "—";
}

export default function BuyersTab() {
  const [buyers, setBuyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalMode, setModalMode] = useState(null); // "add" | "edit" | null
  const [editingBuyer, setEditingBuyer] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState("");

  const loadBuyers = () => {
    setLoading(true);
    setError("");
    return fetchBuyers()
      .then((result) => setBuyers(result.buyers || []))
      .catch((err) => {
        setBuyers([]);
        setError(err.response?.data?.error || err.message || "Failed to load buyers");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadBuyers();
  }, []);

  const openAddModal = () => {
    setEditingBuyer(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setModalMode("add");
  };

  const openEditModal = (buyer) => {
    const netValue = Number(buyer.net);
    setEditingBuyer(buyer);
    setForm({
      name: buyer.name || "",
      email: buyer.email || "",
      net: NET_PRESETS.includes(netValue) ? netValue : 15,
      invoiceFrequency: buyer.invoiceFrequency || "biweekly",
      notes: buyer.notes || "",
    });
    setFormError("");
    setModalMode("edit");
  };

  const closeModal = () => {
    if (submitting) return;
    setModalMode(null);
    setEditingBuyer(null);
    setForm(EMPTY_FORM);
    setFormError("");
  };

  const updateForm = (patch) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    setSubmitting(true);

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      net: Number(form.net),
      invoiceFrequency: form.invoiceFrequency,
      notes: form.notes.trim(),
      active: true,
    };

    try {
      if (modalMode === "edit" && editingBuyer?.id) {
        await updateBuyer(editingBuyer.id, payload);
      } else {
        await createBuyer(payload);
      }
      await loadBuyers();
      setModalMode(null);
      setEditingBuyer(null);
      setForm(EMPTY_FORM);
    } catch (err) {
      setFormError(err.response?.data?.error || err.message || "Failed to save buyer");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (buyer) => {
    if (!buyer?.id) return;
    const confirmed = window.confirm(`Delete buyer "${buyer.name}"? This cannot be undone.`);
    if (!confirmed) return;

    setDeletingId(buyer.id);
    setError("");
    try {
      await deleteBuyer(buyer.id);
      await loadBuyers();
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to delete buyer");
    } finally {
      setDeletingId("");
    }
  };

  return (
    <div>
      <div className="section-head">
        <div>
          <h3>Buyers</h3>
          <p className="subtle">
            Buyer profiles for reconciliation emails and QuickBooks invoices. <strong>Net</strong> sets due date.{" "}
            <strong>Invoice frequency</strong> controls how often we bill.
          </p>
        </div>
        <button type="button" className="btn btn-inline" onClick={openAddModal}>
          Add Buyer
        </button>
      </div>

      {error ? <p className="login-error">{error}</p> : null}
      {loading ? <p className="subtle">Loading buyers...</p> : null}

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Buyer</th>
                <th>Email</th>
                <th>Net Pay</th>
                <th>Invoice Frequency</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {!loading && buyers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="subtle">
                    No buyers yet. Click <strong>Add Buyer</strong> to create one.
                  </td>
                </tr>
              ) : (
                buyers.map((buyer) => (
                  <tr key={buyer.id}>
                    <td>
                      <strong>{buyer.name}</strong>
                    </td>
                    <td>{buyer.email || "—"}</td>
                    <td>Net {buyer.net ?? 15}</td>
                    <td>{frequencyLabel(buyer.invoiceFrequency)}</td>
                    <td>
                      <div className="row-actions">
                        <button
                          type="button"
                          className="btn btn-inline btn-small"
                          onClick={() => openEditModal(buyer)}
                          disabled={deletingId === buyer.id}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-inline btn-small btn-danger"
                          onClick={() => handleDelete(buyer)}
                          disabled={deletingId === buyer.id}
                        >
                          {deletingId === buyer.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalMode ? (
        <div className="modal-backdrop" role="presentation" onClick={closeModal}>
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="buyer-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 id="buyer-modal-title">{modalMode === "edit" ? "Edit Buyer" : "Add Buyer"}</h3>
            <form className="buyer-form" onSubmit={handleSubmit}>
              <label>
                Buyer name
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => updateForm({ name: e.target.value })}
                  placeholder="Elijay Marketing"
                  required
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateForm({ email: e.target.value })}
                  placeholder="billing@buyer.com"
                  required
                />
              </label>
              <label>
                Net pay
                <select
                  value={Number(form.net)}
                  onChange={(e) => updateForm({ net: Number(e.target.value) })}
                  required
                >
                  {NET_PRESETS.map((days) => (
                    <option key={days} value={days}>
                      Net {days}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Invoice frequency
                <select
                  value={form.invoiceFrequency}
                  onChange={(e) => updateForm({ invoiceFrequency: e.target.value })}
                  required
                >
                  {FREQUENCY_OPTIONS.map((option) => (
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
                  value={form.notes}
                  onChange={(e) => updateForm({ notes: e.target.value })}
                  placeholder="Optional"
                />
              </label>

              {formError ? <p className="login-error">{formError}</p> : null}

              <div className="modal-actions">
                <button type="button" className="preset" onClick={closeModal} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-inline" disabled={submitting}>
                  {submitting ? "Saving..." : modalMode === "edit" ? "Save changes" : "Add buyer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
