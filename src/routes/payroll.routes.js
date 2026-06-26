import express from "express";
import {
  addPayroll,
  getAllPayrolls,
  getPayrollById,
  updatePayroll,
  markPayrollPaid,
  deletePayroll,
} from "../controllers/payroll.controller.js";


import {
  verifyJWT,
  authorizeRoles,
} from "../middlewares/auth.middleware.js";

const PayrollRouter = express.Router();

PayrollRouter.post("/add", verifyJWT, authorizeRoles("admin", "hr"), addPayroll);

PayrollRouter.get("/", verifyJWT, getAllPayrolls);

PayrollRouter.get("/:id", verifyJWT, getPayrollById);

PayrollRouter.put("/:id", verifyJWT, authorizeRoles("admin", "hr"), updatePayroll);

PayrollRouter.put(
  "/paid/:id",
  verifyJWT,
  authorizeRoles("admin", "hr"),
  markPayrollPaid
);

PayrollRouter.delete(
  "/:id",
  verifyJWT,
  authorizeRoles("admin", "hr"),
  deletePayroll
);

export default PayrollRouter;