import "dotenv/config";
import mongoose from "mongoose";

await mongoose.connect(process.env.MONGODB_URI);
const col = mongoose.connection.db.collection("pnlexpenses");

// Remove duplicate manual Natalia (keep Elijay import)
const deleted = await col.deleteOne({
  _id: new mongoose.Types.ObjectId("6aa6ffeb1c094e694823f2bb"),
});
console.log("deleted manual duplicate:", deleted.deletedCount);

// Hide all Elijay / Natalia contractor special payments from monthly P&L
const hide = await col.updateMany(
  {
    $or: [
      { platform: /elijay/i },
      { description: /natalia\s*\(hpms\)/i },
    ],
  },
  { $set: { historicalOnly: true } }
);
console.log("marked historicalOnly:", hide.modifiedCount, "matched:", hide.matchedCount);

const remaining = await col
  .find({
    $or: [{ platform: /elijay/i }, { description: /natalia/i }],
  })
  .project({
    date: 1,
    platform: 1,
    description: 1,
    amount: 1,
    source: 1,
    historicalOnly: 1,
  })
  .sort({ date: 1 })
  .toArray();
console.log("remaining:", JSON.stringify(remaining, null, 2));

await mongoose.disconnect();
