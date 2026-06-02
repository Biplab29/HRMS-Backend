import { Designation } from "../models/designation.model.js";
import { Department } from "../models/department.model.js";
import  ErrorHandler  from "../utils/ErrorHandler.js";
import  asyncHandler  from "../utils/asyncHandler.js";

// Create Designation
export const addDesignation = asyncHandler(
  async (req, res, next) => {
    const { title, department, description } = req.body;

    if (!title || !department) {
      return next(
        new ErrorHandler(
          "Title and Department are required",
          400
        )
      );
    }

    const departmentExists =
      await Department.findById(department);

    if (!departmentExists) {
      return next(
        new ErrorHandler(
          "Department not found",
          404
        )
      );
    }

    const designationExists =
      await Designation.findOne({
        title,
        department,
      });

    if (designationExists) {
      return next(
        new ErrorHandler(
          "Designation already exists in this department",
          400
        )
      );
    }

    const designation =
      await Designation.create({
        title,
        department,
        description,
      });

    res.status(201).json({
      success: true,
      message: "Designation created successfully",
      designation,
    });
  }
);

// Get All Designations
export const getAllDesignations =
  asyncHandler(async (req, res) => {
    const designations =
      await Designation.find()
        .populate(
          "department",
          "departmentName"
        )
        .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: designations.length,
      designations,
    });
  });

// Get Single Designation
export const getDesignationById =
  asyncHandler(async (req, res, next) => {
    const designation =
      await Designation.findById(
        req.params.id
      ).populate(
        "department",
        "departmentName"
      );

    if (!designation) {
      return next(
        new ErrorHandler(
          "Designation not found",
          404
        )
      );
    }

    res.status(200).json({
      success: true,
      designation,
    });
  });

// Update Designation
export const updateDesignation =
  asyncHandler(async (req, res, next) => {
    const designation =
      await Designation.findById(
        req.params.id
      );

    if (!designation) {
      return next(
        new ErrorHandler(
          "Designation not found",
          404
        )
      );
    }

    const updatedDesignation =
      await Designation.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
          new: true,
          runValidators: true,
        }
      );

    res.status(200).json({
      success: true,
      message:
        "Designation updated successfully",
      designation: updatedDesignation,
    });
  });

// Soft Delete Designation
export const deleteDesignation =
  asyncHandler(async (req, res, next) => {
    const designation =
      await Designation.findById(
        req.params.id
      );

    if (!designation) {
      return next(
        new ErrorHandler(
          "Designation not found",
          404
        )
      );
    }

    designation.isActive = false;

    await designation.save();

    res.status(200).json({
      success: true,
      message:
        "Designation deactivated successfully",
    });
  });