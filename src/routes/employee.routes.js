import express from "express";
import {
  addEmployee,
  getEmployees,
  getSingleEmployee,
  updateEmployee,
  deleteEmployee,
} from "../controllers/employee.controller.js";

import {
  verifyJWT,
  authorizeRoles,
} from "../middlewares/auth.middleware.js";

const EmpRouter = express.Router();

EmpRouter.post("/", verifyJWT, authorizeRoles("admin", "hr"), addEmployee);
EmpRouter.get("/", verifyJWT, authorizeRoles("admin", "hr", "manager"), getEmployees);
EmpRouter.get("/:id", verifyJWT, getSingleEmployee);
EmpRouter.put("/:id", verifyJWT, authorizeRoles("admin", "hr"), updateEmployee);
EmpRouter.delete("/:id", verifyJWT, authorizeRoles("admin"), deleteEmployee);

export default EmpRouter;