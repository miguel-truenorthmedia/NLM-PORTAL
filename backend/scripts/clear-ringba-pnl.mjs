import "../src/config.js";
import mongoose from "mongoose";
import { PnLExpense } from "../src/models/PnLExpense.js";

await mongoose.connect(process.env.MONGODB_URI);
const result = await PnLExpense.deleteMany({ source: "ringba" });
console.log("deleted ringba expenses:", result.deletedCount);
await mongoose.disconnect();
