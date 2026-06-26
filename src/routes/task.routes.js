import express from "express";
import {
  createTask,
  updateTaskStatus,
  getTasks,
} from "../controllers/task.controller.js";

import {
  verifyJWT,
  authorizeRoles,
} from "../middlewares/auth.middleware.js";

const TaskRouter = express.Router();

TaskRouter.post(
  "/",
  verifyJWT,
  authorizeRoles("admin", "hr", "manager"),
  createTask
);

TaskRouter.put(
  "/:id/status",
  verifyJWT,
  updateTaskStatus
);

TaskRouter.get(
  "/",
  verifyJWT,
  getTasks
);

export default TaskRouter;
