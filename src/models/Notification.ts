import mongoose, { Schema, models } from "mongoose";

const NotificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    message: { type: String, required: true },
    type: { type: String, enum: ["budget_alert", "info", "warning"], default: "info" },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Notification = models.Notification || mongoose.model("Notification", NotificationSchema);
export default Notification;
