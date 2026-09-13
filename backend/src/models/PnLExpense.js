import mongoose from "mongoose";

export const PNL_EXPENSE_CATEGORIES = [
  "Ringba",
  "Advertising tools",
  "Software",
  "Hosting",
  "Legal",
  "Insurance",
  "Payroll",
  "Contractors",
  "Office",
  "Other",
];

export const PNL_EXPENSE_SOURCES = ["manual", "ringba", "import"];

const actorSchema = new mongoose.Schema(
  {
    userId: { type: String, default: "" },
    name: { type: String, default: "" },
    email: { type: String, default: "" },
  },
  { _id: false }
);

const pnLExpenseSchema = new mongoose.Schema(
  {
    /** YYYY-MM — month this expense belongs to */
    month: { type: String, required: true, index: true },
    /** YYYY-MM-DD — optional exact expense date */
    date: { type: String, default: "" },
    category: {
      type: String,
      required: true,
      enum: PNL_EXPENSE_CATEGORIES,
      default: "Other",
    },
    platform: { type: String, default: "", trim: true },
    description: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, default: "", trim: true },
    receiptSaved: { type: Boolean, default: false },
    source: {
      type: String,
      enum: PNL_EXPENSE_SOURCES,
      default: "manual",
    },
    /** Ringba refId or sheet import key for dedupe */
    externalId: { type: String, default: "", index: true },
    /**
     * When true, expense is omitted from monthly P&L but still counted on P&L Historical.
     */
    historicalOnly: { type: Boolean, default: false, index: true },
    notes: { type: String, default: "", trim: true },
    createdBy: { type: actorSchema, default: () => ({}) },
    updatedBy: { type: actorSchema, default: () => ({}) },
  },
  { timestamps: true }
);

pnLExpenseSchema.index({ month: 1, category: 1 });
pnLExpenseSchema.index(
  { source: 1, externalId: 1 },
  {
    unique: true,
    partialFilterExpression: { externalId: { $type: "string", $gt: "" } },
  }
);

export const PnLExpense = mongoose.model("PnLExpense", pnLExpenseSchema);
