import express from "express";
import {
  addPayroll,
  getAllPayrolls,
  getPayrollById,
  updatePayroll,
  markPayrollPaid,
  deletePayroll,
} from "../controllers/payroll.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";

const PayrollRouter = express.Router();

PayrollRouter.post("/add", verifyJWT, addPayroll);

PayrollRouter.get("/", verifyJWT, getAllPayrolls);

PayrollRouter.get("/:id", verifyJWT, getPayrollById);

PayrollRouter.put("/:id", verifyJWT, updatePayroll);

PayrollRouter.put(
  "/paid/:id",
  verifyJWT,
  markPayrollPaid
);

PayrollRouter.delete(
  "/:id",
  verifyJWT,
  deletePayroll
);

export default PayrollRouter;