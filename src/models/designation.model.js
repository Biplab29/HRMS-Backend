import mongoose from "mongoose";

const designationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Designation title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },

    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: [true, "Department is required"],
    },

    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: [500, "Description cannot exceed 500 characters"],
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

// Prevent duplicate designation in same department
// designationSchema.index(
//   { title: 1, department: 1 },
//   { unique: true }
// );

export const Designation = mongoose.model(
  "Designation",
  designationSchema
);