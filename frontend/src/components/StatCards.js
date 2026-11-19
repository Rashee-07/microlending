import React from "react";

// Summary boxes: how many loans are in each status
function StatCards({ loans }) {
  const count = (status) => loans.filter((loan) => loan.status === status).length;

  const stats = [
    { label: "Total", value: loans.length, className: "TOTAL" },
    { label: "Submitted", value: count("SUBMITTED"), className: "SUBMITTED" },
    { label: "Reviewed", value: count("REVIEWED"), className: "REVIEWED" },
    { label: "Approved", value: count("APPROVED"), className: "APPROVED" },
    { label: "Rejected", value: count("REJECTED"), className: "REJECTED" },
  ];

  return (
    <div className="stats">
      {stats.map((stat) => (
        <div key={stat.label} className={"statCard " + stat.className}>
          <div className="statValue">{stat.value}</div>
          <div className="statLabel">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}

export default StatCards;
