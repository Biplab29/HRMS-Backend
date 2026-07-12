import crypto from "crypto";
import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { Employee } from "../models/employee.model.js";
import { Department } from "../models/department.model.js";
import { Designation } from "../models/designation.model.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import asyncHandler from "../utils/asyncHandler.js";
import { generateUniqueEmployeeId } from "../utils/generateEmployeeId.js";
import { sendEmail } from "../utils/sendEmail.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";

const EMPLOYEE_PROFILE_ROLES = ["employee", "manager"];
const USER_ROLES = ["admin", "hr", "manager", "employee"];
const EMPLOYMENT_TYPES = ["full-time", "part-time", "intern", "contract"];

const isBlank = (value) =>
  value === undefined || value === null || String(value).trim() === "";

const normalizeObjectId = (value, label, required = false) => {
  if (isBlank(value)) {
    if (required) {
      throw new ErrorHandler(`${label} is required`, 400);
    }

    return undefined;
  }

  const normalizedValue = String(value).trim();

  if (!mongoose.Types.ObjectId.isValid(normalizedValue)) {
    throw new ErrorHandler(`${label} is invalid`, 400);
  }

  return normalizedValue;
};

const normalizeSalary = (salary) => {
  if (isBlank(salary)) return undefined;

  const normalizedSalary = Number(salary);

  if (!Number.isFinite(normalizedSalary) || normalizedSalary < 0) {
    throw new ErrorHandler("Salary must be a valid positive number", 400);
  }

  return normalizedSalary;
};

const normalizeDate = (date, label) => {
  if (isBlank(date)) return undefined;

  const normalizedDate = new Date(date);

  if (Number.isNaN(normalizedDate.getTime())) {
    throw new ErrorHandler(`${label} is invalid`, 400);
  }

  return normalizedDate;
};

const normalizeEmploymentType = (employmentType) => {
  if (isBlank(employmentType)) return undefined;

  const normalizedType = String(employmentType).trim().toLowerCase();

  if (!EMPLOYMENT_TYPES.includes(normalizedType)) {
    throw new ErrorHandler("Employment type is invalid", 400);
  }

  return normalizedType;
};

const buildEmployeeInvitePayload = async ({
  department,
  designation,
  manager,
  joiningDate,
  employmentType,
  salary,
}) => {
  const departmentId = normalizeObjectId(department, "Department", true);
  const designationId = normalizeObjectId(designation, "Designation", true);
  const managerId = normalizeObjectId(manager, "Manager");

  const [departmentDoc, designationDoc, managerDoc] = await Promise.all([
    Department.findById(departmentId),
    Designation.findById(designationId),
    managerId ? Employee.findById(managerId) : null,
  ]);

  if (!departmentDoc || !departmentDoc.isActive) {
    throw new ErrorHandler("Department not found or inactive", 404);
  }

  if (!designationDoc || !designationDoc.isActive) {
    throw new ErrorHandler("Designation not found or inactive", 404);
  }

  if (String(designationDoc.department) !== String(departmentDoc._id)) {
    throw new ErrorHandler(
      "Designation does not belong to selected department",
      400
    );
  }

  if (managerId && !managerDoc) {
    throw new ErrorHandler("Manager employee profile not found", 404);
  }

  return {
    department: departmentId,
    designation: designationId,
    manager: managerId,
    joiningDate: normalizeDate(joiningDate, "Joining date"),
    employmentType: normalizeEmploymentType(employmentType),
    salary: normalizeSalary(salary),
  };
};

const compactObject = (value) =>
  Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined)
  );

const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
});

const appendTokenToUrl = (url, token) => {
  try {
    const inviteUrl = new URL(url);
    inviteUrl.searchParams.set("token", token);
    return inviteUrl.toString();
  } catch {
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}token=${encodeURIComponent(token)}`;
  }
};

const buildInviteLink = (token) => {
  const configuredUrl = process.env.INVITE_ACCEPT_URL?.trim();
  if (configuredUrl) {
    return appendTokenToUrl(configuredUrl, token);
  }

  const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:5173")
    .trim()
    .replace(/\/$/, "");

  return `${frontendUrl}/accept-invite?token=${encodeURIComponent(token)}`;
};

const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

const escapeHtml = (value) => {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
};

const serializeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  isActive: user.isActive,
  profileImage: user.profileImage,
});

const serializeEmployee = (employee) => {
  if (!employee) return null;

  return {
    _id: employee._id,
    employeeId: employee.employeeId,
    department: employee.department,
    designation: employee.designation,
    onboardingCompleted: employee.onboardingCompleted,
    profileImage: employee.profileImage,
  };
};

const sendInviteEmail = async ({ user, inviteLink }) => {
  const safeName = escapeHtml(user.name);
  const safeInviteLink = escapeHtml(inviteLink);

  return sendEmail({
    to: user.email,
    subject: "Complete your HRMS account setup",
    text: [
      `Hi ${user.name},`,
      "",
      "You have been invited to the HRMS application.",
      "Use the link below to set your password. This link expires in 48 hours.",
      "",
      inviteLink,
      "",
      "If you cannot click the link, please copy and paste it into your browser.",
    ].join("\n"),
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #09111f; color: #e2e8f0; border-radius: 12px; border: 1px solid #1e293b;">
        <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #1e293b;">
          <h2 style="color: #25c979; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px;">PeopleGrid</h2>
          <p style="color: #64748b; margin: 5px 0 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Account Invitation</p>
        </div>
        <div style="padding: 30px 20px;">
          <h3 style="color: #ffffff; margin-top: 0; font-size: 18px;">Welcome, ${safeName}!</h3>
          <p style="line-height: 1.6; font-size: 14px; color: #94a3b8;">You have been invited to join the <strong>PeopleGrid</strong> platform. Please use the button below to set up your password and complete your registration.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${safeInviteLink}" style="display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #25c979 0%, #1f9c5e 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; box-shadow: 0 4px 15px rgba(37,201,121,0.25);">Set Password & Setup Account</a>
          </div>
          <p style="color: #64748b; font-size: 12px; line-height: 1.5; background-color: #020617; padding: 15px; border-radius: 6px; border: 1px solid #1e293b;">
            <strong>Note:</strong> This link is secure and will expire in 48 hours for security reasons. If the button above does not work, please copy and paste the link below into your browser:<br>
            <a href="${safeInviteLink}" style="color: #25c979; word-break: break-all; text-decoration: none;">${safeInviteLink}</a>
          </p>
        </div>
        <div style="text-align: center; padding-top: 20px; border-top: 1px solid #1e293b; font-size: 11px; color: #64748b;">
          <p style="margin: 0;">This is an automated system notification. Please do not reply directly to this email.</p>
          <p style="margin: 5px 0 0 0;">&copy; 2026 PeopleGrid. All rights reserved.</p>
        </div>
      </div>
    `,
  });
};

export const bootstrapAdmin = asyncHandler(async (req, res, next) => {
  const existingUsers = await User.countDocuments();

  if (existingUsers > 0) {
    return next(
      new ErrorHandler(
        "Initial admin already exists. Ask an admin or HR user to invite you.",
        409
      )
    );
  }

  const { name, email, password, confirmPassword } = req.body;

  if (!name || !email || !password) {
    return next(
      new ErrorHandler("Name, email and password are required", 400));
  }

  if (password.length < 6) {
    return next(
      new ErrorHandler("Password must be at least 6 characters", 400)
    );
  }

  if (confirmPassword !== undefined && password !== confirmPassword) {
    return next(new ErrorHandler("Password confirmation does not match", 400));
  }

  let profileImageUrl = null;
  if (req.file) {
    try {
      profileImageUrl = await uploadToCloudinary(req.file.buffer, "hrms/avatars");
    } catch (err) {
      return next(new ErrorHandler("Failed to upload profile image to Cloudinary", 500));
    }
  }

  const user = await User.create({
    name: String(name).trim(),
    email: String(email).trim().toLowerCase(),
    password,
    role: "admin",
    isActive: true,
    profileImage: profileImageUrl,
  });

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.refreshToken = refreshToken;
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  const options = getCookieOptions();

  return res
    .status(201)
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
      message: "Initial admin account created",
      user: serializeUser(user),
      employee: null,
    });
});

// Admin/HR creates a user without a password and sends an invite email.
export const registerUser = asyncHandler(async (req, res, next) => {
  const {
    name,
    email,
    role = "employee",
    department,
    designation,
    manager,
    joiningDate,
    employmentType,
    salary,
  } = req.body;

  if (!name || !email) {
    return next(new ErrorHandler("Name and email are required", 400));
  }

  const normalizedName = String(name).trim();
  const normalizedEmail = String(email).trim().toLowerCase();
  const normalizedRole = String(role).trim().toLowerCase();

  if (!normalizedName || !normalizedEmail) {
    return next(new ErrorHandler("Name and email are required", 400));
  }

  if (!USER_ROLES.includes(normalizedRole)) {
    return next(new ErrorHandler("Invalid user role", 400));
  }

  // Restrict Admin/HR role creation to Admins only
  if ((normalizedRole === "admin" || normalizedRole === "hr") && req.user.role !== "admin") {
    return next(new ErrorHandler("Only administrators can create Admin or HR Manager accounts", 403));
  }

  let employeeInvitePayload = null;

  if (EMPLOYEE_PROFILE_ROLES.includes(normalizedRole)) {
    employeeInvitePayload = await buildEmployeeInvitePayload({
      department,
      designation,
      manager,
      joiningDate,
      employmentType,
      salary,
    });
  }

  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    return next(new ErrorHandler("User already exists", 400));
  }

  // let profileImageUrl = null;
  // if (req.file) {
  //   try {
  //     profileImageUrl = await uploadToCloudinary(req.file.buffer, "hrms/avatars");
  //   } catch (err) {
  //     return next(new ErrorHandler("Failed to upload profile image to Cloudinary", 500));
  //   }
  // }

  const user = new User({
    name: normalizedName,
    email: normalizedEmail,
    role: normalizedRole,
    isActive: false,
    // profileImage: profileImageUrl,
  });

  const inviteToken = user.generateInviteToken();
  await user.save({ validateBeforeSave: false });

  let employee = null;

  if (EMPLOYEE_PROFILE_ROLES.includes(normalizedRole)) {
    const employeeId = await generateUniqueEmployeeId();

    try {
      employee = await Employee.create(compactObject({
        user: user._id,
        employeeId,
        ...employeeInvitePayload,
        // profileImage: profileImageUrl,
        onboardingCompleted: false,
      }));
    } catch (error) {
      await User.findByIdAndDelete(user._id);
      throw error;
    }
  }

  const inviteLink = buildInviteLink(inviteToken);
  
  // Send invite email in background (non-blocking) to prevent UI hanging
  sendInviteEmail({ user, inviteLink })
    .then(result => {
      if (!result.sent) {
        console.error("Invite email failed to send in background:", result.reason);
      } else {
        console.log(`✅ Invite email sent successfully to ${user.email}`);
      }
    })
    .catch(err => {
      console.error("Invite email background execution error:", err);
    });

  return res.status(201).json({
    success: true,
    message: "User invited successfully",
    emailSent: true,
    inviteLink,
    user: serializeUser(user),
    employee: serializeEmployee(employee),
  });
});

export const registerEmployee = (req, res, next) => {
  const role = String(req.body?.role || "employee").trim().toLowerCase();

  if (!EMPLOYEE_PROFILE_ROLES.includes(role)) {
    return next(
      new ErrorHandler(
        "Employee registration role must be employee or manager",
        400
      )
    );
  }

  req.body = {
    ...(req.body || {}),
    role,
  };

  return registerUser(req, res, next);
};

export const verifyInvite = asyncHandler(async (req, res, next) => {
  const token = req.query.token || req.body?.token;

  if (!token) {
    return next(new ErrorHandler("Invite token is required", 400));
  }

  const user = await User.findOne({
    inviteToken: hashToken(token),
    inviteTokenExpiry: { $gt: new Date() },
  }).select("+password +inviteToken");

  if (!user) {
    return next(new ErrorHandler("Invalid or expired invite link", 400));
  }

  if (user.password) {
    return next(new ErrorHandler("Invite has already been accepted", 400));
  }

  const employee = await Employee.findOne({ user: user._id });

  return res.status(200).json({
    success: true,
    message: "Invite link is valid",
    expiresAt: user.inviteTokenExpiry,
    user: serializeUser(user),
    employee: serializeEmployee(employee),
  });
});

// Employee uses the emailed token once to set the initial password.
export const acceptInvite = asyncHandler(async (req, res, next) => {
  const { password, confirmPassword } = req.body || {};
  const token = req.body?.token || req.query.token;

  if (!token || !password) {
    return next(new ErrorHandler("Token and password are required", 400));
  }

  if (password.length < 6) {
    return next(
      new ErrorHandler("Password must be at least 6 characters", 400)
    );
  }

  if (confirmPassword !== undefined && password !== confirmPassword) {
    return next(new ErrorHandler("Password confirmation does not match", 400));
  }

  const user = await User.findOne({
    inviteToken: hashToken(token),
    inviteTokenExpiry: { $gt: new Date() },
  }).select("+password +inviteToken");

  if (!user) {
    return next(new ErrorHandler("Invalid or expired invite link", 400));
  }

  if (user.password) {
    return next(new ErrorHandler("Invite has already been accepted", 400));
  }

  user.password = password;
  user.inviteToken = null;
  user.inviteTokenExpiry = null;
  user.isActive = true;
  await user.save();

  const employee = await Employee.findOne({ user: user._id });

  return res.status(200).json({
    success: true,
    message: "Password set successfully. Please login and complete onboarding.",
    user: serializeUser(user),
    employee: serializeEmployee(employee),
  });
});

const ensureEmployeeProfileExists = async (user) => {
  let employee = await Employee.findOne({ user: user._id });
  if (!employee && EMPLOYEE_PROFILE_ROLES.includes(user.role)) {
    const employeeId = await generateUniqueEmployeeId();
    const defaultDept = await Department.findOne({ isActive: { $ne: false } });
    const defaultDesg = await Designation.findOne({ isActive: { $ne: false } });
    employee = await Employee.create({
      user: user._id,
      employeeId,
      department: defaultDept?._id,
      designation: defaultDesg?._id,
      joiningDate: new Date(),
      employmentType: "full-time",
      status: "active",
      onboardingCompleted: false,
    });
  }
  return employee;
};

// ==============================
// LOGIN USER
// ==============================
export const loginUser = asyncHandler(async (req, res, next) => {
  const { identifier, email, employeeId, password } = req.body || {};
  const loginIdentifier = String(identifier || email || employeeId || "").trim();

  if (!loginIdentifier || !password) {
    return next(
      new ErrorHandler("Email/Employee ID and password are required", 400)
    );
  }

  let user = await User.findOne({
    email: loginIdentifier.toLowerCase(),
  }).select("+password");
  let employee = null;

  if (!user) {
    employee = await Employee.findOne({
      employeeId: loginIdentifier.toUpperCase(),
    }).populate({
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

  if (!user.password) {
    return next(
      new ErrorHandler("Please accept your invite and set a password first", 403)
    );
  }

  const isPasswordMatch = await user.comparePassword(password);

  if (!isPasswordMatch) {
    return next(
      new ErrorHandler("Invalid email/employee ID or password", 401)
    );
  }

  if (EMPLOYEE_PROFILE_ROLES.includes(user.role)) {
    employee = await ensureEmployeeProfileExists(user);
  }

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.refreshToken = refreshToken;
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  const options = getCookieOptions();

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
      user: serializeUser(user),
      employee: serializeEmployee(employee),
    });
});

// ==============================
// LOGOUT USER
// ==============================
export const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user.id, {
    refreshToken: null,
  });

  return res
    .status(200)
    .clearCookie("accessToken", getCookieOptions())
    .clearCookie("refreshToken", getCookieOptions())
    .json({
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

  if (EMPLOYEE_PROFILE_ROLES.includes(user.role)) {
    employee = await ensureEmployeeProfileExists(user);
  }

  return res.status(200).json({
    success: true,
    user,
    employee,
  });
});

// ==============================
// FORGOT PASSWORD
// ==============================
export const forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  if (!email) {
    return next(new ErrorHandler("Email is required", 400));
  }
  const user = await User.findOne({ email: email.trim().toLowerCase() });
  if (!user) {
    return res.status(200).json({
      success: true,
      message: "If that email is registered, a password reset link has been sent.",
    });
  }

  const resetToken = crypto.randomBytes(20).toString("hex");
  user.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  user.passwordResetExpiry = Date.now() + 15 * 60 * 1000;

  await user.save({ validateBeforeSave: false });

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
  
  const message = `You requested a password reset. Please click on the link below to reset your password:\n\n${resetUrl}\n\nThis link is valid for 15 minutes. If you did not request this, please ignore this email.`;

  const html = `
    <div style="font-family: sans-serif; padding: 20px; color: #333; background-color: #fafafa; border: 1px solid #eee; border-radius: 10px; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #25c979;">Password Reset Request</h2>
      <p>You requested a password reset for your PeopleGrid account. Click the button below to choose a new password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="display: inline-block; background-color: #25c979; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px;">Reset Password</a>
      </div>
      <p>This link is valid for 15 minutes.</p>
      <p style="color: #666; font-size: 13px;">If the button doesn't work, copy and paste this link in your browser:</p>
      <p style="background-color: #f0f0f0; padding: 10px; border-radius: 5px; word-break: break-all; font-family: monospace; font-size: 12px;">${resetUrl}</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="font-size: 11px; color: #999; text-align: center;">This is an automated system email. Please do not reply directly.</p>
    </div>
  `;

  try {
    await sendEmail({
      to: user.email,
      subject: "PeopleGrid - Password Reset Request",
      text: message,
      html
    });
    
    res.status(200).json({
      success: true,
      message: "If that email is registered, a password reset link has been sent.",
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpiry = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new ErrorHandler("Email could not be sent", 500));
  }
});

// ==============================
// RESET PASSWORD
// ==============================
export const resetPassword = asyncHandler(async (req, res, next) => {
  const { token, password, confirmPassword } = req.body;
  if (!token || !password) {
    return next(new ErrorHandler("Token and password are required", 400));
  }
  if (password !== confirmPassword) {
    return next(new ErrorHandler("Passwords do not match", 400));
  }

  const hashedToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpiry: { $gt: Date.now() },
  });

  if (!user) {
    return next(new ErrorHandler("Invalid or expired reset token", 400));
  }

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpiry = undefined;
  await user.save();

  res.status(200).json({
    success: true,
    message: "Password reset successful. Please login with your new password.",
  });
});



