import React, { useState, useEffect } from "react";
import axios from "axios";
import Modal from "../components/Modal";
import StatCards from "../components/StatCards";
import LoanCard from "../components/LoanCard";
import LoanStatusTable from "../components/LoanStatusTable";

function Reviewer() {
  const [tasks, setTasks] = useState([]);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [popup, setPopup] = useState(null);

  // All loan applications with their status (for the table and summary)
  const loadLoans = () => {
    axios.get("http://localhost:8898/loans").then((response) => setLoans(response.data));
  };

  // Loans waiting for review
  const loadTasks = () => {
    axios
      .post("http://localhost:8898/GetAllOpenLoanTasks1", { taskState: "CREATED" })
      .then((response) => setTasks(response.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTasks();
    loadLoans();
  }, []);

  // Step 1: ask before completing the review
  const askComplete = (task) => {
    setPopup({
      type: "confirm",
      title: "Complete review?",
      message: "Mark the loan of " + task.firstname + " " + task.lastname + " as reviewed? It will move to the approver.",
      confirmText: "Yes, complete",
      onCancel: () => setPopup(null),
      onConfirm: () => completeReview(task),
    });
  };

  // Step 2: complete the task, then show the result
  const completeReview = (task) => {
    setPopup(null);
    axios
      .patch("http://localhost:8898/CompleteTask/" + task.taskID, { taskState: "CREATED" })
      .then(() => {
        setTasks((old) => old.filter((t) => t.taskID !== task.taskID));
        loadLoans();
        setPopup({
          type: "success",
          title: "Review completed",
          message: "The loan of " + task.firstname + " " + task.lastname + " has been reviewed.",
          onConfirm: () => setPopup(null),
        });
      })
      .catch(() => {
        setPopup({
          type: "error",
          title: "Something went wrong",
          message: "The review could not be completed. Please try again.",
          onConfirm: () => setPopup(null),
        });
      });
  };

  return (
    <div>
      <div className="pageHeader">
        <h1>Review Queue</h1>
        <p>Check new loan applications and pass them on to the approver.</p>
      </div>

      <StatCards loans={loans} />

      <h3 className="sectionTitle">Waiting for review ({tasks.length})</h3>
      {loading ? (
        <p className="emptyText">Loading...</p>
      ) : tasks.length === 0 ? (
        <div className="emptyState">🎉 No loans waiting for review</div>
      ) : (
        <div className="loanGrid">
          {tasks.map((task) => (
            <LoanCard key={task.taskID} task={task}>
              <button className="btnPrimary full" onClick={() => askComplete(task)}>
                Complete Review
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

export default Reviewer;
