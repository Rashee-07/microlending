import React from "react";
import { statusInfo } from "../constants/statuses";

// Coloured pill with the friendly status text.
function StatusBadge({ status }) {
  const info = statusInfo(status);
  return <span className={"pill " + info.tone}>{info.label}</span>;
}

export default StatusBadge;
