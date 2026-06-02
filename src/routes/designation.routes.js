import express from "express";
import {
  addDesignation,
  getAllDesignations,
  getDesignationById,
  updateDesignation,
  deleteDesignation,
} from "../controllers/designation.controller.js";

const DesignationRouter = express.Router();

DesignationRouter.post("/add", addDesignation);
DesignationRouter.get("/", getAllDesignations);
DesignationRouter.get("/:id", getDesignationById);
DesignationRouter.put("/:id", updateDesignation);
DesignationRouter.delete("/:id", deleteDesignation);

export default DesignationRouter;