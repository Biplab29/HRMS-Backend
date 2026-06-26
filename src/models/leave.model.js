import mongoose from "mongoose";

const leaveSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: [true, "Employee is required"],
    },

    leaveType: {
      type: String,
      enum: ["casual", "sick", "annual", "maternity", "paternity", "unpaid"],
      required: [true, "Leave type is required"],
    },

    fromDate: {
      type: Date,
      required: [true, "From date is required"],
    },

    toDate: {
      type: Date,
      required: [true, "To date is required"],
      // Custom validation to check if toDate is after fromDate
      validate: {
        validator: function (value) {
          // 'this' refers to the current document being saved
          return value >= this.fromDate;
        },
        message: "To date must be greater than or equal to From date",
      },
    },

    reason: {
      type: String,
      required: [true, "Reason is required"],
      trim: true,
      maxlength: [500, "Reason cannot exceed 500 characters"],
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },
  },
  {
    timestamps: true
  }
);

// ADVANCED: Virtual field to calculate total leave days dynamically
// leaveSchema.virtual("totalDays").get(function () {
//   if (this.fromDate && this.toDate) {
//     const diffTime = Math.abs(this.toDate - this.fromDate);
//     const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 includes both start and end dates
//     return diffDays;
//   }
//   return 0;
// });

export const Leave = mongoose.model("Leave", leaveSchema);