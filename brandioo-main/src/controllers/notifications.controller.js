import {
  listNotificationsDB,
  markAllNotificationsReadDB,
  markNotificationReadDB,
  unreadCountDB
} from "../services/notification.service.js";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const listNotifications = async (req, res) => {
  try {
    const notifications = await listNotificationsDB(req.user.id, req.query.limit, req.query.before);
    res.json({ notifications });
  } catch (err) {
    console.error("LIST NOTIFICATIONS ERROR:", err);
    res.status(500).json({ message: "Could not load notifications" });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const count = await unreadCountDB(req.user.id);
    res.json({ count });
  } catch (err) {
    console.error("UNREAD NOTIFICATIONS ERROR:", err);
    res.status(500).json({ message: "Could not load notifications" });
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    if (!uuidPattern.test(req.params.id || "")) {
      return res.status(400).json({ message: "Invalid notification id" });
    }

    const notification = await markNotificationReadDB(req.user.id, req.params.id);
    if (!notification) return res.status(404).json({ message: "Notification not found" });

    res.json(notification);
  } catch (err) {
    console.error("READ NOTIFICATION ERROR:", err);
    res.status(500).json({ message: "Could not update notification" });
  }
};

export const markAllNotificationsRead = async (req, res) => {
  try {
    const updated = await markAllNotificationsReadDB(req.user.id);
    res.json({ updated });
  } catch (err) {
    console.error("READ ALL NOTIFICATIONS ERROR:", err);
    res.status(500).json({ message: "Could not update notifications" });
  }
};
