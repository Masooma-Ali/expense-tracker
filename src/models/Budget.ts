import mongoose, { Schema, models } from "mongoose";

const BudgetSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    category: { type: String, required: true },
    limit: { type: Number, required: true, min: 0 },
    period: { type: String, enum: ["monthly", "weekly", "yearly"], default: "monthly" },
    startDate: { type: Date, required: true },
  },
  { timestamps: true }
);

// One budget per category per user
BudgetSchema.index({ userId: 1, category: 1 }, { unique: true });

const Budget = models.Budget || mongoose.model("Budget", BudgetSchema);
export default Budget;
