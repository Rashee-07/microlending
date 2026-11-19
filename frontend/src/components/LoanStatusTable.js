import React from "react";

// Table of loans with a coloured status badge.
// showName = true shows the applicant's name (Reviewer / Manager pages).
function LoanStatusTable({ title, loans, showName }) {
  return (
    <div className="card">
      <h3 className="cardTitle">{title}</h3>
      {loans.length === 0 ? (
        <p className="emptyText">No loan applications yet</p>
      ) : (
        <div className="tableWrap">
          <table className="statusTable">
            <thead>
              <tr>
                <th>Process ID</th>
                {showName && <th>Applicant</th>}
                <th>Loan Type</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((loan) => (
                <tr key={loan.id}>
                  <td className="mono">{loan.process_instance_id}</td>
                  {showName && (
                    <td>
                      {loan.first_name} {loan.last_name}
                    </td>
                  )}
                  <td>{loan.loan_type}</td>
                  <td>{Number(loan.loan_amount).toLocaleString()}</td>
                  <td>
                    <span className={"badge " + loan.status}>{loan.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default LoanStatusTable;
