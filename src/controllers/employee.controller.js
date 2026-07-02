import { Employee } from "../models/employee.model.js";
import { User } from "../models/user.model.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import asyncHandler from "../utils/asyncHandler.js";
import { generateUniqueEmployeeId } from "../utils/generateEmployeeId.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";

const isBlank = (value) =>
  value === undefined || value === null || String(value).trim() === "";

const optionalValue = (value) => (isBlank(value) ? undefined : value);

const compactObject = (value) =>
  Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined)
  );

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

  if (!user || !department || !designation) {
    return next(
      new ErrorHandler(
        "User, department and designation are required",
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

  const employeeId = await generateUniqueEmployeeId();

  let profileImageUrl = optionalValue(profileImage);
  if (req.file) {
    try {
      profileImageUrl = await uploadToCloudinary(req.file.buffer, "hrms/avatars");
    } catch (err) {
      return next(new ErrorHandler("Failed to upload profile image to Cloudinary", 500));
    }
  }

  const employee = await Employee.create(compactObject({
    user,
    employeeId,
    phone: optionalValue(phone),
    gender: optionalValue(gender),
    dateOfBirth: optionalValue(dateOfBirth),
    address,
    department,
    designation,
    manager: optionalValue(manager),
    joiningDate: optionalValue(joiningDate),
    employmentType: optionalValue(employmentType),
    salary: optionalValue(salary),
    profileImage: profileImageUrl,
    onboardingCompleted: false,
  }));

  if (profileImageUrl) {
    await User.findByIdAndUpdate(user, { profileImage: profileImageUrl });
  }

  return res.status(201).json({
    success: true,
    message: "Employee added successfully",
    employee,
  });
});

// Employee completes their own onboarding profile after accepting invite.
export const completeOnboarding = asyncHandler(async (req, res, next) => {
  const employee = await Employee.findOne({ user: req.user._id });

  if (!employee) {
    return next(new ErrorHandler("Employee profile not found", 404));
  }

  const allowedFields = [
    "phone",
    "gender",
    "dateOfBirth",
    "bloodGroup",
    "address",
    "emergencyContact",
    "bankDetails",
    "profileImage",
  ];

  const updates = {};

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  if (!employee.phone && !updates.phone) {
    return next(
      new ErrorHandler("Phone is required to complete onboarding", 400)
    );
  }

  if (req.file) {
    try {
      updates.profileImage = await uploadToCloudinary(req.file.buffer, "hrms/avatars");
    } catch (err) {
      return next(new ErrorHandler("Failed to upload profile image to Cloudinary", 500));
    }
  }

  updates.onboardingCompleted = true;

  const updatedEmployee = await Employee.findOneAndUpdate(
    { user: req.user._id },
    updates,
    {
      new: true,
      runValidators: true,
    }
  )
    .populate("user", "name email role isActive profileImage")
    .populate("department", "departmentName")
    .populate("designation", "title");

  if (updates.profileImage) {
    await User.findByIdAndUpdate(req.user._id, { profileImage: updates.profileImage });
  }

  return res.status(200).json({
    success: true,
    message: "Onboarding completed successfully",
    employee: updatedEmployee,
  });
});

// Employee updates their own profile from settings
export const updateOwnProfile = asyncHandler(async (req, res, next) => {
  const employee = await Employee.findOne({ user: req.user._id });

  if (!employee) {
    return next(new ErrorHandler("Employee profile not found", 404));
  }

  const allowedFields = [
    "phone",
    "gender",
    "dateOfBirth",
    "bloodGroup",
    "address",
    "emergencyContact",
    "bankDetails",
    "profileImage",
  ];

  const updates = {};

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  if (req.file) {
    try {
      updates.profileImage = await uploadToCloudinary(req.file.buffer, "hrms/avatars");
    } catch (err) {
      return next(new ErrorHandler("Failed to upload profile image to Cloudinary", 500));
    }
  }

  const updatedEmployee = await Employee.findOneAndUpdate(
    { user: req.user._id },
    updates,
    {
      new: true,
      runValidators: true,
    }
  )
    .populate("user", "name email role isActive profileImage")
    .populate("department", "departmentName")
    .populate("designation", "title");

  if (updates.profileImage) {
    await User.findByIdAndUpdate(req.user._id, { profileImage: updates.profileImage });
  }

  return res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    employee: updatedEmployee,
  });
});

// GET ALL EMPLOYEES
export const getEmployees = asyncHandler(async (req, res) => {
  let query = {};
  if (req.user.role === "manager") {
    const employeeRecord = await Employee.findOne({ user: req.user._id });
    if (employeeRecord && employeeRecord.department) {
      query = { department: employeeRecord.department };
    } else {
      query = { _id: null }; // return nothing if no profile or department
    }
  }

  const employees = await Employee.find(query)
    .populate("user", "name email role isActive profileImage")
    .populate("department", "departmentName")
    .populate("designation", "title")
    .populate({
      path: "manager",
      select: "employeeId user",
      populate: {
        path: "user",
        select: "name email profileImage",
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
    .populate("user", "name email role isActive profileImage")
    .populate("department", "departmentName")
    .populate("designation", "title")
    .populate({
      path: "manager",
      select: "employeeId user",
      populate: {
        path: "user",
        select: "name email profileImage",
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

  if (req.file) {
    try {
      req.body.profileImage = await uploadToCloudinary(req.file.buffer, "hrms/avatars");
    } catch (err) {
      return next(new ErrorHandler("Failed to upload profile image to Cloudinary", 500));
    }
  }

  employee = await Employee.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })
    .populate("user", "name email role isActive profileImage")
    .populate("department", "departmentName")
    .populate("designation", "title");

  if (req.body.profileImage) {
    await User.findByIdAndUpdate(employee.user, { profileImage: req.body.profileImage });
  }

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
