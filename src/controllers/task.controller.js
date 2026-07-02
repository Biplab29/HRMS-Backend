import { Task } from "../models/task.model.js";
import { Employee } from "../models/employee.model.js";
import { Notification } from "../models/notification.model.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import asyncHandler from "../utils/asyncHandler.js";

// Create Task
export const createTask = asyncHandler(async (req, res, next) => {
  const { title, description, assignedTo, deadline } = req.body;

  if (!title || !description || !assignedTo || !deadline) {
    return next(new ErrorHandler("All fields are required", 400));
  }

  const assignerEmployee = await Employee.findOne({ user: req.user._id });
  if (!assignerEmployee) {
    return next(new ErrorHandler("Manager profile not found", 404));
  }

  const assigneeEmployee = await Employee.findById(assignedTo).populate("user");
  if (!assigneeEmployee) {
    return next(new ErrorHandler("Assignee not found", 404));
  }

  // Allow admins and HR to assign to anyone. Managers can only assign to department members.
  if (req.user.role === "manager") {
    const sameDept = assigneeEmployee.department?.toString() === assignerEmployee.department?.toString();
    const isSubordinate = assigneeEmployee.manager?.toString() === assignerEmployee._id.toString();
    if (!sameDept && !isSubordinate) {
      return next(new ErrorHandler("You can only assign tasks to employees in your department", 403));
    }
  }

  const task = await Task.create({
    title,
    description,
    assignedBy: assignerEmployee._id,
    assignedTo,
    deadline,
  });

  // Notify assigned employee
  if (assigneeEmployee.user) {
    await Notification.create({
      user: assigneeEmployee.user._id,
      title: "New Task Assigned",
      message: `You have been assigned a new task: ${title}. Deadline: ${new Date(deadline).toDateString()}`,
      type: "task_assigned",
      relatedId: task._id,
    });
  }

  res.status(201).json({
    success: true,
    message: "Task assigned successfully",
    task,
  });
});

// Update Task Status
export const updateTaskStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body; // accepted, rejected, in-progress, completed
  const task = await Task.findById(req.params.id);

  if (!task) {
    return next(new ErrorHandler("Task not found", 404));
  }

  const validStatuses = ["accepted", "rejected", "in-progress", "completed"];
  if (!validStatuses.includes(status)) {
    return next(new ErrorHandler("Invalid status update", 400));
  }

  const currentEmployee = await Employee.findOne({ user: req.user._id });
  if (!currentEmployee) {
    return next(new ErrorHandler("Employee profile not found", 404));
  }

  if (task.assignedTo.toString() !== currentEmployee._id.toString()) {
    return next(new ErrorHandler("You are not authorized to update this task", 403));
  }

  // Validate state transitions
  if (status === "accepted" || status === "rejected") {
    if (task.status !== "pending") {
      return next(new ErrorHandler(`Cannot ${status} a task that is ${task.status}`, 400));
    }
  }
  
  if (status === "in-progress" && task.status !== "accepted") {
    return next(new ErrorHandler("You must accept the task before starting it", 400));
  }

  if (status === "completed" && task.status !== "in-progress") {
    return next(new ErrorHandler("You must start the task before completing it", 400));
  }

  task.status = status;
  await task.save();

  // Notify the manager
  const managerEmployee = await Employee.findById(task.assignedBy).populate("user");
  if (managerEmployee && managerEmployee.user) {
    let actionStr = status === "in-progress" ? "started" : status;
    await Notification.create({
      user: managerEmployee.user._id,
      title: `Task ${actionStr.charAt(0).toUpperCase() + actionStr.slice(1)}`,
      message: `${currentEmployee.user.name || "Employee"} has ${actionStr} the task: ${task.title}.`,
      type: `task_${actionStr}`,
      relatedId: task._id,
    });
  }

  res.status(200).json({
    success: true,
    message: `Task ${status} successfully`,
    task,
  });
});

// Get Tasks
export const getTasks = asyncHandler(async (req, res) => {
  const employeeRecord = await Employee.findOne({ user: req.user._id });
  let query = {};

  if (req.user.role === "employee") {
    query = { assignedTo: employeeRecord?._id || null };
  } else if (req.user.role === "manager") {
    // Managers see tasks they assigned, and tasks assigned to employees in their department
    const deptEmployees = await Employee.find({ department: employeeRecord?.department }).select("_id");
    const employeeIds = deptEmployees.map(emp => emp._id);
    
    query = {
      $or: [
        { assignedBy: employeeRecord?._id || null },
        { assignedTo: { $in: employeeIds } },
        { assignedTo: employeeRecord?._id || null }
      ]
    };
  } else {
    // Admin & HR see all tasks
    query = {};
  }

  const tasks = await Task.find(query)
    .populate({
      path: "assignedBy",
      select: "employeeId user",
      populate: { path: "user", select: "name email role" }
    })
    .populate({
      path: "assignedTo",
      select: "employeeId user",
      populate: { path: "user", select: "name email role" }
    })
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: tasks.length,
    tasks,
  });
});
