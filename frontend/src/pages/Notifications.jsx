import React, { useEffect, useState } from "react";
import axios from "axios";
import Cookie from "cookies-js";
import { Link } from "react-router-dom";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const token = Cookie.get("token");
  const BACKEND_URL = import.meta.env.VITE_URL;

  const fetchNotifications = async () => {
    const response = await axios.get(`${BACKEND_URL}notifications?limit=30`, {
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true,
    });
    setNotifications(response.data.notifications);
  };

  const markAllAsRead = async () => {
    await axios.patch(
      `${BACKEND_URL}notifications/read-all`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      }
    );
    fetchNotifications();
  };

  const markRead = async (id) => {
    await axios.patch(
      `${BACKEND_URL}notifications/${id}/read`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      }
    );
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
    );
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const getMessage = (notification) => {
    const sender = notification.sender?.username || "Someone";
    if (notification.type === "like") return `${sender} liked your post`;
    if (notification.type === "comment") return `${sender} commented on your post`;
    if (notification.type === "follow") return `${sender} started following you`;
    return "New activity";
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <button
          className="bg-blue-900 text-white px-4 py-2 rounded-md"
          onClick={markAllAsRead}
        >
          Mark all as read
        </button>
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <p className="text-gray-500">No notifications yet.</p>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => (
              <div
                key={notification._id}
                className={`w-full rounded-xl border transition-colors p-4 flex items-start gap-3 ${
                  notification.isRead
                    ? "bg-white border-gray-200"
                    : "bg-blue-50 border-blue-200"
                }`}
              >
                {/* Instagram-like dot */}
                <div className={`mt-2 w-3 h-3 rounded-full ${
                  notification.isRead ? "bg-gray-300" : "bg-blue-600"
                }`} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p
                        className={`font-medium leading-snug truncate ${
                          notification.isRead ? "text-gray-900" : "text-blue-950"
                        }`}
                      >
                        {getMessage(notification)}
                      </p>

                      {notification.comment && (
                        <p className="text-sm text-gray-700 mt-1">
                          “{notification.comment}”
                        </p>
                      )}

                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      {notification.post?._id && (
                        <Link
                          className="text-sm text-blue-700 hover:underline"
                          to={`/post/${notification.post._id}`}
                        >
                          Open
                        </Link>
                      )}

                      {!notification.isRead ? (
                        <button
                          className="text-sm text-blue-700 hover:underline font-medium"
                          onClick={() => markRead(notification._id)}
                        >
                          Mark read
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
