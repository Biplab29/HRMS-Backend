import express from "express";

import {
  bootstrapAdmin,
  registerUser,
  verifyInvite,
  acceptInvite,
  loginUser,
  logoutUser,
  getMe,
  forgotPassword,
  resetPassword,
} from "../controllers/auth.controller.js";

import {
  verifyJWT,
  authorizeRoles,
} from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";

const Authrouter = express.Router();

// Creates the first admin only when the database has no users.
Authrouter.post("/bootstrap-admin", upload.single("profileImage"), bootstrapAdmin);

// Admin/HR creates a no-password user and sends the invite email.
Authrouter.post(
  "/register",
  verifyJWT,
  authorizeRoles("admin", "hr"),
  upload.single("profileImage"),
  registerUser
);

Authrouter.post(
  "/invite",
  verifyJWT,
  authorizeRoles("admin", "hr"),
  upload.single("profileImage"),
  registerUser
);

// Employee accepts invite link and sets their first password.
Authrouter.get("/invite/verify", verifyInvite);
Authrouter.post("/accept-invite", acceptInvite);

// Login
Authrouter.post("/login", loginUser);

// Password Reset
Authrouter.post("/forgot-password", forgotPassword);
Authrouter.post("/reset-password", resetPassword);

// ==============================
// PROTECTED ROUTES
// ==============================

// Logout
Authrouter.post(
  "/logout",
  verifyJWT,
  logoutUser
);

// Get Logged In User
Authrouter.get(
  "/me",
  verifyJWT,
  getMe
);

// ==============================
// ROLE BASED ROUTES EXAMPLE
// ==============================

// Admin only
Authrouter.get(
  "/admin",
  verifyJWT,
  authorizeRoles("admin"),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: "Welcome Admin",
    });
  }
);

// HR only
Authrouter.get(
  "/hr",
  verifyJWT,
  authorizeRoles("hr"),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: "Welcome HR",
    });
  }
);

export default Authrouter;
