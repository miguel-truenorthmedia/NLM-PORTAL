import mongoose from "mongoose";

export const INVOICE_FREQUENCIES = ["weekly", "biweekly", "monthly"];

const buyerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    /** Payment terms in days — used as QuickBooks invoice due date (Net 7, Net 15, etc.) */
    net: { type: Number, default: 15, min: 0 },
    /** How often we invoice this buyer */
    invoiceFrequency: {
      type: String,
      enum: INVOICE_FREQUENCIES,
      default: "biweekly",
    },
    notes: { type: String, default: "", trim: true },
    active: { type: Boolean, default: true },
    /** Populated later when QuickBooks is connected */
    qboCustomerId: { type: String, default: "" },
  },
  { timestamps: true }
);

export const Buyer = mongoose.model("Buyer", buyerSchema);
