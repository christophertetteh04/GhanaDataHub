import { useState, useEffect } from "react";
import { notifApi } from "../services/api";
import toast from "react-hot-toast";
import { Bell, CheckCheck, Circle } from "lucide-react";

const TYPE_COLORS = {
  upload: "badge-green",
  invite: "badge-blue",
  share: "badge-gold",
  default: "badge-gray",
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    notifApi.list().then(r => setNotifications(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const markRead = async (id) => {
    await notifApi.markRead(id);
    setNotifications(ns => ns.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAll = async () => {
    await notifApi.markAllRead();
    setNotifications(ns => ns.map(n => ({ ...n, is_read: true })));
    toast.success("All marked as read");
  };

  const unread = notifications.filter(n => !n.is_read).length;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Notifications</div>
          <div className="page-subtitle">{unread} unread</div>
        </div>
        {unread > 0 && (
          <button className="btn btn-secondary" onClick={markAll}>
            <CheckCheck size={14} /> Mark all as read
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
          <span className="spinner" style={{ width: 28, height: 28 }} />
        </div>
      ) : notifications.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><Bell size={24} /></div>
          <div style={{ fontWeight: 600 }}>No notifications</div>
          <div style={{ fontSize: 13 }}>You're all caught up!</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {notifications.map(n => (
            <div
              key={n.id}
              className="card"
              style={{
                display: "flex", gap: 14, alignItems: "flex-start",
                background: n.is_read ? "var(--surface-card)" : "var(--green-pale)",
                borderLeft: n.is_read ? "3px solid transparent" : "3px solid var(--green)",
                cursor: n.is_read ? "default" : "pointer",
              }}
              onClick={() => !n.is_read && markRead(n.id)}
            >
              <div style={{ paddingTop: 2 }}>
                {n.is_read
                  ? <Circle size={14} color="var(--gray-300)" />
                  : <Circle size={14} color="var(--green)" fill="var(--green)" />
                }
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{n.title}</div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span className={`badge ${TYPE_COLORS[n.notification_type] || TYPE_COLORS.default}`}>
                      {n.notification_type || "system"}
                    </span>
                    <span style={{ fontSize: 11, color: "var(--gray-400)", whiteSpace: "nowrap" }}>
                      {new Date(n.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div style={{ fontSize: 13, color: "var(--gray-600)", marginTop: 4, lineHeight: 1.5 }}>
                  {n.message}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
