const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    course: {
      type: String,
      trim: true,
    },
    studentId: {
      type: String,
      trim: true,
    },
    semester: {
      type: String,
      trim: true,
    },
    faculty: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ["student", "admin"],
      default: "student",
    },
  },
  { timestamps: true }
);

// Index for better query performance
// UserSchema.index({ email: 1 });
// UserSchema.index({ role: 1 });

module.exports = mongoose.model("User", UserSchema);
