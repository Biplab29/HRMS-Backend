import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema(
  {
    departmentName: {
      type: String,
      required: [true, "Department name is required"],
      unique: true,
      trim: true,
      maxlength: [100, "Department name cannot exceed 100 characters"],
    },

    // code: {
    //   type: String,
    //   required: [true, "Department code is required"],
    //   unique: true,
    //   uppercase: true,
    //   trim: true,
    // },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Department = mongoose.model("Department", departmentSchema );