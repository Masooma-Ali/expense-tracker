import mongoose, { Schema, models } from "mongoose";

const TransactionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    description: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    type: { type: String, enum: ["expense", "income"], required: true },
    category: { type: String, required: true },
    date: { type: Date, required: true, default: Date.now },
    isRecurring: { type: Boolean, default: false },
    recurringFrequency: { type: String, enum: ["weekly", "monthly", "yearly"] },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

// Compound index for fast user+date queries
TransactionSchema.index({ userId: 1, date: -1 });

const Transaction = models.Transaction || mongoose.model("Transaction", TransactionSchema);
export default Transaction;
