import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api, errorMessage } from "../../api/client";
import { currentUser } from "../../session";
import { money } from "../../constants/statuses";
import StatusBadge from "../../components/StatusBadge";
import NotificationList, { formatTime } from "../../components/NotificationList";

// Statuses where the customer has something to do
const NEEDS_CUSTOMER = ["IN_PROGRESS", "ID_REUPLOAD_REQUIRED", "INFO_REQUIRED", "AGREEMENT_SENT", "BANK_DETAILS_REQUIRED"];

/** Customer home: their applications, start a new one (UC01 registration), latest messages. */
function MyLoans() {
  const user = currentUser();
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showApply, setShowApply] = useState(false);
  const [contact, setContact] = useState({ email: "", mobile: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    api.applications(user.username).then(setApplications).catch(() => {});
    api.notifications(user.username).then(setNotifications).catch(() => {});
  }, [user.username]);

  useEffect(() => {
    load();
    const timer = setInterval(load, 5000);
    return () => clearInterval(timer);
  }, [load]);

  // UC01 step 1: register with email + mobile -> starts the loan process
  const register = (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    api
      .register(user.username, contact.email, contact.mobile)
      .then((r) => navigate("/customer/applications/" + r.applicationId))
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setBusy(false));
  };

  const sampleContact = () => {
    const n = String(Date.now()).slice(-6);
    setContact({ email: `${user.username}.${n}@example.com`, mobile: "0412" + n });
  };

  return (
    <div>
      <div className="pageHeader withAction">
        <div>
          <h1>My loans</h1>
          <p>Apply for a loan and follow every step until it is repaid.</p>
        </div>
        {!showApply && (
          <button className="btnPrimary" onClick={() => setShowApply(true)}>
            + Apply for a loan
          </button>
        )}
      </div>

      {showApply && (
        <form className="card applyCard" onSubmit={register}>
          <h3 className="cardTitle">Start your application</h3>
          <p className="muted intro">Register with your email and mobile number. You can stop at any time and continue later.</p>
          <div className="samples">
            <span>Demo data:</span>
            <button type="button" className="chip" onClick={sampleContact}>New customer</button>
          </div>
          <div className="formGrid">
            <div className="field">
              <label>Email</label>
              <input type="email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} required />
            </div>
            <div className="field">
              <label>Mobile number</label>
              <input type="tel" value={contact.mobile} onChange={(e) => setContact({ ...contact, mobile: e.target.value })} required />
            </div>
          </div>
          {error && <div className="errorBox">{error}</div>}
          <div className="buttonRow">
            <button type="button" className="btnSecondary" onClick={() => setShowApply(false)}>Cancel</button>
            <button type="submit" className="btnPrimary" disabled={busy}>{busy ? "Starting..." : "Start application"}</button>
          </div>
        </form>
      )}

      <div className="twoColumns wideLeft">
        <div>
          <h3 className="sectionTitle">Applications ({applications.length})</h3>
          {applications.length === 0 ? (
            <div className="emptyState">No applications yet - click "Apply for a loan" to start.</div>
          ) : (
            <div className="appList">
              {applications.map((a) => {
                const action = NEEDS_CUSTOMER.includes(a.status);
                return (
                  <div key={a.id} className={"appRow" + (action ? " needsAction" : "")}
                    onClick={() => navigate("/customer/applications/" + a.id)}>
                    <div>
                      <div className="appTitle">{a.loanAmount ? money(a.loanAmount) : "New application"}</div>
                      <div className="muted small">
                        #{a.id} · {a.loanPurpose || "details not entered yet"} · started {formatTime(a.createdAt)}
                      </div>
                    </div>
                    <div className="appRight">
                      <StatusBadge status={a.status} />
                      <button className={action ? "btnPrimary small" : "btnSecondary small"}>
                        {action ? "Continue" : "View"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="card">
          <h3 className="cardTitle">Messages</h3>
          <NotificationList notifications={notifications} limit={6} />
        </div>
      </div>
    </div>
  );
}

export default MyLoans;
