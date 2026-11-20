import React from "react";
import { money } from "../../constants/statuses";

/** UC04: balance and next repayment of an active loan. */
function LoanSummary({ loan, repayments }) {
  const next = repayments.find((r) => r.status !== "PAID");
  const paid = repayments.filter((r) => r.status === "PAID").length;
  return (
    <div className="card">
      <h3 className="cardTitle">Your loan</h3>
      <div className="offerGrid">
        <div><span>Outstanding balance</span><strong>{money(loan.outstandingBalance)}</strong></div>
        <div><span>Monthly repayment</span><strong>{money(loan.monthlyRepayment)}</strong></div>
        <div><span>Next due date</span><strong>{next ? next.dueDate : "-"}</strong></div>
        <div><span>Instalments paid</span><strong>{paid} of {repayments.length}</strong></div>
        <div><span>Loan account</span><strong className="mono">{loan.accountNumber}</strong></div>
        <div><span>Loan status</span><strong>{loan.status}</strong></div>
      </div>
    </div>
  );
}

export default LoanSummary;
