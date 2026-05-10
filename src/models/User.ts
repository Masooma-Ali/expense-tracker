import mongoose, { Schema, models } from "mongoose";

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    currency: { type: String, default: "USD" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Prevent password from appearing in JSON responses
UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const User = models.User || mongoose.model("User", UserSchema);
export default User;
