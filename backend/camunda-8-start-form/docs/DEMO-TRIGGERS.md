# MicroLending demo - how to trigger each scenario

All external systems are simulated (package `integration`, classes `*Client`). The data you enter decides the result.
One process `microlending-loan` covers the whole loan: UC01 -> UC02 -> UC03 -> UC04 (one box per use case).
After UC01-UC03 a gateway checks whether the application can continue; if not it is closed and the customer notified.
Timers are shortened for the demo (`application.properties`, `demo.timers.*`).

Logins: **priya / rahul / anita** = customer, **kiran** = credit officer + fraud team, **suresh** = senior approver + collections + operations.

## UC01 - Application & onboarding

| Scenario | How to trigger |
|---|---|
| Happy path | Valid ID (number ≥ 6 chars, not ending `000`, expiry in the future) + payslip uploaded |
| Abandon & resume | Stop after any step. After **2 min** a "Finish your loan application" reminder appears; log in again and continue. After **30 min** the application expires |
| Identity verification failure | ID number ending **`000`** → application rejected |
| Invalid / expired ID document | Expiry date in the past (or ID number shorter than 6 characters) → customer is asked to upload a valid document |
| Missing income documents | Submit the financial step without a payslip / bank statement → "More information needed", upload task appears |
| Duplicate application | Register again with the **same email, mobile or ID number** as an application that is still active → rejected |

## UC02 - Credit assessment (DMN `credit-decision.dmn`)

| Outcome | How to trigger |
|---|---|
| Approve | Income 5,200 / expenses 2,400 / liabilities 300 / loan 5,000 (defaults of the demo quick-start) |
| Refer - inconsistent income | Employer name containing **`Unknown`** (employer only confirms 60% of the income) |
| Refer - low credit score | Last name **`Risky`** (bureau score 480) |
| Decline - hardship | Expenses so high that nothing is left after the repayment (e.g. income 5,200, expenses **4,900**) |
| Fraud investigation | Last name **`Fraud`** |

## UC03 - Approval, contract & disbursement

| Scenario | How to trigger |
|---|---|
| Senior approval needed | Loan > 10,000, or risk category HIGH (any referred / fraud-cleared application) |
| Credit officer rejects | kiran chooses Reject |
| E-signature service unavailable | Demo switch **`esignDown`** on → 3 attempts, then "Arrange manual signing" task for kiran |
| Customer does not sign in time | Don't click Sign for **5 min** → offer withdrawn |
| Bank transfer fails | Demo switch **`bankTransferFails`** on → "Resolve failed bank transfer" task for suresh (switch off, then retry) |
| Duplicate disbursement | After payout: `POST /api/demo/applications/{id}/duplicate-disbursement` → `DUPLICATE_BLOCKED` |

## UC04 - Repayments

| Scenario | How to trigger |
|---|---|
| Successful payment | Wait **30 s** for the due-date timer |
| Insufficient funds → retry → collections | Bank account ending **`99`** (or switch **`insufficientFunds`**): fails, retries after **1 min**, fails again → collections task for suresh |
| Incorrect bank account details | Bank account ending **`00`** → customer gets "Update bank account details" task, payment retried |
| Customer disputes a repayment | `POST /api/applications/{id}/dispute` → "Investigate payment dispute" task for suresh |
| Revised repayment date | `POST /api/applications/{id}/date-change` `{"newDueDay": 15}` → kiran approves → schedule moved |

## Start any use case directly

`POST /api/demo/quick-start` with `{"useCase": "uc02" | "uc03" | "uc04", "username": "priya", "data": {...overrides}}`
creates a complete sample application and starts the loan process directly at that use case (e.g. `"data": {"lastName": "Fraud"}`).

## Regression test

`node tools/smoke-test.js` runs every scenario above (except the long timers) against the running backend.

## Demo panel & reset

The UI has a **Demo panel** (sidebar, every login): failure switches, one-click scenarios per use case (same as quick-start),
duplicate-payout test and a **Reset test data** button.
`POST /api/demo/reset` cancels the Zeebe instances of all applications, empties the lending tables (user accounts stay)
and switches every failure off. Application ids keep counting up on purpose, so a late bank callback for an old id can never hit a new application.
