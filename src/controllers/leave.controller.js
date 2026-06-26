import { Leave } from "../models/leave.model.js";
import { Employee } from "../models/employee.model.js";
import { User } from "../models/user.model.js";
import { Notification } from "../models/notification.model.js";
import  ErrorHandler  from "../utils/ErrorHandler.js";
import  asyncHandler  from "../utils/asyncHandler.js";
import { sendEmail } from "../utils/sendEmail.js";

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
      !leaveType ||
      !fromDate ||
      !toDate ||
      !reason
    ) {
      return next(
        new ErrorHandler(
          "leaveType, fromDate, toDate, and reason are required",
          400
        )
      );
    }

    // Secure: If user is employee, force their own employee ID instead of req.body.employee
    let targetEmployeeId = employee;
    if (req.user.role === "employee") {
      const selfEmployee = await Employee.findOne({ user: req.user._id });
      if (!selfEmployee) {
        return next(
          new ErrorHandler("Employee profile not found for this user", 404)
        );
      }
      targetEmployeeId = selfEmployee._id;
    } else if (!employee) {
      return next(
        new ErrorHandler(
          "Employee ID is required",
          400
        )
      );
    }

    const employeeExists =
      await Employee.findById(targetEmployeeId);

    if (!employeeExists) {
      return next(
        new ErrorHandler("Employee not found", 404)
      );
    }

    const leave = await Leave.create({
      employee: targetEmployeeId,
      leaveType,
      fromDate,
      toDate,
      reason,
    });

    try {
      const admins = await User.find({ role: "admin" });
      const employeeData = await Employee.findById(targetEmployeeId).populate("user", "name email");
      
      if (admins.length > 0 && employeeData) {
        const employeeName = employeeData.user ? employeeData.user.name : "An employee";
        const subject = `New Leave Request from ${employeeName}`;
        const text = `
Hello Admin,

A new leave request has been submitted by ${employeeName}.

Leave Details:
- Type: ${leaveType}
- From: ${new Date(fromDate).toDateString()}
- To: ${new Date(toDate).toDateString()}
- Reason: ${reason}

Please review the request in the HRMS Dashboard.
        `;

        const html = `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #09111f; color: #e2e8f0; border-radius: 12px; border: 1px solid #1e293b;">
            <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #1e293b;">
              <h2 style="color: #25c979; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px;">HRMS Enterprise</h2>
              <p style="color: #ea580c; margin: 5px 0 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">New Leave Application</p>
            </div>
            <div style="padding: 30px 20px;">
              <h3 style="color: #ffffff; margin-top: 0; font-size: 18px;">Hello Admin,</h3>
              <p style="line-height: 1.6; font-size: 14px; color: #94a3b8;">A new leave request has been submitted by <strong>${employeeName}</strong>. Please find the leave details below:</p>
              
              <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px; border: 1px solid #1e293b; border-radius: 6px; overflow: hidden;">
                <tr style="background-color: #020617;">
                  <th style="padding: 10px 15px; text-align: left; color: #64748b; border-bottom: 1px solid #1e293b;">Detail</th>
                  <th style="padding: 10px 15px; text-align: left; color: #64748b; border-bottom: 1px solid #1e293b;">Information</th>
                </tr>
                <tr>
                  <td style="padding: 12px 15px; border-bottom: 1px solid #1e293b; color: #64748b;">Leave Type</td>
                  <td style="padding: 12px 15px; border-bottom: 1px solid #1e293b; color: #ffffff; font-weight: 600; text-transform: capitalize;">${leaveType}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 15px; border-bottom: 1px solid #1e293b; color: #64748b;">From Date</td>
                  <td style="padding: 12px 15px; border-bottom: 1px solid #1e293b; color: #ffffff;">${new Date(fromDate).toDateString()}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 15px; border-bottom: 1px solid #1e293b; color: #64748b;">To Date</td>
                  <td style="padding: 12px 15px; border-bottom: 1px solid #1e293b; color: #ffffff;">${new Date(toDate).toDateString()}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 15px; color: #64748b;">Reason</td>
                  <td style="padding: 12px 15px; color: #ffffff; font-style: italic;">"${reason}"</td>
                </tr>
              </table>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/leave" style="display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; box-shadow: 0 4px 15px rgba(234,88,12,0.25);">Review Request on Dashboard</a>
              </div>
            </div>
            <div style="text-align: center; padding-top: 20px; border-top: 1px solid #1e293b; font-size: 11px; color: #64748b;">
              <p style="margin: 0;">This is an automated system notification. Please do not reply directly to this email.</p>
              <p style="margin: 5px 0 0 0;">&copy; 2026 HRMS Enterprise. All rights reserved.</p>
            </div>
          </div>
        `;
        
        for (const admin of admins) {
          // Send email
          if (admin.email) {
            await sendEmail({ to: admin.email, subject, text, html });
          }
          // Create in-app notification
          await Notification.create({
            user: admin._id,
            title: "New Leave Request",
            message: `${employeeName} has applied for ${leaveType}.`,
            type: "leave_request",
            relatedId: leave._id,
          });
        }
      }
    } catch (error) {
      console.error("Failed to send leave notification:", error);
    }

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
    let query = {};

    // Role-based leaves filtering
    if (req.user.role !== "admin" && req.user.role !== "hr") {
      const employeeRecord = await Employee.findOne({ user: req.user._id });
      
      if (req.user.role === "manager") {
        // Manager can see their own leaves and leaves of employees they manage
        const managedEmployees = await Employee.find({ manager: employeeRecord?._id }).select("_id");
        const employeeIds = managedEmployees.map(emp => emp._id);
        if (employeeRecord) {
          employeeIds.push(employeeRecord._id);
        }
        query = { employee: { $in: employeeIds } };
      } else {
        // Normal employee sees only their own leaves
        query = { employee: employeeRecord?._id || null };
      }
    }

    const leaves = await Leave.find(query)
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

    if (req.user.role === "manager") {
      const leaveEmployee = await Employee.findById(leave.employee);
      const managerRecord = await Employee.findOne({ user: req.user._id });
      if (!leaveEmployee || !managerRecord || leaveEmployee.manager?.toString() !== managerRecord._id.toString()) {
        return next(new ErrorHandler("You are not authorized to approve this leave.", 403));
      }
    }

    // Fix: approvedBy is ref to Employee, so fetch approver's Employee record
    const approverEmployee = await Employee.findOne({ user: req.user._id });

    leave.status = "approved";
    if (approverEmployee) {
      leave.approvedBy = approverEmployee._id;
    }

    await leave.save();

    try {
      const employeeData = await Employee.findById(leave.employee);
      if (employeeData && employeeData.user) {
        await Notification.create({
          user: employeeData.user,
          title: "Leave Approved",
          message: `Your ${leave.leaveType} request from ${new Date(leave.fromDate).toDateString()} to ${new Date(leave.toDate).toDateString()} has been approved.`,
          type: "leave_approved",
          relatedId: leave._id,
        });
      }
    } catch (error) {
      console.error("Failed to create leave approval notification:", error);
    }

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

    if (req.user.role === "manager") {
      const leaveEmployee = await Employee.findById(leave.employee);
      const managerRecord = await Employee.findOne({ user: req.user._id });
      if (!leaveEmployee || !managerRecord || leaveEmployee.manager?.toString() !== managerRecord._id.toString()) {
        return next(new ErrorHandler("You are not authorized to reject this leave.", 403));
      }
    }

    // Fix: approvedBy is ref to Employee, so fetch approver's Employee record
    const approverEmployee = await Employee.findOne({ user: req.user._id });

    leave.status = "rejected";
    if (approverEmployee) {
      leave.approvedBy = approverEmployee._id;
    }

    await leave.save();

    try {
      const employeeData = await Employee.findById(leave.employee);
      if (employeeData && employeeData.user) {
        await Notification.create({
          user: employeeData.user,
          title: "Leave Rejected",
          message: `Your ${leave.leaveType} request from ${new Date(leave.fromDate).toDateString()} to ${new Date(leave.toDate).toDateString()} has been rejected.`,
          type: "leave_rejected",
          relatedId: leave._id,
        });
      }
    } catch (error) {
      console.error("Failed to create leave rejection notification:", error);
    }

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