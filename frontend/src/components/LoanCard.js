import React from "react";

// One loan task (Reviewer / Manager pages). The action buttons are passed in as children.
function LoanCard({ task, children }) {
  const initials = (task.firstname || "?").charAt(0) + (task.lastname || "").charAt(0);

  return (
    <div className="loanCard">
      <div className="loanCardHeader">
        <div className="avatar">{initials.toUpperCase()}</div>
        <div>
          <div className="loanName">
            {task.firstname} {task.lastname}
          </div>
          <div className="loanType">{task.loantype}</div>
        </div>
        <div className="loanAmount">{Number(task.loanamount).toLocaleString()}</div>
      </div>

      <div className="loanDetails">
        <span>Process ID</span>
        <span className="mono">{task.processID}</span>
        <span>Email</span>
        <span>{task.email}</span>
        <span>Phone</span>
        <span>{task.phonenumber}</span>
      </div>

      <div className="loanActions">{children}</div>
    </div>
  );
}

export default LoanCard;
