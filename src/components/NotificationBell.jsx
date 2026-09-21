import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchNotificationUnreadCount,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead
} from "../lib/api";

const relativeTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const seconds = Math.max(1, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return "Just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;

  return date.toLocaleDateString();
};

export default function NotificationBell() {
  const navigate = useNavigate();
  const panelRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [visibleCount, setVisibleCount] = useState(3);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadCount = async () => {
    try {
      const data = await fetchNotificationUnreadCount();
      setUnreadCount(data.count || 0);
    } catch {
      setUnreadCount(0);
    }
  };

  const loadNotifications = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchNotifications({ limit: 30 });
      setNotifications(data.notifications || []);
      await loadCount();
    } catch {
      setError("Couldn't load notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCount();

    const onFocus = () => loadCount();
    window.addEventListener("focus", onFocus);
    const interval = window.setInterval(loadCount, 120000);

    return () => {
      window.removeEventListener("focus", onFocus);
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setVisibleCount(3);
      loadNotifications();
    }
  }, [open]);

  useEffect(() => {
    const onPointerDown = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    if (open) document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const readAll = async () => {
    await markAllNotificationsRead();
    setNotifications((items) => items.map((item) => ({
      ...item,
      read_at: item.read_at || new Date().toISOString()
    })));
    setUnreadCount(0);
  };

  const openNotification = async (notification) => {
    if (!notification.read_at) {
      const updated = await markNotificationRead(notification.id);
      setNotifications((items) => items.map((item) => (
        item.id === notification.id ? updated : item
      )));
      setUnreadCount((count) => Math.max(0, count - 1));
    }

    setOpen(false);
    if (notification.action_url) navigate(notification.action_url);
  };

  return (
    <div className="notif-wrap" ref={panelRef}>
      <button
        className="notif-bell"
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={unreadCount ? `${unreadCount} unread notifications` : "Notifications"}
        aria-expanded={open}
      >
        <span aria-hidden="true">🔔</span>
        {unreadCount > 0 && <strong>{unreadCount > 99 ? "99+" : unreadCount}</strong>}
      </button>

      {open && (
        <section className="notif-panel" aria-label="Notifications">
          <header>
            <h2>Notifications</h2>
            <button type="button" onClick={readAll} disabled={!unreadCount}>
              Mark all as read
            </button>
          </header>

          {loading && <div className="notif-state">Loading notifications...</div>}

          {!loading && error && (
            <div className="notif-state">
              <p>{error}</p>
              <button type="button" onClick={loadNotifications}>Retry</button>
            </div>
          )}

          {!loading && !error && notifications.length === 0 && (
            <div className="notif-empty">
              <strong>You're all caught up.</strong>
              <span>Important updates will appear here.</span>
            </div>
          )}

          {!loading && !error && notifications.length > 0 && (
            <div className="notif-list">
              {notifications.slice(0, visibleCount).map((notification) => (
                <button
                  type="button"
                  key={notification.id}
                  className={`notif-item ${notification.read_at ? "" : "unread"}`}
                  onClick={() => openNotification(notification)}
                >
                  <span className="notif-dot" aria-hidden="true" />
                  <span>
                    <strong>{notification.title}</strong>
                    <em>{notification.message}</em>
                    <small>{relativeTime(notification.created_at)}</small>
                  </span>
                </button>
              ))}
              {visibleCount < notifications.length && (
                <button
                  type="button"
                  className="notif-load-more"
                  onClick={() => setVisibleCount((count) => Math.min(count + 6, notifications.length))}
                >
                  Load more
                </button>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
