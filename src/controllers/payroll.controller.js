import { Payroll } from "../models/payroll.model.js";
import { Employee } from "../models/employee.model.js";
import  ErrorHandler  from "../utils/ErrorHandler.js";
import  asyncHandler  from "../utils/asyncHandler.js";

// Create Payroll
export const addPayroll = asyncHandler(
  async (req, res, next) => {
    const {
      employee,
      month,
      basicSalary,
      bonus = 0,
      deduction = 0,
    } = req.body;

    if (!employee || !month || basicSalary === undefined || basicSalary === null || basicSalary === '') {
      return next(
        new ErrorHandler(
          "Employee, month and basic salary are required",
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

    const payrollExists =
      await Payroll.findOne({
        employee,
        month,
      });

    if (payrollExists) {
      return next(
        new ErrorHandler(
          "Payroll already generated for this month",
          400
        )
      );
    }

    const totalSalary =
      Number(basicSalary) +
      Number(bonus) -
      Number(deduction);

    const payroll = await Payroll.create({
      employee,
      month,
      basicSalary,
      bonus,
      deduction,
      totalSalary,
    });

    res.status(201).json({
      success: true,
      message: "Payroll created successfully",
      payroll,
    });
  }
);

// Get All Payrolls
export const getAllPayrolls =
  asyncHandler(async (req, res) => {
    let query = {};

    // Role-based payroll filtering
    if (req.user.role !== "admin" && req.user.role !== "hr") {
      const employeeRecord = await Employee.findOne({ user: req.user._id });
      query = { employee: employeeRecord?._id || null };
    }

    const payrolls = await Payroll.find(query)
      .populate(
        "employee",
        "employeeId phone"
      )
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: payrolls.length,
      payrolls,
    });
  });

// Get Payroll By ID
export const getPayrollById =
  asyncHandler(async (req, res, next) => {
    const payroll =
      await Payroll.findById(
        req.params.id
      ).populate(
        "employee",
        "employeeId phone"
      );

    if (!payroll) {
      return next(
        new ErrorHandler(
          "Payroll not found",
          404
        )
      );
    }

    res.status(200).json({
      success: true,
      payroll,
    });
  });

// Update Payroll
export const updatePayroll =
  asyncHandler(async (req, res, next) => {
    const payroll =
      await Payroll.findById(
        req.params.id
      );

    if (!payroll) {
      return next(
        new ErrorHandler(
          "Payroll not found",
          404
        )
      );
    }

    const {
      basicSalary,
      bonus = payroll.bonus,
      deduction = payroll.deduction,
    } = req.body;

    const totalSalary =
      Number(
        basicSalary || payroll.basicSalary
      ) +
      Number(bonus) -
      Number(deduction);

    const updatedPayroll =
      await Payroll.findByIdAndUpdate(
        req.params.id,
        {
          ...req.body,
          totalSalary,
        },
        {
          new: true,
          runValidators: true,
        }
      );

    res.status(200).json({
      success: true,
      message:
        "Payroll updated successfully",
      payroll: updatedPayroll,
    });
  });

// Mark Salary Paid
export const markPayrollPaid =
  asyncHandler(async (req, res, next) => {
    const payroll =
      await Payroll.findById(
        req.params.id
      );

    if (!payroll) {
      return next(
        new ErrorHandler(
          "Payroll not found",
          404
        )
      );
    }

    payroll.paymentStatus = "paid";

    await payroll.save();

    res.status(200).json({
      success: true,
      message:
        "Salary marked as paid",
      payroll,
    });
  });

// Delete Payroll
export const deletePayroll =
  asyncHandler(async (req, res, next) => {
    const payroll =
      await Payroll.findById(
        req.params.id
      );

    if (!payroll) {
      return next(
        new ErrorHandler(
          "Payroll not found",
          404
        )
      );
    }

    await payroll.deleteOne();

    res.status(200).json({
      success: true,
      message:
        "Payroll deleted successfully",
    });
  });