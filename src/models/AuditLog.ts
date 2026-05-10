import mongoose, { Schema, models } from "mongoose";

const AuditLogSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true }, // e.g. "CREATE_TRANSACTION", "DELETE_BUDGET"
    resourceType: { type: String }, // "Transaction", "Budget", etc.
    resourceId: { type: Schema.Types.ObjectId },
    details: { type: Schema.Types.Mixed },
    ip: { type: String },
  },
  { timestamps: true }
);

const AuditLog = models.AuditLog || mongoose.model("AuditLog", AuditLogSchema);
export default AuditLog;
