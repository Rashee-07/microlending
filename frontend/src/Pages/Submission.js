import React from "react";
import { useNavigate } from "react-router-dom";

// Not used by the loan form any more (it shows a popup now), kept for the old link
function Submission() {
  const navigate = useNavigate();
  return (
    <div className="card center">
      <div className="modalIcon success">✓</div>
      <h2>Your application has been submitted</h2>
      <button className="btnPrimary" onClick={() => navigate("/Pages/User")}>
        Back to My Loans
      </button>
    </div>
  );
}

export default Submission;
