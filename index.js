import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import Authrouter from "./src/routes/auth.routes.js";
import cookieParser from "cookie-parser";
import { errorMiddleware } from "./src/middlewares/error.middleware.js";
import { connectDB } from "./src/config/db.js";
import EmpRouter from "./src/routes/employee.routes.js";
import DepartmentRouter  from "./src/routes/department.routes.js";
import DesignationRouter from "./src/routes/designation.routes.js";
import AttendanceRouter from "./src/routes/attendance.routes.js";
import LeaveRouter from "./src/routes/leave.routes.js";
import PayrollRouter from "./src/routes/payroll.routes.js";


dotenv.config({});

const app = express();

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(errorMiddleware);

app.use("/api/v1/auth", Authrouter);
app.use("/api/v1/employee",EmpRouter);
app.use("/api/v1/department", DepartmentRouter);
app.use("/api/v1/designation", DesignationRouter);
app.use("/api/v1/attendance", AttendanceRouter);
app.use("/api/v1/leave",LeaveRouter);
app.use("/api/v1/payroll", PayrollRouter);



app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
  });
});

const PORT = process.env.PORT || 3000;
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.log(err);
  });