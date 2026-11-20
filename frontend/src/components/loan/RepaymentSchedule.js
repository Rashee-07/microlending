import React from "react";
import { money } from "../../constants/statuses";

const LABEL = { SCHEDULED: "Scheduled", PAID: "Paid", FAILED: "Failed", COLLECTIONS: "In collections" };
const TONE = { SCHEDULED: "info", PAID: "good", FAILED: "warn", COLLECTIONS: "bad" };

/** UC04: the repayment schedule. */
function RepaymentSchedule({ repayments }) {
  return (
    <div className="card">
      <h3 className="cardTitle">Repayment schedule</h3>
      <div className="tableWrap">
        <table className="statusTable">
          <thead>
            <tr><th>#</th><th>Due date</th><th>Amount</th><th>Status</th><th>Attempts</th></tr>
          </thead>
          <tbody>
            {repayments.map((r) => (
              <tr key={r.id}>
                <td>{r.instalmentNo}</td>
                <td>{r.dueDate}</td>
                <td>{money(r.amount)}</td>
                <td>
                  <span className={"pill " + TONE[r.status]}>{LABEL[r.status] || r.status}</span>
                  {r.lastFailureReason && r.status !== "PAID" && (
                    <small className="muted"> {r.lastFailureReason.replace(/_/g, " ").toLowerCase()}</small>
                  )}
                </td>
                <td>{r.attempts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default RepaymentSchedule;
