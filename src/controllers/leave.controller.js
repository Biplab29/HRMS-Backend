import { Leave } from "../models/leave.model.js";
import { Employee } from "../models/employee.model.js";
import  ErrorHandler  from "../utils/ErrorHandler.js";
import  asyncHandler  from "../utils/asyncHandler.js";

// Apply Leave
export const applyLeave = asyncHandler(
  async (req, res, next) => {
    const {
      employee,
      leaveType,
      fromDate,
      toDate,
      reason,
    } = req.body;

    if (
      !employee ||
      !leaveType ||
      !fromDate ||
      !toDate ||
      !reason
    ) {
      return next(
        new ErrorHandler(
          "All fields are required",
          400
        )
      );
    }

    const employeeExists =
      await Employee.findById(employee);

    if (!employeeExists) {
      return next(
        new ErrorHandler("Employee not found", 404)
      );
    }

    const leave = await Leave.create({
      employee,
      leaveType,
      fromDate,
      toDate,
      reason,
    });

    res.status(201).json({
      success: true,
      message: "Leave applied successfully",
      leave,
    });
  }
);

// Get All Leaves
export const getAllLeaves =
  asyncHandler(async (req, res) => {
    const leaves = await Leave.find()
      .populate(
        "employee",
        "employeeId phone"
      )
      .populate(
        "approvedBy",
        "employeeId"
      )
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: leaves.length,
      leaves,
    });
  });

// Get Single Leave
export const getLeaveById =
  asyncHandler(async (req, res, next) => {
    const leave = await Leave.findById(
      req.params.id
    )
      .populate(
        "employee",
        "employeeId phone"
      )
      .populate(
        "approvedBy",
        "employeeId"
      );

    if (!leave) {
      return next(
        new ErrorHandler(
          "Leave not found",
          404
        )
      );
    }

    res.status(200).json({
      success: true,
      leave,
    });
  });

// Update Leave
export const updateLeave =
  asyncHandler(async (req, res, next) => {
    const leave = await Leave.findById(
      req.params.id
    );

    if (!leave) {
      return next(
        new ErrorHandler(
          "Leave not found",
          404
        )
      );
    }

    const updatedLeave =
      await Leave.findByIdAndUpdate(
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
        "Leave updated successfully",
      leave: updatedLeave,
    });
  });

// Approve Leave
export const approveLeave =
  asyncHandler(async (req, res, next) => {
    const leave = await Leave.findById(
      req.params.id
    );

    if (!leave) {
      return next(
        new ErrorHandler(
          "Leave not found",
          404
        )
      );
    }

    leave.status = "approved";
    leave.approvedBy = req.user._id;

    await leave.save();

    res.status(200).json({
      success: true,
      message: "Leave approved",
      leave,
    });
  });

// Reject Leave
export const rejectLeave =
  asyncHandler(async (req, res, next) => {
    const leave = await Leave.findById(
      req.params.id
    );

    if (!leave) {
      return next(
        new ErrorHandler(
          "Leave not found",
          404
        )
      );
    }

    leave.status = "rejected";
    leave.approvedBy = req.user._id;

    await leave.save();

    res.status(200).json({
      success: true,
      message: "Leave rejected",
      leave,
    });
  });

// Delete Leave
export const deleteLeave =
  asyncHandler(async (req, res, next) => {
    const leave = await Leave.findById(
      req.params.id
    );

    if (!leave) {
      return next(
        new ErrorHandler(
          "Leave not found",
          404
        )
      );
    }

    await leave.deleteOne();

    res.status(200).json({
      success: true,
      message:
        "Leave deleted successfully",
    });
  });