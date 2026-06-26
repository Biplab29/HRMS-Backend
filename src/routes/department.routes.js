import express from "express";
import {
  addDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
} from "../controllers/department.controller.js";
import {
  verifyJWT,
  authorizeRoles,
} from "../middlewares/auth.middleware.js";

const DepartmentRouter = express.Router();

DepartmentRouter.post("/add", verifyJWT, authorizeRoles("admin", "hr"), addDepartment);
DepartmentRouter.get("/", verifyJWT, getAllDepartments);
DepartmentRouter.get("/:id", verifyJWT, getDepartmentById);
DepartmentRouter.put("/:id", verifyJWT, authorizeRoles("admin", "hr"), updateDepartment);
DepartmentRouter.delete("/:id", verifyJWT, authorizeRoles("admin", "hr"), deleteDepartment);

export default DepartmentRouter;