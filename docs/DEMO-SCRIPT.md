# MicroLending – Demo script, release 1 (UC01 + UC02)

**Scope:** release 1 covers **UC01 application & onboarding** and **UC02 credit assessment**. An approved application
ends **Approved in principle**. UC03 (approval, agreement, payout) and UC04 (repayments) are on branch `us-1`, the
full version.
**Length:** about 20 minutes plus questions.
**Story:** priya applies live on her phone and gets approved in principle. Around her, ready-made scenarios from the
**Demo panel** show the UC02 exception paths, handled by kiran.
**Logins:** one at a time, always **Log out** before the next one.

| Who | Login | Role in the story | Browser view |
|---|---|---|---|
| Priya | `priya` / `priya123` | Customer | **Phone** (F12 → Ctrl+Shift+M) |
| Kiran | `kiran` / `kiran123` | Credit officer + fraud team | Desktop (Ctrl+Shift+M off) |
| Operate | `demo` / `demo` at http://localhost:8081 | Shows the process live | Second browser tab |

---

## 0. Before the demo (30 minutes before)

1. Close everything that is not needed: other dev servers, unused browser tabs, IDEs. The laptop has run out of memory before.
2. **Docker** (folder `camunda-local`):
   ```
   docker compose up -d
   docker stop optimize connectors      # not needed, saves memory
   docker start tasklist                # only if it did not start (Elasticsearch shows "unhealthy" - that is normal)
   ```
3. **Backend** (folder `backend/camunda-8-start-form`, branch `us-2`): `mvn -o spring-boot:run` → wait for `Started MicroLendingApplication`.
4. **Frontend** (folder `frontend`): `npm run build` (only if the code changed), then `npm run serve` → http://localhost:3077
5. Log in as anyone → **Demo panel** → **↺ Reset test data** → confirm.
6. Open Operate in a second tab (demo / demo) → Processes → `microlending-loan`. Keep the BPMN diagram ready.
7. Log out. Browser on the login page, **phone view on**.

> If the full version (branch `us-1`) was running before, restart the backend on `us-2` and reset the test data,
> so Zeebe uses the release 1 process.

---

## 1. Introduction – 2 min (Operate)

Show the `microlending-loan` diagram in Operate.

- "Release 1 covers the first two use cases: **UC01** application & onboarding and **UC02** credit assessment."
- "After each stage a gateway checks: can the application continue? If not it is closed in one place and the customer is told why."
- "Every external system - identity check, credit bureau, employer, bank statements - is simulated; the data we enter decides the outcome."
- "The credit decision is a **DMN decision table** - business rules, not code. An approved application ends approved in principle;
  final approval, payout and repayments come in the next release."

---

## 2. UC01 + UC02 – Priya applies on her phone – 6 min (priya, phone view)

| Step | Click | Say / show |
|---|---|---|
| 1 | Log in as **priya** | "The customer channel is a mobile-first web app; the same APIs would serve a native app." |
| 2 | **+ Apply for a loan** → email + mobile → **Start application** | The process starts. Optional: show the new instance in Operate waiting at *Capture details*. |
| 3 | *Your details* → sample **Standard** → **Continue** | Personal, address and employment details (State → Suburb → Postcode). |
| 4 | *Identity document* → sample **Expired document** → **Verify my identity** | **Exception:** status *New ID document needed*, a message explains why. |
| 5 | *Upload a valid identity document* → **Valid passport** → **Verify my identity** | Identity verified, duplicate check passed (both automatic). |
| 6 | *Your loan and finances* → **Payslip missing** → **Submit application** | **Exception:** *More information needed* - validation found the missing income document. |
| 7 | *Upload your income document* → **Payslip** → **Upload** | Application complete. **UC02 runs automatically**: within seconds the status turns **Approved in principle**. |

Point at the progress tracker (Apply ✓ Assessment ✓ Approved in principle ✓) and the message
*"Your loan is approved in principle"*.

> Mention, don't wait: "If the customer stops halfway she gets a *Finish your loan application* reminder after
> 2 minutes and the application expires after 30 minutes."

### Load kiran's queue (still as priya) – 1 min

Open **Demo panel**. Set **Customer = anita** and click **▶ Start** on:

1. UC02 **Refer - income mismatch**
2. UC02 **Refer - low credit score**
3. UC02 **Fraud alert**
4. UC02 **Decline - hardship** (no task - declined automatically, show it in the list)

"In a real bank these would be other customers arriving during the day." → **Log out**.

---

## 3. UC02 – Kiran's work queue – 6 min (kiran, desktop)

Turn phone view **off**. Log in as **kiran**. The queue shows 3 tasks with use-case tags and the queue (credit officer / fraud team).

| Step | Task | Click | Say / show |
|---|---|---|---|
| 1 | **Manual credit assessment** (income mismatch) | Look at *Credit assessment (UC02)*: decision REFER, verified income vs stated, employer not confirmed → **Decline** with comment | "The DMN referred it because the employer confirmed only 60% of the income. The officer decides." |
| 2 | **Manual credit assessment** (low score) | Score 480 → **Approve** | Application ends **Approved in principle**. |
| 3 | **Fraud investigation** | Comment *"Identity could not be confirmed with bureau records"* → **Confirm fraud** | Application declined. The comment is part of the customer's message, so keep it neutral. |

Open the **hardship** application from the list: declined automatically with the reason
*"Repayments would cause substantial financial hardship"*.

**Log out.**

---

## 4. Wrap-up in Operate – 3 min

1. Operate → **Processes** → `microlending-loan` → open **priya's** instance (search by the application number or variable `applicationId`).
2. Show the path she took through both boxes, the exception loops (expired ID, missing payslip), and the
   variables (`creditDecision`, `closeReason` empty = continue).
3. **Decisions** tab → `credit-decision` → her evaluation: which rule matched (rule 6 - APPROVE, LOW risk).

Summary: "Two use cases in one process; business rules in DMN; people only work on exceptions; every decision is audited.
Next release: final approval, agreement, payout and repayments."

---

## Optional extras (if there is time or a question)

| Scenario | How |
|---|---|
| UC02 fraud cleared | Demo panel → **Fraud alert** → kiran **Cleared - not fraud** → Approved in principle |
| UC01 identity failure | Apply → identity sample **Fails verification** → *Not accepted* |
| UC01 duplicate | Apply again with the **same email + mobile** as an active application → rejected after identity check |
| UC01 reminder | Leave an application after *Your details* → 2 min later *Finish your loan application* message |

Same scenarios via API: Postman collection `backend/camunda-8-start-form/docs/postman/`.
All triggers: `backend/camunda-8-start-form/docs/DEMO-TRIGGERS-RELEASE-1.md`.

---

## If something goes wrong

| Problem | Fix |
|---|---|
| A task does not appear | Wait 5-10 s (screens refresh every 2-3 s; automatic steps take a few seconds). Check the instance in Operate - where is the token? |
| An approved application waits at "Credit officer approval" | The full-version process (us-1) is still the newest in Zeebe: restart the backend on `us-2`, then Reset test data. |
| Login fails for everyone | Keycloak not up: `docker ps`, `docker start keycloak`, wait 30 s. |
| Page shows "Cannot reach the server" | Backend stopped: restart `mvn -o spring-boot:run`. Data is kept; running processes continue. |
| Page at :3077 does not load | `npm run serve` in `frontend`. |
| Everything is messy | Demo panel → **Reset test data** and start that section again. |
