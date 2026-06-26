import express from "express";
import {
  addAttendance,
  getAllAttendance,
  getAttendanceById,
  updateAttendance,
  deleteAttendance,
  checkIn,
  checkOut,
} from "../controllers/attendance.controller.js";

import {
  verifyJWT,
  authorizeRoles,
} from "../middlewares/auth.middleware.js";

const AttendanceRouter = express.Router();

AttendanceRouter.post("/add", verifyJWT, authorizeRoles("admin", "hr"), addAttendance);

AttendanceRouter.get("/", verifyJWT, getAllAttendance);

AttendanceRouter.get("/:id", verifyJWT, getAttendanceById);

AttendanceRouter.put("/:id", verifyJWT, authorizeRoles("admin", "hr"), updateAttendance);

AttendanceRouter.delete("/:id", verifyJWT, authorizeRoles("admin", "hr"), deleteAttendance);

// Employee Attendance
AttendanceRouter.post("/check-in", verifyJWT, checkIn);

AttendanceRouter.post("/check-out", verifyJWT, checkOut);

export default AttendanceRouter;