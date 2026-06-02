import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: [true, "Employee is required"],
    },

    date: {
      type: Date,
      required: [true, "Date is required"],
    },

    checkIn: {
      type: Date,
      default: null,
    },

    checkOut: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: [
        "present",
        "absent",
        "late",
        "half-day",
        "leave",
      ],
      default: "present",
    },
  },
  {
    timestamps: true,
  }
);

attendanceSchema.index(
  { employee: 1, date: 1 },
  { unique: true }
);

export const Attendance = mongoose.model(
  "Attendance",
  attendanceSchema
);