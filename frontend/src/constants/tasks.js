// Staff tasks: what each Camunda user task means and which decisions it offers.
// "data" is sent as the task's process variables (see backend TaskService).

export const GROUP_LABEL = {
  "credit-officer": "Credit officer",
  "fraud-team": "Fraud team",
  "senior-approver": "Senior approver",
  collections: "Collections",
  operations: "Operations",
};

export const STAFF_TASKS = {
  "manual-assessment": {
    useCase: "UC02",
    help: "The automated credit assessment referred this application (missing / inconsistent information or a weak credit history). Review the figures and decide.",
    decisions: [
      { label: "Approve", style: "btnSuccess", data: { officerDecision: "APPROVE" } },
      { label: "Decline", style: "btnDanger", data: { officerDecision: "DECLINE" }, needsComment: true },
    ],
  },
  "fraud-investigation": {
    useCase: "UC02",
    help: "The credit bureau returned a high-risk fraud indicator. Investigate the applicant before the application can continue.",
    decisions: [
      { label: "Cleared - not fraud", style: "btnSuccess", data: { fraudConfirmed: false } },
      { label: "Confirm fraud", style: "btnDanger", data: { fraudConfirmed: true }, needsComment: true },
    ],
  },
  "officer-approval": {
    useCase: "UC03",
    help: "Final approval by an authorised credit officer. Loans above AUD 10,000 or with a high risk category also need a senior approval.",
    decisions: [
      { label: "Approve loan", style: "btnSuccess", data: { officerApproval: "APPROVE" } },
      { label: "Reject", style: "btnDanger", data: { officerApproval: "REJECT" }, needsComment: true },
    ],
  },
  "senior-approval": {
    useCase: "UC03",
    help: "Additional approval required because of the loan amount or a high risk category.",
    decisions: [
      { label: "Approve loan", style: "btnSuccess", data: { seniorApproval: "APPROVE" } },
      { label: "Reject", style: "btnDanger", data: { seniorApproval: "REJECT" }, needsComment: true },
    ],
  },
  "manual-signing": {
    useCase: "UC03",
    help: "The e-signature service is unavailable. Send the agreement to the customer another way (email or branch), then confirm here. The customer can then sign.",
    decisions: [{ label: "Agreement sent to customer", style: "btnPrimary", data: {} }],
  },
  "resolve-transfer": {
    useCase: "UC03",
    help: "The bank rejected the payout. Fix the problem with the bank (demo: switch off 'bank transfer fails'), then retry the transfer.",
    decisions: [{ label: "Retry transfer", style: "btnPrimary", data: {} }],
  },
  collections: {
    useCase: "UC04",
    help: "The repayment is still outstanding after repeated failed direct debits. Contact the customer and record the outcome.",
    decisions: [
      { label: "Payment recovered", style: "btnSuccess", data: { collectionsOutcome: "PAID" } },
      { label: "Unable to recover - default", style: "btnDanger", data: { collectionsOutcome: "DEFAULTED" }, needsComment: true },
    ],
  },
  "investigate-dispute": {
    useCase: "UC04",
    help: "The customer disputes a repayment (the reason is in the activity below). Check the payment records and record the outcome.",
    decisions: [
      { label: "Dispute upheld", style: "btnSuccess", data: { disputeOutcome: "UPHELD" }, needsComment: true },
      { label: "Dispute rejected", style: "btnSecondary", data: { disputeOutcome: "REJECTED" }, needsComment: true },
    ],
  },
  "review-date-change": {
    useCase: "UC04",
    help: "The customer asked to move their repayment date (the requested day is in the activity below).",
    decisions: [
      { label: "Approve new date", style: "btnSuccess", data: { dateChangeApproved: true } },
      { label: "Decline", style: "btnDanger", data: { dateChangeApproved: false } },
    ],
  },
};
