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

import { verifyJWT } from "../middlewares/auth.middleware.js";

const LeaveRouter = express.Router();

LeaveRouter.post("/apply", verifyJWT, applyLeave);

LeaveRouter.get("/", verifyJWT, getAllLeaves);

LeaveRouter.get("/:id", verifyJWT, getLeaveById);

LeaveRouter.put("/:id", verifyJWT, updateLeave);

LeaveRouter.put(
  "/approve/:id",
  verifyJWT,
  approveLeave
);

LeaveRouter.put(
  "/reject/:id",
  verifyJWT,
  rejectLeave
);

LeaveRouter.delete(
  "/:id",
  verifyJWT,
  deleteLeave
);

export default LeaveRouter;