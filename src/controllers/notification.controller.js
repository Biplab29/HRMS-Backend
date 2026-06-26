import { Notification } from "../models/notification.model.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import asyncHandler from "../utils/asyncHandler.js";

// Get all notifications for logged-in user
export const getNotifications = asyncHandler(async (req, res, next) => {
  const notifications = await Notification.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50); // limit to recent 50

  const unreadCount = await Notification.countDocuments({
    user: req.user._id,
    isRead: false,
  });

  res.status(200).json({
    success: true,
    notifications,
    unreadCount,
  });
});

// Mark single notification as read
export const markAsRead = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    return next(new ErrorHandler("Notification not found", 404));
  }

  // Ensure user owns this notification
  if (notification.user.toString() !== req.user._id.toString()) {
    return next(new ErrorHandler("Unauthorized access to notification", 403));
  }

  notification.isRead = true;
  await notification.save();

  res.status(200).json({
    success: true,
    notification,
  });
});

// Mark all notifications as read
export const markAllAsRead = asyncHandler(async (req, res, next) => {
  await Notification.updateMany(
    { user: req.user._id, isRead: false },
    { $set: { isRead: true } }
  );

  res.status(200).json({
    success: true,
    message: "All notifications marked as read",
  });
});
