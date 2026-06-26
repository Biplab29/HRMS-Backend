import express from "express";
import {
  applyLeave,
  getAllLeaves,
  getLeaveById,
  updateLeave,
  approveLeave,
  rejectLeave,
  deleteLeave,
} from "../controllers/leave.controller.js";

import {
  verifyJWT,
  authorizeRoles,
} from "../middlewares/auth.middleware.js";

const LeaveRouter = express.Router();

LeaveRouter.post("/apply", verifyJWT, applyLeave);

LeaveRouter.get("/", verifyJWT, getAllLeaves);

LeaveRouter.get("/:id", verifyJWT, getLeaveById);

LeaveRouter.put("/:id", verifyJWT, updateLeave);

LeaveRouter.put(
  "/approve/:id",
  verifyJWT,
  authorizeRoles("admin", "hr", "manager"),
  approveLeave
);

LeaveRouter.put(
  "/reject/:id",
  verifyJWT,
  authorizeRoles("admin", "hr", "manager"),
  rejectLeave
);

LeaveRouter.delete(
  "/:id",
  verifyJWT,
  authorizeRoles("admin"),
  deleteLeave
);

export default LeaveRouter;