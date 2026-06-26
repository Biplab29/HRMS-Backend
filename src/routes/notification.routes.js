import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  getNotifications,
  markAllAsRead,
  markAsRead,
} from "../controllers/notification.controller.js";

const router = express.Router();

router.use(verifyJWT);

router.get("/", getNotifications);
router.patch("/read-all", markAllAsRead);
router.patch("/:id/read", markAsRead);

export default router;
