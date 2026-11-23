// Staff tasks: what each Camunda user task means and which decisions it offers.
// "data" is sent as the task's process variables (see backend TaskService).

// Release 1 (UC01-UC02): only the credit officer and fraud team have tasks.
export const GROUP_LABEL = {
  "credit-officer": "Credit officer",
  "fraud-team": "Fraud team",
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
};
