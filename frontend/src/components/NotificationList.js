import React from "react";

// In-app messages to the customer (they stand in for email / SMS in the demo).
function NotificationList({ notifications, limit }) {
  const items = limit ? notifications.slice(0, limit) : notifications;
  if (items.length === 0) {
    return <p className="emptyText">No messages yet</p>;
  }
  return (
    <ul className="messageList">
      {items.map((n) => (
        <li key={n.id}>
          <div className="messageTitle">{n.title}</div>
          <div className="messageText">{n.message}</div>
          <div className="messageTime">{formatTime(n.createdAt)}</div>
        </li>
      ))}
    </ul>
  );
}

export function formatTime(value) {
  if (!value) return "";
  // timestamps come without a zone and are in the server's local time (same as the browser in the demo)
  const date = new Date(value);
  return date.toLocaleString("en-AU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default NotificationList;
