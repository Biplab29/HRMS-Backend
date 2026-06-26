import express from "express";
import {
  addDesignation,
  getAllDesignations,
  getDesignationById,
  updateDesignation,
  deleteDesignation,
} from "../controllers/designation.controller.js";
import {
  verifyJWT,
  authorizeRoles,
} from "../middlewares/auth.middleware.js";

const DesignationRouter = express.Router();

DesignationRouter.post("/add", verifyJWT, authorizeRoles("admin", "hr"), addDesignation);
DesignationRouter.get("/", verifyJWT, getAllDesignations);
DesignationRouter.get("/:id", verifyJWT, getDesignationById);
DesignationRouter.put("/:id", verifyJWT, authorizeRoles("admin", "hr"), updateDesignation);
DesignationRouter.delete("/:id", verifyJWT, authorizeRoles("admin", "hr"), deleteDesignation);

export default DesignationRouter;