import React, { useEffect, useState, useCallback } from "react";
import { api, errorMessage } from "../../api/client";
import { money } from "../../constants/statuses";
import { SCENARIOS, UC01_TRIGGERS, CUSTOMERS, TOOLS_LINKS } from "../../constants/demo";
import StatusBadge from "../../components/StatusBadge";
import { formatTime } from "../../components/NotificationList";

/** Presenter's control room (release 1): one-click UC02 scenarios, UC01 inputs, test-data reset. */
function DemoPanel() {
  const [applications, setApplications] = useState([]);
  const [customer, setCustomer] = useState("priya");
  const [busy, setBusy] = useState("");
  const [result, setResult] = useState(null); // { tone, text }

  const load = useCallback(() => {
    api.applications().then(setApplications).catch(() => {});
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 3000);
    return () => clearInterval(timer);
  }, [load]);

  const run = (key, action) => {
    setBusy(key);
    setResult(null);
    return action()
      .catch((err) => setResult({ tone: "bad", text: errorMessage(err) }))
      .finally(() => {
        setBusy("");
        load();
      });
  };

  const start = (s) =>
    run(s.key, async () => {
      const { applicationId } = await api.quickStart(s.useCase, customer, s.data);
      setResult({ tone: "good", text: `Application #${applicationId} started (${s.title}). Next: ${s.next.replace("{customer}", customer)}` });
    });

  const reset = () => {
    if (!window.confirm("Delete ALL applications and cancel their processes in Camunda?")) return;
    run("reset", () =>
      api.resetDemo().then((r) =>
        setResult({ tone: "good", text: `Clean start: ${r.applicationsDeleted} applications deleted, ${r.processInstancesCancelled} running processes cancelled.` })));
  };

  return (
    <div>
      <div className="pageHeader withAction">
        <div>
          <h1>Demo panel</h1>
          <p>Start any credit-assessment scenario in one click and reset the data before the demo.</p>
        </div>
        <button className="btnDanger" onClick={reset} disabled={busy === "reset"}>
          {busy === "reset" ? "Resetting..." : "↺ Reset test data"}
        </button>
      </div>

      {result && (
        <div className={result.tone === "bad" ? "errorBox" : "successBox"} onClick={() => setResult(null)}>
          {result.tone === "bad" ? "✕ " : "✓ "}{result.text}
        </div>
      )}

      <div className="demoTop">
        <section className="card">
          <h3 className="cardTitle">Release 1 scope</h3>
          <p className="muted small">
            This version covers UC01 (application &amp; onboarding) and UC02 (credit assessment). An approved application
            ends <strong>Approved in principle</strong>. Approval, payout and repayments (UC03-UC04) are on branch us-1.
          </p>
        </section>

        <section className="card">
          <h3 className="cardTitle">Tools</h3>
          <div className="toolLinks">
            {TOOLS_LINKS.map((l) => (
              <a key={l.url} href={l.url} target="_blank" rel="noreferrer" className="btnSecondary">{l.label} ↗</a>
            ))}
          </div>
          <p className="muted small">Operate login: demo / demo</p>
        </section>
      </div>

      <div className="pageHeader withAction demoScenarioHeader">
        <div>
          <h2 className="sectionTitle">Scenarios</h2>
          <p className="muted small">Creates a complete sample application and starts the loan process directly at that use case.</p>
        </div>
        <label className="customerPick">
          Customer
          <select value={customer} onChange={(e) => setCustomer(e.target.value)}>
            {CUSTOMERS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
      </div>

      <section className="card scenarioGroup">
        <h3 className="cardTitle"><span className="ucTag">UC01</span> Application & onboarding</h3>
        <p className="muted small">Done live by the customer: log in as {customer}, click <em>Apply for a loan</em> and use these inputs.</p>
        <div className="triggerList">
          {UC01_TRIGGERS.map((t) => (
            <div key={t.title} className="kv"><span>{t.title}</span><strong>{t.how}</strong></div>
          ))}
        </div>
      </section>

      {SCENARIOS.map((group) => (
        <section key={group.useCase} className="card scenarioGroup">
          <h3 className="cardTitle"><span className="ucTag">{group.useCase.toUpperCase()}</span> {group.title}</h3>
          <div className="scenarioGrid">
            {group.items.map((s) => (
              <div key={s.key} className={"scenarioCard " + s.tone}>
                <strong>{s.title}</strong>
                <p className="small">{s.what}</p>
                <p className="muted small">Next: {s.next.replace("{customer}", customer)}</p>
                <button className="btnPrimary" disabled={!!busy} onClick={() => start({ ...s, useCase: group.useCase })}>
                  {busy === s.key ? "Starting..." : "▶ Start"}
                </button>
              </div>
            ))}
          </div>
        </section>
      ))}

      <section className="card">
        <h3 className="cardTitle">Latest applications</h3>
        {applications.length === 0 ? (
          <p className="emptyText">No applications - a clean start.</p>
        ) : (
          <div className="tableWrap">
            <table className="statusTable">
              <thead>
                <tr><th>#</th><th>Customer</th><th>Applicant</th><th>Amount</th><th>Status</th><th>Updated</th></tr>
              </thead>
              <tbody>
                {applications.slice(0, 10).map((a) => (
                  <tr key={a.id}>
                    <td>{a.id}</td>
                    <td>{a.username}</td>
                    <td>{`${a.firstName || ""} ${a.lastName || ""}`.trim() || "-"}</td>
                    <td>{money(a.loanAmount)}</td>
                    <td><StatusBadge status={a.status} /></td>
                    <td className="muted small">{formatTime(a.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default DemoPanel;
