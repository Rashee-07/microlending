import React from "react";
import { money } from "../../constants/statuses";
import StatusBadge from "../StatusBadge";
import ActivityList from "../ActivityList";

const Row = ({ label, children }) => (
  <div className="kv">
    <span>{label}</span>
    <strong>{children === null || children === undefined || children === "" ? "-" : children}</strong>
  </div>
);

const OUTCOME_TONE = { APPROVE: "good", REFER: "warn", DECLINE: "bad", FRAUD: "bad" };

/** Everything a staff member needs to decide: applicant, loan request, assessment, documents, loan, activity. */
function ApplicationContext({ detail }) {
  const { application: a, customer: c, assessment: s, documents, loanAccount: loan, disbursement, repayments } = detail;
  const failed = repayments.filter((r) => r.status === "FAILED" || r.status === "COLLECTIONS");

  return (
    <div className="context">
      <div className="contextHeader">
        <div>
          <h3>{c ? `${c.firstName || ""} ${c.lastName || ""}`.trim() || "New applicant" : "Applicant"}</h3>
          <span className="muted small">Application #{a.id} · {a.loanPurpose || "-"}</span>
        </div>
        <StatusBadge status={a.status} />
      </div>
      {a.statusReason && <p className="contextReason">{a.statusReason}</p>}

      <div className="contextGrid">
        <section>
          <h4>Applicant</h4>
          {c && (
            <>
              <Row label="Email">{c.email}</Row>
              <Row label="Mobile">{c.mobile}</Row>
              <Row label="Date of birth">{c.dateOfBirth}</Row>
              <Row label="Address">{[c.addressLine, c.suburb, c.state, c.postcode].filter(Boolean).join(", ")}</Row>
              <Row label="Employment">{[(c.employmentStatus || "").replace("_", "-").toLowerCase(), c.employerName].filter(Boolean).join(" · ")}</Row>
            </>
          )}
        </section>

        <section>
          <h4>Loan request</h4>
          <Row label="Amount">{money(a.loanAmount)}</Row>
          <Row label="Term">{a.termMonths ? a.termMonths + " months" : null}</Row>
          <Row label="Monthly income">{money(a.monthlyIncome)}</Row>
          <Row label="Monthly expenses">{money(a.monthlyExpenses)}</Row>
          <Row label="Other debt repayments">{money(a.monthlyLiabilities)}</Row>
          <Row label="Bank account">{a.bankAccountNumber}</Row>
        </section>

        {s && (
          <section>
            <h4>Credit assessment (UC02)</h4>
            <Row label="Decision">
              <span className={"pill " + (OUTCOME_TONE[s.outcome] || "info")}>{s.outcome}</span>
            </Row>
            <Row label="Reason">{s.reason}</Row>
            <Row label="Risk category">{s.riskCategory}</Row>
            <Row label="Credit score">{s.creditScore} {s.bureauDefaults ? `(${s.bureauDefaults} defaults)` : ""}</Row>
            <Row label="Fraud risk">{s.fraudRisk}</Row>
            <Row label="Verified income">{money(s.verifiedIncome)} {s.employmentVerified ? "✓ employer confirmed" : "✕ not confirmed"}</Row>
            <Row label="Recurring expenses">{money(s.recurringExpenses)}</Row>
            <Row label="Disposable income">{money(s.disposableIncome)}</Row>
            <Row label="New repayment">{money(s.monthlyRepayment)} / month</Row>
            <Row label="Debt-to-income">{Math.round(s.dti * 100)}%</Row>
            <Row label="Surplus after repayment">{money(s.surplus)}</Row>
          </section>
        )}

        <section>
          <h4>Documents</h4>
          {documents.length === 0 ? (
            <p className="emptyText small">None uploaded</p>
          ) : (
            documents.map((d) => (
              <Row key={d.id} label={DOC_LABEL[d.docType] || d.docType}>
                {d.docNumber ? d.docNumber + " · " : ""}
                {d.fileName} <span className={"pill " + docTone(d.verificationStatus)}>{d.verificationStatus}</span>
              </Row>
            ))
          )}
        </section>

        {loan && (
          <section>
            <h4>Loan account</h4>
            <Row label="Account">{loan.accountNumber}</Row>
            <Row label="Principal">{money(loan.principal)}</Row>
            <Row label="Repayment">{money(loan.monthlyRepayment)} × {loan.termMonths}</Row>
            <Row label="Outstanding">{money(loan.outstandingBalance)}</Row>
            <Row label="Agreement">{loan.agreementStatus}</Row>
            <Row label="Payout">{disbursement ? `${disbursement.status} (${disbursement.bankReference})` : "-"}</Row>
            {failed.length > 0 && (
              <Row label="Failed instalments">
                {failed.map((r) => `#${r.instalmentNo} (${r.attempts} attempts, ${r.lastFailureReason || r.status})`).join(", ")}
              </Row>
            )}
          </section>
        )}
      </div>

      <h4 className="activityTitle">Activity</h4>
      <ActivityList events={detail.events} />
    </div>
  );
}

const DOC_LABEL = { PASSPORT: "Passport", DRIVERS_LICENCE: "Driver licence", PAYSLIP: "Payslip", BANK_STATEMENT: "Bank statement" };
const docTone = (status) => ({ VERIFIED: "good", EXPIRED: "warn", FAILED: "bad" }[status] || "info");

export default ApplicationContext;
