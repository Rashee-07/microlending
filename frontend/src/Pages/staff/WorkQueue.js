import React, { useEffect, useState, useCallback } from "react";
import { api, errorMessage } from "../../api/client";
import { currentUser } from "../../session";
import { GROUP_LABEL, STAFF_TASKS } from "../../constants/tasks";
import { money } from "../../constants/statuses";
import StatusBadge from "../../components/StatusBadge";
import { formatTime } from "../../components/NotificationList";
import ApplicationContext from "../../components/staff/ApplicationContext";
import DecisionPanel from "../../components/staff/DecisionPanel";

const POLL_MS = 3000;

/** Staff home (kiran / suresh): the open tasks of their queues, and an overview of all applications. */
function WorkQueue() {
  const user = currentUser();
  const [tab, setTab] = useState("queue");
  const [tasks, setTasks] = useState([]);
  const [applications, setApplications] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [done, setDone] = useState("");

  const load = useCallback(() => {
    api.tasks(user.username, user.role).then((list) => {
      // staff queues only - customer tasks are done by the customer
      const staffTasks = list.filter((t) => STAFF_TASKS[t.elementId]);
      setTasks(staffTasks);
      setSelectedTask((current) => current && staffTasks.find((t) => t.jobKey === current.jobKey) ? current : staffTasks[0] || null);
    }).catch(() => {});
    api.applications().then(setApplications).catch(() => {});
  }, [user.username, user.role]);

  useEffect(() => {
    load();
    const timer = setInterval(load, POLL_MS);
    return () => clearInterval(timer);
  }, [load]);

  // the application shown on the right: the selected task's, or the one clicked in "All applications"
  const appId = tab === "queue" ? selectedTask && selectedTask.applicationId : selectedAppId;
  useEffect(() => {
    if (!appId) {
      setDetail(null);
      return undefined;
    }
    const fetch = () => api.application(appId).then(setDetail).catch(() => {});
    fetch();
    const timer = setInterval(fetch, POLL_MS);
    return () => clearInterval(timer);
  }, [appId]);

  const decide = (data, label) =>
    api
      .completeTask(selectedTask.jobKey, user.username, data)
      .then(() => {
        setDone(`${selectedTask.name} for ${selectedTask.firstName || "application #" + selectedTask.applicationId}: ${label}`);
        setSelectedTask(null);
        load();
      })
      .catch((err) => Promise.reject(errorMessage(err)));

  const counts = tasks.reduce((acc, t) => ({ ...acc, [t.candidateGroup]: (acc[t.candidateGroup] || 0) + 1 }), {});

  return (
    <div>
      <div className="pageHeader withAction">
        <div>
          <h1>Work queue</h1>
          <p>Tasks waiting for {Object.keys(counts).length ? "you" : "your team"} - pick one, review the application and decide.</p>
        </div>
        <div className="queueCounts">
          {Object.entries(counts).map(([group, n]) => (
            <span key={group} className="pill info">{GROUP_LABEL[group] || group}: {n}</span>
          ))}
        </div>
      </div>

      <div className="tabs">
        <button className={tab === "queue" ? "active" : ""} onClick={() => setTab("queue")}>
          My queue ({tasks.length})
        </button>
        <button className={tab === "all" ? "active" : ""} onClick={() => setTab("all")}>
          All applications ({applications.length})
        </button>
      </div>

      {done && (
        <div className="successBox" onClick={() => setDone("")}>
          ✓ {done}
        </div>
      )}

      <div className="queueLayout">
        <div className="queueList">
          {tab === "queue" ? (
            tasks.length === 0 ? (
              <div className="emptyState">🎉 No tasks waiting</div>
            ) : (
              tasks.map((t) => (
                <button key={t.jobKey}
                  className={"taskItem" + (selectedTask && selectedTask.jobKey === t.jobKey ? " selected" : "")}
                  onClick={() => setSelectedTask(t)}>
                  <div className="taskItemTop">
                    <span className="ucTag">{STAFF_TASKS[t.elementId].useCase}</span>
                    <span className="taskName">{t.name}</span>
                  </div>
                  <div className="taskItemBottom">
                    <span>{`${t.firstName || ""} ${t.lastName || ""}`.trim() || "#" + t.applicationId} · {money(t.loanAmount)}</span>
                    <span className="muted small">{GROUP_LABEL[t.candidateGroup]} · {formatTime(t.createdAt)}</span>
                  </div>
                </button>
              ))
            )
          ) : (
            applications.map((a) => (
              <button key={a.id} className={"taskItem" + (selectedAppId === a.id ? " selected" : "")}
                onClick={() => setSelectedAppId(a.id)}>
                <div className="taskItemTop">
                  <span className="taskName">#{a.id} {`${a.firstName || ""} ${a.lastName || ""}`.trim() || a.username}</span>
                  <StatusBadge status={a.status} />
                </div>
                <div className="taskItemBottom">
                  <span>{money(a.loanAmount)} · {a.loanPurpose || "-"}</span>
                  <span className="muted small">{formatTime(a.updatedAt)}</span>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="card queueDetail">
          {!detail ? (
            <p className="emptyText">{tab === "queue" ? "Select a task" : "Select an application"}</p>
          ) : (
            <>
              {tab === "queue" && selectedTask && (
                <DecisionPanel key={selectedTask.jobKey} task={selectedTask} onDecide={decide} />
              )}
              <ApplicationContext detail={detail} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default WorkQueue;
