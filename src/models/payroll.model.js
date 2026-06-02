import mongoose from "mongoose";

const payrollSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: [true, "Employee is required"],
    },

    month: {
      type: String,
      required: [true, "Month is required"],
      trim: true,
    },

    basicSalary: {
      type: Number,
      required: [true, "Basic salary is required"],
      min: 0,
    },

    bonus: {
      type: Number,
      default: 0,
      min: 0,
    },

    deduction: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalSalary: {
      type: Number,
      required: true,
      min: 0,
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

// One payroll per employee per month
payrollSchema.index(
  { employee: 1, month: 1 },
  { unique: true }
);

export const Payroll = mongoose.model(
  "Payroll",
  payrollSchema
);