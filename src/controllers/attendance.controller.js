import { Attendance } from "../models/attendance.model.js";
import { Employee } from "../models/employee.model.js";
import ErrorHandler  from "../utils/ErrorHandler.js";
import  asyncHandler  from "../utils/asyncHandler.js";

// Create Attendance
export const addAttendance = asyncHandler(
  async (req, res, next) => {
    const { employee, date, checkIn, checkOut, status } =
      req.body;

    if (!employee || !date) {
      return next(
        new ErrorHandler(
          "Employee and Date are required",
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

    const attendanceExists =
      await Attendance.findOne({
        employee,
        date,
      });

    if (attendanceExists) {
      return next(
        new ErrorHandler(
          "Attendance already marked for this date",
          400
        )
      );
    }

    const attendance = await Attendance.create({
      employee,
      date,
      checkIn,
      checkOut,
      status,
    });

    res.status(201).json({
      success: true,
      message: "Attendance marked successfully",
      attendance,
    });
  }
);

// Get All Attendance
export const getAllAttendance =
  asyncHandler(async (req, res) => {
    const attendance = await Attendance.find()
      .populate(
        "employee",
        "employeeId phone"
      )
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: attendance.length,
      attendance,
    });
  });

// Get Attendance By ID
export const getAttendanceById =
  asyncHandler(async (req, res, next) => {
    const attendance =
      await Attendance.findById(
        req.params.id
      ).populate(
        "employee",
        "employeeId phone"
      );

    if (!attendance) {
      return next(
        new ErrorHandler(
          "Attendance not found",
          404
        )
      );
    }

    res.status(200).json({
      success: true,
      attendance,
    });
  });

// Update Attendance
export const updateAttendance =
  asyncHandler(async (req, res, next) => {
    const attendance =
      await Attendance.findById(
        req.params.id
      );

    if (!attendance) {
      return next(
        new ErrorHandler(
          "Attendance not found",
          404
        )
      );
    }

    const updatedAttendance =
      await Attendance.findByIdAndUpdate(
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
        "Attendance updated successfully",
      attendance: updatedAttendance,
    });
  });

// Delete Attendance
export const deleteAttendance =
  asyncHandler(async (req, res, next) => {
    const attendance =
      await Attendance.findById(
        req.params.id
      );

    if (!attendance) {
      return next(
        new ErrorHandler(
          "Attendance not found",
          404
        )
      );
    }

    await attendance.deleteOne();

    res.status(200).json({
      success: true,
      message:
        "Attendance deleted successfully",
    });
  });

  export const checkIn = asyncHandler(
  async (req, res, next) => {
    const { employee } = req.body;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance =
      await Attendance.findOne({
        employee,
        date: today,
      });

    if (attendance) {
      return next(
        new ErrorHandler(
          "Already checked in today",
          400
        )
      );
    }

    const newAttendance =
      await Attendance.create({
        employee,
        date: today,
        checkIn: new Date(),
        status: "present",
      });

    res.status(201).json({
      success: true,
      message: "Check-in successful",
      attendance: newAttendance,
    });
  }
);

export const checkOut = asyncHandler(
  async (req, res, next) => {
    const { employee } = req.body;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance =
      await Attendance.findOne({
        employee,
        date: today,
      });

    if (!attendance) {
      return next(
        new ErrorHandler(
          "Check-in not found",
          404
        )
      );
    }

    attendance.checkOut = new Date();

    await attendance.save();

    res.status(200).json({
      success: true,
      message: "Check-out successful",
      attendance,
    });
  }
);