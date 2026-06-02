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

import { verifyJWT } from "../middlewares/auth.middleware.js";

const AttendanceRouter = express.Router();

// Attendance CRUD
AttendanceRouter.post("/add", verifyJWT, addAttendance);

AttendanceRouter.get("/", verifyJWT, getAllAttendance);

AttendanceRouter.get("/:id", verifyJWT, getAttendanceById);

AttendanceRouter.put("/:id", verifyJWT, updateAttendance);

AttendanceRouter.delete("/:id", verifyJWT, deleteAttendance);

// Employee Attendance
AttendanceRouter.post("/check-in", verifyJWT, checkIn);

AttendanceRouter.post("/check-out", verifyJWT, checkOut);

export default AttendanceRouter;