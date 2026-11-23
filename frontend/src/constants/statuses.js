// How each application status is shown.
//   label: text for the customer, tone: badge colour, stage: which step of the tracker it belongs to.
// Release 1 covers UC01-UC02 and ends at APPROVED_IN_PRINCIPLE. The UC03/UC04 statuses below are kept so
// applications created by the full version (branch us-1, same database) still display.
export const STATUS = {
  IN_PROGRESS: { label: "Application in progress", tone: "info", stage: 1 },
  ID_REUPLOAD_REQUIRED: { label: "New ID document needed", tone: "warn", stage: 1 },
  INFO_REQUIRED: { label: "More information needed", tone: "warn", stage: 1 },
  REJECTED: { label: "Not accepted", tone: "bad", stage: 1 },
  EXPIRED: { label: "Expired", tone: "bad", stage: 1 },
  SUBMITTED: { label: "Submitted", tone: "info", stage: 2 },
  ASSESSING: { label: "Being assessed", tone: "info", stage: 2 },
  DECLINING: { label: "Being assessed", tone: "info", stage: 2 },
  REFERRED: { label: "Under review", tone: "warn", stage: 2 },
  FRAUD_INVESTIGATION: { label: "Under review", tone: "warn", stage: 2 },
  DECLINED: { label: "Declined", tone: "bad", stage: 2 },
  APPROVED_IN_PRINCIPLE: { label: "Approved in principle", tone: "good", stage: 3 },
  PENDING_APPROVAL: { label: "Awaiting final approval", tone: "info", stage: 3 },
  PENDING_SENIOR_APPROVAL: { label: "Awaiting final approval", tone: "info", stage: 3 },
  OFFER_GENERATED: { label: "Preparing your offer", tone: "info", stage: 3 },
  ESIGN_UNAVAILABLE: { label: "Preparing your agreement", tone: "warn", stage: 3 },
  AGREEMENT_SENT: { label: "Ready to sign", tone: "action", stage: 3 },
  OFFER_EXPIRED: { label: "Offer expired", tone: "bad", stage: 3 },
  SIGNED: { label: "Signed", tone: "good", stage: 3 },
  DISBURSING: { label: "Paying out", tone: "info", stage: 3 },
  DISBURSEMENT_FAILED: { label: "Payout delayed", tone: "warn", stage: 3 },
  ACTIVE: { label: "Active loan", tone: "good", stage: 4 },
  BANK_DETAILS_REQUIRED: { label: "Update bank details", tone: "action", stage: 4 },
  IN_ARREARS: { label: "Payment overdue", tone: "warn", stage: 4 },
  COLLECTIONS: { label: "In collections", tone: "bad", stage: 4 },
  DEFAULTED: { label: "Defaulted", tone: "bad", stage: 4 },
  CLOSED: { label: "Repaid & closed", tone: "good", stage: 4 },
};

// Statuses after which nothing happens any more (in release 1 an approved application ends approved in principle)
export const FINAL_STATUSES = ["APPROVED_IN_PRINCIPLE", "REJECTED", "EXPIRED", "DECLINED", "OFFER_EXPIRED", "DEFAULTED", "CLOSED"];

// Successful end states: the tracker shows every step as done
export const SUCCESS_STATUSES = ["APPROVED_IN_PRINCIPLE", "CLOSED"];

// The steps as the customer sees them in release 1
export const STAGES = [
  { stage: 1, title: "Apply", detail: "Your details & documents" },
  { stage: 2, title: "Assessment", detail: "Credit & affordability check" },
  { stage: 3, title: "Approved in principle", detail: "Final approval comes next" },
];

export const statusInfo = (status) => STATUS[status] || { label: status, tone: "info", stage: 1 };

export const money = (value) =>
  value === null || value === undefined
    ? "-"
    : // whole amounts without cents (AUD 3,000), others always with two decimals (AUD 1,599.30)
      "AUD " + Number(value).toLocaleString("en-AU", {
        minimumFractionDigits: Number.isInteger(Number(value)) ? 0 : 2,
        maximumFractionDigits: 2,
      });
