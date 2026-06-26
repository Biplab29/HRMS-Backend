import express from "express";
import {
  addEmployee,
  completeOnboarding,
  getEmployees,
  getSingleEmployee,
  updateEmployee,
  updateOwnProfile,
  deleteEmployee,
} from "../controllers/employee.controller.js";

import { registerEmployee } from "../controllers/auth.controller.js";

import {
  verifyJWT,
  authorizeRoles,
} from "../middlewares/auth.middleware.js";

const EmpRouter = express.Router();

const createOrRegisterEmployee = (req, res, next) => {
  if (req.body?.user) {
    return addEmployee(req, res, next);
  }

  return registerEmployee(req, res, next);
};

EmpRouter.post("/", verifyJWT, authorizeRoles("admin", "hr"), createOrRegisterEmployee);
EmpRouter.post("/register", verifyJWT, authorizeRoles("admin", "hr"), registerEmployee);
EmpRouter.post("/invite", verifyJWT, authorizeRoles("admin", "hr"), registerEmployee);
EmpRouter.post("/profile", verifyJWT, authorizeRoles("admin", "hr"), addEmployee);
EmpRouter.get("/", verifyJWT, authorizeRoles("admin", "hr", "manager"), getEmployees);
EmpRouter.put(
  "/onboarding/complete",
  verifyJWT,
  authorizeRoles("employee", "manager"),
  completeOnboarding
);
EmpRouter.put(
  "/profile/update",
  verifyJWT,
  updateOwnProfile
);
EmpRouter.get("/:id", verifyJWT, getSingleEmployee);
EmpRouter.put("/:id", verifyJWT, authorizeRoles("admin", "hr"), updateEmployee);
EmpRouter.delete("/:id", verifyJWT, authorizeRoles("admin"), deleteEmployee);

export default EmpRouter;
