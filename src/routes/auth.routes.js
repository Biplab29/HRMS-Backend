import express from "express";

import {
  registerUser,
  loginUser,
  logoutUser,
  getMe,
} from "../controllers/auth.controller.js";

import {
  verifyJWT,
  authorizeRoles,
} from "../middlewares/auth.middleware.js";

const Authrouter = express.Router();


// Register
Authrouter.post("/register", registerUser);

// Login
Authrouter.post("/login", loginUser);

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