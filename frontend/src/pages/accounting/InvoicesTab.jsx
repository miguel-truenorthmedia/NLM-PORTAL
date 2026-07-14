import { formatCurrency, formatDateShort } from "../../components/formatters.js";

/**
 * Placeholder until QuickBooks invoice sync is wired.
 * Columns intentionally match the planned Paid / Unpaid + Due Date view.
 */
const PLACEHOLDER_INVOICES = [];

function statusClass(status) {
  if (status === "paid") return "invoice-status invoice-status--paid";
  if (status === "partial") return "invoice-status invoice-status--partial";
  if (status === "overdue") return "invoice-status invoice-status--overdue";
  return "invoice-status invoice-status--open";
}

export default function InvoicesTab() {
  const invoices = PLACEHOLDER_INVOICES;

  return (
    <div>
      <h3>Invoices</h3>
      <p className="subtle">
        Sent QuickBooks invoices will appear here with paid / unpaid status and due dates (from each buyer&apos;s{" "}
        <strong>Net</strong> terms). Creation and payment sync come next.
      </p>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Buyer</th>
                <th>Period</th>
                <th>Amount</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Sent</th>
                <th>Paid</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="subtle">
                    No invoices yet. Once biweekly QuickBooks sending is live, paid and unpaid invoices will list here.
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td>{invoice.docNumber}</td>
                    <td>{invoice.buyerName}</td>
                    <td>
                      {formatDateShort(invoice.startDate)} – {formatDateShort(invoice.endDate)}
                    </td>
                    <td>{formatCurrency(invoice.amount)}</td>
                    <td>{formatDateShort(invoice.dueDate)}</td>
                    <td>
                      <span className={statusClass(invoice.status)}>{invoice.status}</span>
                    </td>
                    <td>{invoice.sentAt ? formatDateShort(invoice.sentAt) : "—"}</td>
                    <td>{invoice.paidAt ? formatDateShort(invoice.paidAt) : "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
