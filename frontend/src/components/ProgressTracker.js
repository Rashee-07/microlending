import React from "react";
import { STAGES, FINAL_STATUSES, statusInfo } from "../constants/statuses";

// The four use cases as steps: done / current / not reached. A closed application shows where it stopped.
function ProgressTracker({ status }) {
  const info = statusInfo(status);
  const finished = status === "CLOSED";
  const stopped = FINAL_STATUSES.includes(status) && !finished;

  return (
    <ol className="tracker">
      {STAGES.map((s) => {
        let state = "todo";
        if (finished || s.stage < info.stage) state = "done";
        else if (s.stage === info.stage) state = stopped ? "stopped" : "current";
        return (
          <li key={s.stage} className={"trackerStep " + state}>
            <span className="trackerDot">{state === "done" ? "✓" : state === "stopped" ? "✕" : s.stage}</span>
            <span className="trackerText">
              <strong>{s.title}</strong>
              <small>{s.detail}</small>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export default ProgressTracker;
