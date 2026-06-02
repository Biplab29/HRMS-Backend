import { Employee } from "../models/employee.model.js";
import { User } from "../models/user.model.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import asyncHandler from "../utils/asyncHandler.js";

// ADD EMPLOYEE
// export const addEmployee = asyncHandler(async (req, res, next) => {
//   const {
//     user,
//     employeeId,
//     phone,
//     gender,
//     dateOfBirth,
//     address,
//     department,
//     designation,
//     manager,
//     joiningDate,
//     employmentType,
//     salary,
//     profileImage,
//   } = req.body;

//   if (!user || !employeeId || !phone || !department || !designation) {
//     return next(
//       new ErrorHandler(
//         "User, employeeId, phone, department and designation are required",
//         400
//       )
//     );
//   }

//   const existingUser = await User.findById(user);

//   if (!existingUser) {
//     return next(new ErrorHandler("User not found", 404));
//   }

//   const alreadyEmployee = await Employee.findOne({
//     $or: [{ user }, { employeeId }],
//   });

//   if (alreadyEmployee) {
//     return next(
//       new ErrorHandler("Employee already exists with this user or employeeId", 400)
//     );
//   }

//   const employee = await Employee.create({
//     user,
//     employeeId,
//     phone,
//     gender,
//     dateOfBirth,
//     address,
//     department,
//     designation,
//     manager,
//     joiningDate,
//     employmentType,
//     salary,
//     profileImage,
//   });

//   res.status(201).json({
//     success: true,
//     message: "Employee added successfully",
//     employee,
//   });
// });
export const addEmployee = asyncHandler(async (req, res, next) => {
  console.log("BODY =>", req.body);

  if (!req.body) {
    return next(
      new ErrorHandler(
        "Request body is missing. Please send JSON data.",
        400
      )
    );
  }
  const {
    user,
    phone,
    gender,
    dateOfBirth,
    address,
    department,
    designation,
    manager,
    joiningDate,
    employmentType,
    salary,
    profileImage,
  } = req.body;

  if (!user || !phone || !department || !designation) {
    return next(
      new ErrorHandler(
        "User, phone, department and designation are required",
        400
      )
    );
  }

  const existingUser = await User.findById(user);

  if (!existingUser) {
    return next(new ErrorHandler("User not found", 404));
  }

  const alreadyEmployee = await Employee.findOne({ user });

  if (alreadyEmployee) {
    return next(
      new ErrorHandler(
        "Employee already exists for this user",
        400
      )
    );
  }

  // Generate Unique Employee ID
  let employeeId;
  let isUnique = false;

  while (!isUnique) {
    const year = new Date().getFullYear();
    const randomNumber = Math.floor(
      1000 + Math.random() * 9000
    );

    employeeId = `HRM-${year}-${randomNumber}`;

    const existingEmployee = await Employee.findOne({
      employeeId,
    });

    if (!existingEmployee) {
      isUnique = true;
    }
  }

  const employee = await Employee.create({
    user,
    employeeId,
    phone,
    gender,
    dateOfBirth,
    address,
    department,
    designation,
    manager,
    joiningDate,
    employmentType,
    salary,
    profileImage,
  });

  return res.status(201).json({
    success: true,
    message: "Employee added successfully",
    employee,
  });
});

// GET ALL EMPLOYEES
export const getEmployees = asyncHandler(async (req, res) => {
  const employees = await Employee.find()
    .populate("user", "name email role isActive")
    .populate("department", "name")
    .populate("designation", "name")
    .populate({
      path: "manager",
      select: "employeeId user",
      populate: {
        path: "user",
        select: "name email",
      },
    })
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: employees.length,
    employees,
  });
});

// GET SINGLE EMPLOYEE
export const getSingleEmployee = asyncHandler(async (req, res, next) => {
  const employee = await Employee.findById(req.params.id)
    .populate("user", "name email role isActive")
    .populate("department", "name")
    .populate("designation", "name")
    .populate({
      path: "manager",
      select: "employeeId user",
      populate: {
        path: "user",
        select: "name email",
      },
    });

  if (!employee) {
    return next(new ErrorHandler("Employee not found", 404));
  }

  res.status(200).json({
    success: true,
    employee,
  });
});

// UPDATE EMPLOYEE
export const updateEmployee = asyncHandler(async (req, res, next) => {
  let employee = await Employee.findById(req.params.id);

  if (!employee) {
    return next(new ErrorHandler("Employee not found", 404));
  }

  employee = await Employee.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })
    .populate("user", "name email role isActive")
    .populate("department", "name")
    .populate("designation", "name");

  res.status(200).json({
    success: true,
    message: "Employee updated successfully",
    employee,
  });
});

// DELETE EMPLOYEE
export const deleteEmployee = asyncHandler(async (req, res, next) => {
  const employee = await Employee.findById(req.params.id);

  if (!employee) {
    return next(new ErrorHandler("Employee not found", 404));
  }

  await employee.deleteOne();

  res.status(200).json({
    success: true,
    message: "Employee deleted successfully",
  });
});