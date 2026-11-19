import React, { useState, useEffect } from "react";
import axios from "axios";
import Modal from "../components/Modal";
import StatCards from "../components/StatCards";
import LoanCard from "../components/LoanCard";
import LoanStatusTable from "../components/LoanStatusTable";

function Manager() {
  const [tasks, setTasks] = useState([]);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [popup, setPopup] = useState(null);

  // All loan applications with their status (for the table and summary)
  const loadLoans = () => {
    axios.get("http://localhost:8898/loans").then((response) => setLoans(response.data));
  };

  // Loans waiting for the manager's decision
  const loadTasks = () => {
    axios
      .post("http://localhost:8898/GetAllOpenLoanTasks2", { status: "" })
      .then((response) => setTasks(response.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTasks();
    loadLoans();
  }, []);

  // Step 1: ask before approving / rejecting.  decision = "Approve" or "Reject"
  const askDecision = (task, decision) => {
    const approve = decision === "Approve";
    setPopup({
      type: "confirm",
      title: approve ? "Approve this loan?" : "Reject this loan?",
      message:
        (approve ? "Approve" : "Reject") + " the " + task.loantype + " of " +
        Number(task.loanamount).toLocaleString() + " for " + task.firstname + " " + task.lastname + "?",
      confirmText: approve ? "Yes, approve" : "Yes, reject",
      confirmStyle: approve ? "btnSuccess" : "btnDanger",
      onCancel: () => setPopup(null),
      onConfirm: () => completeDecision(task, decision),
    });
  };

  // Step 2: send the decision, then show the result
  const completeDecision = (task, decision) => {
    setPopup(null);
    axios
      .patch("http://localhost:8898/CompleteTask/" + task.taskID, { status: decision })
      .then(() => {
        setTasks((old) => old.filter((t) => t.taskID !== task.taskID));
        loadLoans();
        setPopup({
          type: "success",
          title: decision === "Approve" ? "Loan approved" : "Loan rejected",
          message: "The loan of " + task.firstname + " " + task.lastname + " has been " +
            (decision === "Approve" ? "approved." : "rejected."),
          onConfirm: () => setPopup(null),
        });
      })
      .catch(() => {
        setPopup({
          type: "error",
          title: "Something went wrong",
          message: "The decision could not be saved. Please try again.",
          onConfirm: () => setPopup(null),
        });
      });
  };

  return (
    <div>
      <div className="pageHeader">
        <h1>Approvals</h1>
        <p>Approve or reject reviewed loan applications.</p>
      </div>

      <StatCards loans={loans} />

      <h3 className="sectionTitle">Waiting for approval ({tasks.length})</h3>
      {loading ? (
        <p className="emptyText">Loading...</p>
      ) : tasks.length === 0 ? (
        <div className="emptyState">🎉 No loans waiting for approval</div>
      ) : (
        <div className="loanGrid">
          {tasks.map((task) => (
            <LoanCard key={task.taskID} task={task}>
              <button className="btnSuccess" onClick={() => askDecision(task, "Approve")}>
                ✓ Approve
              </button>
              <button className="btnDanger" onClick={() => askDecision(task, "Reject")}>
                ✕ Reject
              </button>
            </LoanCard>
          ))}
        </div>
      )}

      <LoanStatusTable title="All loan applications" loans={loans} showName={true} />

      {popup && <Modal {...popup} />}
    </div>
  );
}

export default Manager;
