import { User } from "../models/user.model.js";
import { Employee } from "../models/employee.model.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import asyncHandler from "../utils/asyncHandler.js";

export const registerUser = asyncHandler(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return next(
      new ErrorHandler("Name, email and password are required", 400)
    );
  }

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    return next(new ErrorHandler("User already exists", 400));
  }

  const user = await User.create({
    name,
    email,
    password,
    role,
  });

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return res.status(201).json({
    success: true,
    message: "User registered successfully",
    accessToken,
    refreshToken,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

// ==============================
// LOGIN USER
// ==============================
export const loginUser = asyncHandler(async (req, res, next) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return next(
      new ErrorHandler("Email/Employee ID and password are required", 400)
    );
  }

  let user = await User.findOne({ email: identifier }).select("+password");
  let employee = null;

  if (!user) {
    employee = await Employee.findOne({ empId: identifier }).populate({
      path: "user",
      select: "+password name email role isActive",
    });

    if (employee) {
      user = employee.user;
    }
  }

  if (!user) {
    return next(
      new ErrorHandler("Invalid email/employee ID or password", 401)
    );
  }

  if (!user.isActive) {
    return next(new ErrorHandler("Account is inactive", 403));
  }

  const isPasswordMatch = await user.comparePassword(password);

  if (!isPasswordMatch) {
    return next(
      new ErrorHandler("Invalid email/employee ID or password", 401)
    );
  }

  if (!employee && user.role === "employee") {
    employee = await Employee.findOne({ user: user._id });
  }

  // const accessToken = user.generateAccessToken();
  // const refreshToken = user.generateRefreshToken();

  // user.refreshToken = refreshToken;
  // await user.save({ validateBeforeSave: false });

  // return res.status(200).json({
  //   success: true,
  //   message: "Login successful",
  //   accessToken,
  //   refreshToken,
  //   user: {
  //     _id: user._id,
  //     name: user.name,
  //     email: user.email,
  //     role: user.role,
  //   },
  //   employee: employee
  //     ? {
  //         _id: employee._id,
  //         empId: employee.empId,
  //         department: employee.department,
  //         designation: employee.designation,
  //       }
  //     : null,
  // });
  const accessToken = user.generateAccessToken();
const refreshToken = user.generateRefreshToken();

user.refreshToken = refreshToken;
await user.save({ validateBeforeSave: false });

const options = {
  httpOnly: true,
  secure: false, 
  sameSite: "lax",
};

return res
  .status(200)
  .cookie("accessToken", accessToken, {
    ...options,
    maxAge: 15 * 60 * 1000,
  })
  .cookie("refreshToken", refreshToken, {
    ...options,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  })
  .json({
    success: true,
    message: "Login successful",
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    employee: employee
      ? {
          _id: employee._id,
          empId: employee.empId,
          department: employee.department,
          designation: employee.designation,
        }
      : null,
  });
});

// ==============================
// LOGOUT USER
// ==============================
export const logoutUser = asyncHandler(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, {
    refreshToken: null,
  });

  return res.status(200).json({
    success: true,
    message: "Logout successful",
  });
});

// ==============================
// GET ME
// ==============================
export const getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select(
    "-password -refreshToken"
  );

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  let employee = null;

  if (user.role === "employee") {
    employee = await Employee.findOne({ user: user._id });
  }

  return res.status(200).json({
    success: true,
    user,
    employee,
  });
});