import React, { useState } from "react";

/** UC04 customer requests: dispute a repayment, or ask for a different repayment date. */
function LoanRequests({ onDispute, onDateChange }) {
  const [reason, setReason] = useState("");
  const [day, setDay] = useState("15");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState("");

  const run = (action, message) => (e) => {
    e.preventDefault();
    setBusy(true);
    action()
      .then(() => setDone(message))
      .finally(() => setBusy(false));
  };

  return (
    <div className="card">
      <h3 className="cardTitle">Need help with a repayment?</h3>
      {done && <div className="successBox">{done}</div>}
      <form className="requestRow" onSubmit={run(() => onDispute(reason), "Your dispute was sent to our team.")}>
        <div className="field">
          <label>Dispute a repayment</label>
          <input placeholder="e.g. I was charged twice" value={reason} onChange={(e) => setReason(e.target.value)} required />
        </div>
        <button className="btnSecondary" disabled={busy}>Send dispute</button>
      </form>
      <form className="requestRow" onSubmit={run(() => onDateChange(Number(day)), "Your request for a new repayment date was sent.")}>
        <div className="field">
          <label>Change my repayment date to day</label>
          <select value={day} onChange={(e) => setDay(e.target.value)}>
            {Array.from({ length: 28 }, (_, i) => String(i + 1)).map((d) => <option key={d}>{d}</option>)}
          </select>
        </div>
        <button className="btnSecondary" disabled={busy}>Request change</button>
      </form>
    </div>
  );
}

export default LoanRequests;
