import React, { useState } from "react";
import { money } from "../../constants/statuses";

/** UC03: the loan offer, ready to sign. Signing sends the "agreement-signed" message to the process. */
function SignAgreementCard({ loan, onSign }) {
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);

  const sign = () => {
    setBusy(true);
    onSign().finally(() => setBusy(false));
  };

  return (
    <div className="card highlight">
      <h3 className="cardTitle">Your loan offer is ready</h3>
      <div className="offerGrid">
        <div><span>Loan amount</span><strong>{money(loan.principal)}</strong></div>
        <div><span>Monthly repayment</span><strong>{money(loan.monthlyRepayment)}</strong></div>
        <div><span>Term</span><strong>{loan.termMonths} months</strong></div>
        <div><span>Interest rate</span><strong>{loan.interestRate}% p.a.</strong></div>
        <div><span>Total to repay</span><strong>{money(loan.monthlyRepayment * loan.termMonths)}</strong></div>
        <div><span>Loan account</span><strong className="mono">{loan.accountNumber}</strong></div>
      </div>
      <label className="checkRow">
        <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
        I have read the loan agreement and agree to its terms.
      </label>
      <button className="btnSuccess full" disabled={!agreed || busy} onClick={sign}>
        {busy ? "Signing..." : "✍ Sign agreement electronically"}
      </button>
      <p className="muted small">The offer is valid for a limited time. After signing, the money is paid into your bank account.</p>
    </div>
  );
}

export default SignAgreementCard;
