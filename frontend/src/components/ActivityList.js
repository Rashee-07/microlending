import React from "react";
import { formatTime } from "./NotificationList";

// Audit trail of the application (event_log): every check, decision and payment event, newest first.
function ActivityList({ events }) {
  if (events.length === 0) {
    return <p className="emptyText">No activity yet</p>;
  }
  return (
    <ul className="activityList">
      {[...events].reverse().map((e) => (
        <li key={e.id}>
          <span className="activityTime">{formatTime(e.createdAt)}</span>
          <span className="activityType">{e.eventType.replace(/_/g, " ").toLowerCase()}</span>
          <span className="activityText">{e.description}</span>
        </li>
      ))}
    </ul>
  );
}

export default ActivityList;
