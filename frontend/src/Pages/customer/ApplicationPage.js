import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { api, errorMessage } from "../../api/client";
import { currentUser } from "../../session";
import { FINAL_STATUSES, money } from "../../constants/statuses";
import StatusBadge from "../../components/StatusBadge";
import ProgressTracker from "../../components/ProgressTracker";
import NotificationList from "../../components/NotificationList";
import ActivityList from "../../components/ActivityList";
import PersonalDetailsForm from "../../components/forms/PersonalDetailsForm";
import IdentityDocumentForm from "../../components/forms/IdentityDocumentForm";
import FinancialsForm from "../../components/forms/FinancialsForm";
import IncomeDocumentForm from "../../components/forms/IncomeDocumentForm";

const POLL_MS = 2000;

// What the customer sees while the process (not the customer) is working
const WAITING_TEXT = {
  IN_PROGRESS: "Checking your details...",
  ID_REUPLOAD_REQUIRED: "Checking your details...",
  INFO_REQUIRED: "Checking your details...",
  SUBMITTED: "Your application has been submitted for assessment.",
  ASSESSING: "We are checking your credit history and affordability. This takes a few seconds.",
  DECLINING: "We are checking your credit history and affordability.",
  REFERRED: "A credit officer is reviewing your application. We will let you know the outcome.",
  FRAUD_INVESTIGATION: "Our team is reviewing your application. We will let you know the outcome.",
};

const FINAL_TEXT = {
  APPROVED_IN_PRINCIPLE: "Good news - your loan is approved in principle!",
  REJECTED: "We could not accept your application.",
  EXPIRED: "Your application expired because it was not completed in time.",
  DECLINED: "Unfortunately we cannot offer you this loan.",
};

// Remove empty fields so the backend does not receive "" for dates or numbers
const clean = (data) => Object.fromEntries(Object.entries(data).filter(([, v]) => v !== "" && v !== null && v !== undefined));

/** One application: progress across UC01-UC02 and whatever the customer has to do next. */
function ApplicationPage() {
  const { id } = useParams();
  const user = currentUser();
  const [detail, setDetail] = useState(null);
  const [busy, setBusy] = useState(false);
  const [sentJobKey, setSentJobKey] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    api.application(id).then(setDetail).catch((err) => setError(errorMessage(err)));
  }, [id]);

  useEffect(() => {
    load();
    const timer = setInterval(load, POLL_MS);
    return () => clearInterval(timer);
  }, [load]);

  if (!detail) {
    return <p className="emptyText">{error || "Loading..."}</p>;
  }

  const app = detail.application;
  // the open task assigned to this customer (ignore the one just submitted until the process moves on)
  const task = detail.openTasks.find((t) => t.assignee === user.username && t.jobKey !== sentJobKey);

  const submitTask = (data) => {
    setBusy(true);
    setError("");
    return api
      .completeTask(task.jobKey, user.username, clean(data))
      .then(() => {
        setSentJobKey(task.jobKey);
        load();
      })
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setBusy(false));
  };

  return (
    <div>
      <Link to="/customer" className="backLink">← My loans</Link>
      <div className="pageHeader withAction">
        <div>
          <h1>{app.loanAmount ? money(app.loanAmount) + " loan" : "New loan application"}</h1>
          <p>
            Application #{app.id}
            {app.loanPurpose ? " · " + app.loanPurpose : ""}
          </p>
        </div>
        <StatusBadge status={app.status} />
      </div>

      <ProgressTracker status={app.status} />

      {error && <div className="errorBox">{error}</div>}

      <div className="twoColumns wideLeft">
        <div className="stack">
          {renderAction()}
        </div>
        <div className="stack">
          <div className="card">
            <h3 className="cardTitle">Messages</h3>
            <NotificationList notifications={detail.notifications} limit={5} />
          </div>
          <div className="card">
            <h3 className="cardTitle">Activity</h3>
            <ActivityList events={detail.events} />
          </div>
        </div>
      </div>
    </div>
  );

  /** The main card: the open customer task, a waiting message or the final result. */
  function renderAction() {
    if (task) {
      switch (task.elementId) {
        case "capture-details":
          return <PersonalDetailsForm onSubmit={submitTask} busy={busy} />;
        case "upload-identity":
          return <IdentityDocumentForm onSubmit={submitTask} busy={busy} reupload={app.status === "ID_REUPLOAD_REQUIRED"} />;
        case "capture-financials":
          return <FinancialsForm onSubmit={submitTask} busy={busy} />;
        case "upload-income-docs":
          return <IncomeDocumentForm onSubmit={submitTask} busy={busy} missing={app.statusReason} />;
        default:
          return null;
      }
    }
    if (FINAL_STATUSES.includes(app.status)) {
      const good = app.status === "APPROVED_IN_PRINCIPLE";
      return (
        <div className={"card resultCard " + (good ? "good" : "bad")}>
          <div className="resultIcon">{good ? "✓" : "!"}</div>
          <h3>{FINAL_TEXT[app.status]}</h3>
          {app.statusReason && !good && <p>Reason: {app.statusReason}</p>}
          {good && <p>We will contact you about the final approval and the loan agreement.</p>}
        </div>
      );
    }
    if (WAITING_TEXT[app.status]) {
      return (
        <div className="card waitingCard">
          <div className="spinner" />
          <p>{WAITING_TEXT[app.status]}</p>
        </div>
      );
    }
    return null;
  }
}

export default ApplicationPage;
