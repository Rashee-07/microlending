# MicroLending – Demo script (Wednesday 25 Nov 2026)

**Length:** about 35 minutes plus questions.
**Story:** one customer (priya) applies live on her phone and takes the loan all the way to repayment. Around her,
ready-made scenarios from the **Demo panel** show the exception paths of every use case.
**Logins:** one at a time, always **Log out** before the next one.

| Who | Login | Role in the story | Browser view |
|---|---|---|---|
| Priya | `priya` / `priya123` | Customer | **Phone** (F12 → Ctrl+Shift+M) |
| Kiran | `kiran` / `kiran123` | Credit officer + fraud team | Desktop (Ctrl+Shift+M off) |
| Suresh | `suresh` / `suresh123` | Senior approver + collections + operations | Desktop |
| Operate | `demo` / `demo` at http://localhost:8081 | Shows the process live | Second browser tab |

---

## 0. Before the demo (30 minutes before)

1. Close everything that is not needed: other dev servers (ports 3000 / 3001), unused browser tabs, IDEs. The laptop has run out of memory before.
2. **Docker** (folder `camunda-local`):
   ```
   docker compose up -d
   docker stop optimize connectors      # not needed, saves memory
   docker start tasklist                # only if it did not start (Elasticsearch shows "unhealthy" - that is normal)
   ```
   Wait until `docker ps` shows zeebe, operate, keycloak, identity, postgres, microlending-db running.
3. **Backend** (folder `backend/camunda-8-start-form`): `mvn -o spring-boot:run` → wait for `Started MicroLendingApplication`.
4. **Frontend** (folder `frontend`): `npm run build` (only if the code changed), then `npm run serve` → http://localhost:3077
5. Log in as anyone → **Demo panel** → **↺ Reset test data** → confirm. All switches must show off.
6. Open Operate in a second tab (demo / demo) → Processes → `microlending-loan`. Keep the BPMN diagram ready.
7. Log out. Browser on the login page, **phone view on**.

> Timers are shortened for the demo: reminder 2 min, offer valid 5 min, one repayment every 30 s,
> payment retry after 1 min. Priya's 24-month loan is repaid in about 12 minutes - the order of the
> sections below is chosen so her dispute and date change are handled while the loan is still running.

---

## 1. Introduction – 3 min (Operate)

Show the `microlending-loan` diagram in Operate.

- "One process for the whole loan life cycle. Each blue box is one use case: **UC01** application & onboarding,
  **UC02** credit assessment, **UC03** approval, contract & payout, **UC04** repayments."
- "After every stage a gateway checks: can the application continue? If not it is closed in one place and the customer is told why."
- "Green / red / orange paths: happy path, rejections, exceptions. Every external system - identity check, credit bureau,
  bank, e-signature - is simulated; the data we enter decides the outcome."
- "The credit decision itself is a **DMN decision table** - business rules, not code."

---

## 2. UC01 – Priya applies on her phone – 6 min (priya, phone view)

| Step | Click | Say / show |
|---|---|---|
| 1 | Log in as **priya** | "The customer channel is a mobile-first web app; the same APIs would serve a native app." |
| 2 | **+ Apply for a loan** → email + mobile → **Start application** | The process starts. Optional: show the new instance in Operate waiting at *Capture details*. |
| 3 | *Your details* → sample **Standard** → **Continue** | Personal, address and employment details. |
| 4 | *Identity document* → sample **Expired document** → **Verify my identity** | **Exception:** status *New ID document needed*, a message explains why. |
| 5 | *Upload a valid identity document* → **Valid passport** → **Verify my identity** | Identity verified, duplicate check passed (both automatic). |
| 6 | *Your loan and finances* → **Payslip missing** → **Submit application** | **Exception:** *More information needed* - validation found the missing income document. |
| 7 | *Upload your income document* → **Payslip** → **Upload** | Application complete. **UC02 runs automatically**: within seconds the status turns *Awaiting final approval*. |

Point at the progress tracker (Apply ✓ Assessment ✓ Approval & payout) and the messages list.

> Mention, don't wait: "If the customer stops halfway she gets a *Finish your loan application* reminder after
> 2 minutes and the application expires after 30 minutes." (Leave a second application open if you want to show it later.)

### Load the queues (still as priya) – 1 min

Open **Demo panel**. Set **Customer = anita** (keeps priya's list clean) and click **▶ Start** on:

1. UC02 **Refer - income mismatch**
2. UC02 **Fraud alert**
3. UC03 **Senior approval**
4. UC04 **Insufficient funds** ← starts a 2-minute clock, needed later for collections

Then set **Customer = priya** and start:

5. UC04 **Incorrect bank account** (priya will fix it herself later)

"In a real bank these would be other customers arriving during the day." → **Log out**.

---

## 3. UC02 + UC03 – Kiran's work queue – 7 min (kiran, desktop)

Turn phone view **off**. Log in as **kiran**. The queue shows 4 tasks with use-case tags and the queue (credit officer / fraud team).

| Step | Task | Click | Say / show |
|---|---|---|---|
| 1 | **Manual credit assessment** (anita, Refer) | Look at *Credit assessment (UC02)*: decision REFER, verified income vs stated, employer not confirmed → **Approve** | "The DMN referred it because the employer confirmed only 60% of the income. The officer decides. Approved referrals are treated as high risk." |
| 2 | **Fraud investigation** | Comment *"Identity could not be confirmed with bureau records"* → **Confirm fraud** | Application declined. The comment is part of the customer's message, so keep it neutral. |
| 3 | **Credit officer approval** - **priya** (her live loan) | Show the assessment: APPROVE, LOW risk, surplus, debt-to-income → **Approve loan** | "Approval-level DMN: under AUD 10,000 and low risk → one approval is enough." **The 5-minute signing clock starts now.** |
| 4 | **Credit officer approval** - anita 12,000 | **Approve loan** | "Above 10,000 → the approval-level DMN routes it to a senior approver." (moves to suresh) |

Optional: the referred application from step 1 comes back as a new *Credit officer approval* (HIGH risk → will also need senior approval). Leave it.

**Log out promptly - priya must sign within 5 minutes.**

---

## 4. UC03 + UC04 – Priya signs and repays – 5 min (priya, phone view)

Phone view **on**. Log in as **priya**. My loans shows two applications: her live one (*Ready to sign*) and the
*Update bank details* one from the Demo panel.

| Step | Click | Say / show |
|---|---|---|
| 1 | Open the live loan → *Your loan offer is ready* → tick the agreement → **✍ Sign agreement electronically** | E-signature confirmed, the bank pays out (about 3 s), status *Active loan*. Tracker moves to **Repayments**. |
| 2 | Scroll to *Repayment schedule* | 24 instalments. "Every 30 seconds one falls due: reminder, direct debit, payment received." Watch the first one turn *Paid* and the outstanding balance drop. |
| 3 | *Need help with a repayment?* → dispute: *"I was charged twice for instalment 1"* → **Send dispute** | Goes to the operations queue (suresh). |
| 4 | Change repayment date to day **15** → **Request change** | Goes to the credit officer (kiran). |
| 5 | ← My loans → open the **Update bank details** application → sample **Correct account** → **Update and retry payment** | **UC04 exception:** the bank rejected the account (ending 00). Fixed by the customer, the payment is retried and succeeds. |

**Log out.**

---

## 5. Kiran – date change + e-signature outage – 4 min (kiran, desktop)

Phone view **off**. Log in as **kiran**.

| Step | Click | Say / show |
|---|---|---|
| 1 | **Review repayment date change** (priya) → **Approve new date** | The remaining instalments move to the 15th. "Requests from the customer run beside the repayments - an event sub-process." |
| 2 | **Demo panel** → Customer **anita** → UC03 **E-signature down** → back to **Work queue** | The switch *E-signature service down* is now on. |
| 3 | New **Credit officer approval** (anita) → **Approve loan** | The e-signature service fails 3 times (retries 5 s apart), then a technical error routes the work to a person. |
| 4 | **Arrange manual signing** appears (≈10-15 s) → **Agreement sent to customer** | "The process keeps going even when a system is down." |
| 5 | **Demo panel** → switch **E-signature service down off** | Always switch failures off again. |
| 6 | Demo panel → **Duplicate payout** → pick priya's loan → **Try** | *DUPLICATE_BLOCKED*: "the customer can never be paid twice." |

**Log out.**

---

## 6. Suresh – senior approval, collections, dispute – 5 min (suresh, desktop)

Log in as **suresh**. Queue: senior approval, collections follow-up, payment dispute.

| Step | Task | Click | Say / show |
|---|---|---|---|
| 1 | **Investigate payment dispute** (priya) | Comment *"Duplicate debit confirmed, refund issued"* → **Dispute upheld** | Do this first - priya's loan is close to being repaid. |
| 2 | **Senior credit approval** (anita, 12,000) | **Approve loan** | Two-level approval complete; the agreement is sent to the customer. |
| 3 | **Collections follow-up** (anita) | Show *Failed instalments*: 2 attempts, insufficient funds → **Payment recovered** | "The direct debit failed, the process retried after 1 minute, failed again and escalated to collections." |

---

## 7. Wrap-up in Operate – 3 min

1. Operate → **Processes** → `microlending-loan` → open **priya's** instance (search by the application number or variable `applicationId`).
2. Show the path she took through all four boxes, the exception loops (expired ID, missing payslip), and the
   variables (`creditDecision`, `approvalLevel`, `closeReason` empty = continue).
3. **Decisions** tab → `credit-decision` → her evaluation: which rule matched (rule 6 - APPROVE, LOW risk).
4. About 12 minutes after signing, priya's loan shows **Repaid & closed** (Operate: the instance is completed) -
   "a two-year loan, compressed into 12 minutes."

Summary: "Four use cases in one process; business rules in DMN; people only work on exceptions; every decision is audited."

---

## Optional extras (if there is time or a question)

| Scenario | How |
|---|---|
| UC02 hardship decline | Demo panel → UC02 **Decline - hardship** → customer sees *Declined* with the reason |
| UC02 low credit score | Demo panel → UC02 **Refer - low credit score** → kiran manual assessment |
| UC01 identity failure | Apply → identity sample **Fails verification** → *Not accepted* |
| UC01 duplicate | Apply again with the **same email + mobile** as an active application → rejected after identity check |
| UC03 offer not signed | Approve and wait 5 min → *Offer expired* |
| UC03 bank transfer fails | Demo panel → UC03 **Bank transfer fails** → kiran approves → customer signs → suresh **Retry transfer** after switching *Bank transfer fails* off |
| UC04 default | Collections follow-up → **Unable to recover - default** (comment required) |
| UC01 reminder | Leave an application after *Your details* → 2 min later *Finish your loan application* message |

Same scenarios via API: Postman collection `backend/camunda-8-start-form/docs/postman/` (68 requests).
All triggers: `backend/camunda-8-start-form/docs/DEMO-TRIGGERS.md`.

---

## If something goes wrong

| Problem | Fix |
|---|---|
| A task does not appear | Wait 5-10 s (screens refresh every 2-3 s; automatic steps take a few seconds). Check the instance in Operate - where is the token? |
| Priya missed the 5-minute signing window | Show it as the *Offer expired* exception, then Demo panel → UC03 **Standard approval** (customer priya) and continue. |
| Collections task not there yet | It needs ~2 minutes after the Insufficient funds scenario started; do the other tasks first. |
| Priya's loan closed before the dispute was handled | Not a problem: the dispute task stays open and can still be completed. |
| A failure switch was left on | Demo panel → switch it off (Reset also switches everything off). |
| Login fails for everyone | Keycloak not up: `docker ps`, `docker start keycloak`, wait 30 s. |
| Page shows "Cannot reach the server" | Backend stopped: restart `mvn -o spring-boot:run`. Data is kept; running processes continue. |
| Page at :3077 does not load | `npm run serve` in `frontend`. |
| Everything is messy | Demo panel → **Reset test data** and start that section again. |
