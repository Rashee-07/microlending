import React, { useState } from "react";
import { STAFF_TASKS } from "../../constants/tasks";

/** The decision buttons of a staff task (configured in constants/tasks.js) plus an optional comment. */
function DecisionPanel({ task, onDecide }) {
  const config = STAFF_TASKS[task.elementId];
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!config) {
    return <p className="emptyText">No decision form for task "{task.elementId}"</p>;
  }

  const decide = (decision) => {
    if (decision.needsComment && !comment.trim()) {
      setError("Please add a comment for this decision - it is shown to the customer.");
      return;
    }
    setBusy(true);
    setError("");
    const data = { ...decision.data };
    if (comment.trim()) data.comment = comment.trim();
    onDecide(data, decision.label)
      .catch((e) => setError(e))
      .finally(() => setBusy(false));
  };

  return (
    <div className="decisionPanel">
      <div className="decisionTitle">
        <span className="ucTag">{config.useCase}</span>
        <h3>{task.name}</h3>
      </div>
      <p className="muted">{config.help}</p>
      <div className="field">
        <label>Comment</label>
        <textarea rows={2} value={comment} onChange={(e) => setComment(e.target.value)}
          placeholder="Reason or note (required when declining / rejecting)" />
      </div>
      {error && <div className="errorBox">{error}</div>}
      <div className="decisionButtons">
        {config.decisions.map((d) => (
          <button key={d.label} className={d.style} disabled={busy} onClick={() => decide(d)}>
            {d.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default DecisionPanel;
