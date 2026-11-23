# MicroLending demo, release 1 - how to trigger each scenario

**Release 1 scope:** UC01 application & onboarding and UC02 credit assessment. An approved application ends
**Approved in principle** and the customer is told. UC03 (approval, agreement, payout) and UC04 (repayments) are on
branch `us-1`, the full version. (`DEMO-TRIGGERS.md` in this folder describes that full version.)

All external systems are simulated (package `integration`, classes `*Client`). The data you enter decides the result.
One process `microlending-loan` covers the release: UC01 -> UC02 (one box per use case).
After UC01 and UC02 a gateway checks whether the application can continue; if not it is closed and the customer notified.
Timers are shortened for the demo (`application.properties`, `demo.timers.*`).

Logins: **priya / rahul / anita** = customer, **kiran** = credit officer + fraud team.
(suresh can still log in, but has no tasks in release 1.)

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

| Outcome | How to trigger | What happens next |
|---|---|---|
| Approve | Income 5,200 / expenses 2,400 / liabilities 300 / loan 5,000 (defaults of the demo quick-start) | **Approved in principle**, customer notified |
| Refer - inconsistent income | Employer name containing **`Unknown`** (employer only confirms 60% of the income) | kiran: Manual credit assessment → Approve = approved in principle, Decline = declined |
| Refer - low credit score | Last name **`Risky`** (bureau score 480) | kiran: Manual credit assessment |
| Decline - hardship | Expenses so high that nothing is left after the repayment (e.g. income 5,200, expenses **4,900**) | Declined, customer gets the reason |
| Fraud investigation | Last name **`Fraud`** | kiran (fraud team): Cleared = approved in principle, Confirm fraud = declined |

## Start UC02 directly

`POST /api/demo/quick-start` with `{"useCase": "uc02", "username": "priya", "data": {...overrides}}`
creates a complete sample application and starts the credit assessment directly (e.g. `"data": {"lastName": "Fraud"}`).

## Regression test

`node tools/smoke-test.js` runs every scenario above (except the long timers) against the running backend.

## Demo panel & reset

The UI has a **Demo panel** (sidebar, every login): one-click UC02 scenarios (same as quick-start), the UC01 inputs and
a **Reset test data** button.
`POST /api/demo/reset` cancels the Zeebe instances of all applications and empties the lending tables (user accounts stay).
Application ids keep counting up on purpose.

## Switching between release 1 (us-2) and the full version (us-1)

Both branches use the same database and the same Zeebe process id. After switching branch, restart the backend (it
deploys that branch's process as the newest version) and click **Reset test data**, so no running application is left
on the other branch's process.
