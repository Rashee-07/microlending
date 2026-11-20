// Demo panel content: failure switches, one-click scenarios and the UC01 inputs (see backend docs/DEMO-TRIGGERS.md).

export const CUSTOMERS = ["priya", "rahul", "anita"];

export const SWITCHES = [
  { name: "esignDown", label: "E-signature service down", useCase: "UC03", effect: "3 attempts, then kiran arranges manual signing" },
  { name: "bankTransferFails", label: "Bank transfer fails", useCase: "UC03", effect: "payout fails, suresh resolves the transfer" },
  { name: "insufficientFunds", label: "Insufficient funds", useCase: "UC04", effect: "every direct debit bounces" },
];

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
        next: "goes straight on to the credit officer approval (kiran)", data: {} },
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
  {
    useCase: "uc03",
    title: "Approval, contract & disbursement",
    items: [
      { key: "uc03-standard", tone: "good", title: "Standard approval", what: "5,000, low risk - one approval.",
        next: "kiran approves, then {customer} signs", data: {} },
      { key: "uc03-senior", tone: "warn", title: "Senior approval", what: "12,000 - above the 10,000 limit, two approvals.",
        next: "kiran approves, then suresh", data: { loanAmount: 12000, loanPurpose: "Home renovation" } },
      { key: "uc03-esign", tone: "bad", title: "E-signature down", what: "Switches 'E-signature service down' on.",
        next: "kiran approves, then kiran: Arrange manual signing", switchOn: "esignDown", data: {} },
      { key: "uc03-transfer", tone: "bad", title: "Bank transfer fails", what: "Switches 'Bank transfer fails' on.",
        next: "kiran approves, {customer} signs, then suresh: Resolve failed transfer", switchOn: "bankTransferFails", data: {} },
    ],
  },
  {
    useCase: "uc04",
    title: "Repayments & delinquency",
    items: [
      { key: "uc04-paid", tone: "good", title: "Repayments paid", what: "Active loan; each instalment is collected after 30 s.",
        next: "watch {customer}'s schedule fill up", data: {} },
      { key: "uc04-funds", tone: "bad", title: "Insufficient funds", what: "Account ending 99: fails, retries after 1 min, fails again.",
        next: "suresh: Collections (after ~2 min)", data: { bankAccountNumber: "062000555599" } },
      { key: "uc04-account", tone: "warn", title: "Incorrect bank account", what: "Account ending 00 - the bank rejects it.",
        next: "{customer}: Update bank account details", data: { bankAccountNumber: "062000555500" } },
      { key: "uc04-requests", tone: "good", title: "Dispute / date change", what: "Active loan for the customer requests.",
        next: "{customer} raises a dispute or a new due date on the loan page", data: {} },
    ],
  },
];
