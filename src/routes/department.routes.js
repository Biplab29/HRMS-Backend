import express from "express";
import {
  addDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
} from "../controllers/department.controller.js";

const DepartmentRouter = express.Router();

DepartmentRouter.post("/add", addDepartment);
DepartmentRouter.get("/", getAllDepartments);
DepartmentRouter.get("/:id", getDepartmentById);
DepartmentRouter.put("/:id", updateDepartment);
DepartmentRouter.delete("/:id", deleteDepartment);

export default DepartmentRouter;