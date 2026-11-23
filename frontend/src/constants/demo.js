// Demo panel content for release 1 (UC01-UC02): one-click UC02 scenarios and the UC01 inputs
// (see backend docs/DEMO-TRIGGERS.md).

export const CUSTOMERS = ["priya", "rahul", "anita"];

export const TOOLS_LINKS = [
  { label: "Operate", url: "http://localhost:8081" },
  { label: "Tasklist", url: "http://localhost:8082" },
];

export const UC01_TRIGGERS = [
  { title: "Happy path", how: "Sample buttons on each form" },
  { title: "Identity check fails", how: "ID number ending 000" },
  { title: "Expired ID document", how: "Expiry date in the past" },
  { title: "Missing income document", how: "Submit financials without a payslip" },
  { title: "Duplicate application", how: "Same email, mobile or ID as an active application" },
  { title: "Abandon & resume", how: "Stop halfway: reminder after 2 min, expires after 30 min" },
];

// "next" tells the presenter who acts next ({customer} = the selected customer)
export const SCENARIOS = [
  {
    useCase: "uc02",
    title: "Automated credit assessment (DMN)",
    items: [
      { key: "uc02-approve", tone: "good", title: "Approve", what: "Affordable loan of 5,000 - approved in principle automatically.",
        next: "{customer} sees Approved in principle", data: {} },
      { key: "uc02-income", tone: "warn", title: "Refer - income mismatch", what: "Employer 'Unknown Pty Ltd' confirms only 60% of the income.",
        next: "kiran: Manual credit assessment", data: { employerName: "Unknown Pty Ltd" } },
      { key: "uc02-score", tone: "warn", title: "Refer - low credit score", what: "Bureau score 480.",
        next: "kiran: Manual credit assessment", data: { lastName: "Risky" } },
      { key: "uc02-decline", tone: "bad", title: "Decline - hardship", what: "Expenses 4,900 of 5,200 income - nothing left for the repayment.",
        next: "{customer} sees the decline", data: { monthlyExpenses: 4900 } },
      { key: "uc02-fraud", tone: "bad", title: "Fraud alert", what: "High fraud risk from the bureau.",
        next: "kiran (fraud team): Fraud investigation", data: { lastName: "Fraud" } },
    ],
  },
];
