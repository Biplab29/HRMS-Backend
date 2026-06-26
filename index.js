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
import NotificationRouter from "./src/routes/notification.routes.js";
import TaskRouter from "./src/routes/task.routes.js";


dotenv.config({});

const app = express();

const allowedOrigins = (
  process.env.CORS_ORIGIN ||
  process.env.FRONTEND_URL ||
  "http://localhost:5173"
)
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin.replace(/\/$/, ""))) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/v1/auth", Authrouter);
app.use("/api/v1/employee",EmpRouter);
app.use("/api/v1/department", DepartmentRouter);
app.use("/api/v1/designation", DesignationRouter);
app.use("/api/v1/attendance", AttendanceRouter);
app.use("/api/v1/leave",LeaveRouter);
app.use("/api/v1/payroll", PayrollRouter);
app.use("/api/v1/notification", NotificationRouter);
app.use("/api/v1/task", TaskRouter);



app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
  });
});

app.use(errorMiddleware);

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
