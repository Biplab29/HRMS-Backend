import { Department } from "../models/department.model.js";
import asyncHandler  from "../utils/asyncHandler.js";
import ErrorHandler  from "../utils/ErrorHandler.js";

export const addDepartment = asyncHandler(
  async (req, res, next) => {
    const {
      departmentName,
      description,
      managerId,
    } = req.body;

    if (!departmentName) {
      return next(
        new ErrorHandler(
          "Department name is required",
          400
        )
      );
    }

    const existingDepartment =
      await Department.findOne({
        departmentName,
      });

    if (existingDepartment) {
      return next(
        new ErrorHandler(
          "Department already exists",
          400
        )
      );
    }

    const department =
      await Department.create({
        departmentName,
        description,
        managerId,
      });

    res.status(201).json({
      success: true,
      message: "Department created successfully",
      department,
    });
  }
);

export const getAllDepartments =
  asyncHandler(async (req, res) => {
    const departments =
      await Department.find()
        .populate(
          "managerId",
          "employeeId phone"
        )
        .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: departments.length,
      departments,
    });
  });

  export const getDepartmentById =
  asyncHandler(async (req, res, next) => {
    const department =
      await Department.findById(
        req.params.id
      ).populate(
        "managerId",
        "employeeId phone"
      );

    if (!department) {
      return next(
        new ErrorHandler(
          "Department not found",
          404
        )
      );
    }

    res.status(200).json({
      success: true,
      department,
    });
  });

  export const updateDepartment =
  asyncHandler(async (req, res, next) => {
    const department =
      await Department.findById(
        req.params.id
      );

    if (!department) {
      return next(
        new ErrorHandler(
          "Department not found",
          404
        )
      );
    }

    const updatedDepartment =
      await Department.findByIdAndUpdate(
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
        "Department updated successfully",
      department: updatedDepartment,
    });
  });

  export const deleteDepartment =
  asyncHandler(async (req, res, next) => {
    const department =
      await Department.findById(
        req.params.id
      );

    if (!department) {
      return next(
        new ErrorHandler(
          "Department not found",
          404
        )
      );
    }

    department.isActive = false;

    await department.save();

    res.status(200).json({
      success: true,
      message:
        "Department deactivated successfully",
    });
  });
