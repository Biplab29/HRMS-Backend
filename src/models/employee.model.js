import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    employeeId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },

    dateOfBirth: {
      type: Date,
    },

    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    },

    address: {
      // ✅ Object করা হয়েছে — better structure
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      zipCode: { type: String, trim: true },
    },

    emergencyContact: {
      name: { type: String, trim: true },
      relationship: { type: String, trim: true },
      phone: { type: String, trim: true },
    },

    bankDetails: {
      bankName: { type: String, trim: true },
      accountNumber: { type: String, trim: true, select: false },
      routingNumber: { type: String, trim: true, select: false },
    },

    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },

    designation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Designation",
      required: true,
    },

    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },

    joiningDate: {
      type: Date,
      required: true,
      default: Date.now,
    },

    employmentType: {
      type: String,
      enum: ["full-time", "part-time", "intern", "contract"],
      default: "full-time",
    },

    status: {
      type: String,
      enum: ["active", "inactive", "terminated"],
      default: "active",
    },

    // complete করেছে কিনা track করতে
    onboardingCompleted: {
      type: Boolean,
      default: false,
    },

    profileImage: {
      type: String,
      default: null, 
    },

    salary: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  { timestamps: true }
);

// ✅ Employee terminated হলে User-এর isActive
// automatically false হয়ে যাবে
employeeSchema.pre("save", async function () {
  if (this.isModified("status") && this.status === "terminated") {
    await mongoose.model("User").findByIdAndUpdate(
      this.user,
      { isActive: false }
    );
  }
});

export const Employee = mongoose.model("Employee", employeeSchema);