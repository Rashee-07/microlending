import React, { useState, useEffect } from "react";
import axios from "axios";
import Modal from "../components/Modal";
import StatCards from "../components/StatCards";
import LoanStatusTable from "../components/LoanStatusTable";

const EMPTY_FORM = {
  loanType: "",
  amount: "",
  firstName: "",
  lastName: "",
  email: "",
  number: "",
};

function User() {
  // Logged-in username (saved by Login.js)
  const username = localStorage.getItem("username");

  const [form, setForm] = useState(EMPTY_FORM);
  const [loans, setLoans] = useState([]);
  const [saving, setSaving] = useState(false);
  const [popup, setPopup] = useState(null);

  // Get this user's loan applications with their status
  const loadLoans = () => {
    axios
      .get("http://localhost:8898/loans", { params: { username: username } })
      .then((response) => setLoans(response.data));
  };

  useEffect(loadLoans, [username]);

  // Update one field of the form
  const change = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    setSaving(true);

    const loanData = {
      firstname: form.firstName,
      lastname: form.lastName,
      email: form.email,
      phonenumber: form.number,
      loantype: form.loanType,
      loanamount: Number(form.amount),
      username: username,
    };

    axios
      .post("http://localhost:8898/StartLoan", loanData)
      .then((response) => {
        setForm(EMPTY_FORM);
        loadLoans();
        setPopup({
          type: "success",
          title: "Application submitted",
          message: "Your loan application (Process ID " + response.data + ") was submitted. You can track its status in My Loans.",
          onConfirm: () => setPopup(null),
        });
      })
      .catch(() => {
        setPopup({
          type: "error",
          title: "Something went wrong",
          message: "Your application could not be submitted. Please try again.",
          onConfirm: () => setPopup(null),
        });
      })
      .finally(() => setSaving(false));
  };

  return (
    <div>
      <div className="pageHeader">
        <h1>My Loans</h1>
        <p>Apply for a new loan and follow the status of your applications.</p>
      </div>

      <StatCards loans={loans} />

      <div className="twoColumns">
        <form onSubmit={submit} className="card">
          <h3 className="cardTitle">Apply for a loan</h3>

          <div className="formGrid">
            <div className="field">
              <label>Loan Type</label>
              <select value={form.loanType} onChange={change("loanType")} required>
                <option value="">Select loan type</option>
                <option value="Education Loan">Education Loan</option>
                <option value="Bussiness Loan">Business Loan</option>
                <option value="Improvement">Home Improvement Loan</option>
              </select>
            </div>
            <div className="field">
              <label>Loan Amount</label>
              <input type="number" min="1" placeholder="e.g. 50000" value={form.amount} onChange={change("amount")} required />
            </div>
            <div className="field">
              <label>First Name</label>
              <input type="text" value={form.firstName} onChange={change("firstName")} required />
            </div>
            <div className="field">
              <label>Last Name</label>
              <input type="text" value={form.lastName} onChange={change("lastName")} required />
            </div>
            <div className="field">
              <label>Email</label>
              <input type="email" value={form.email} onChange={change("email")} required />
            </div>
            <div className="field">
              <label>Phone Number</label>
              <input type="tel" maxLength={10} placeholder="10 digits" value={form.number} onChange={change("number")} required />
            </div>
          </div>

          <button type="submit" className="btnPrimary full" disabled={saving}>
            {saving ? "Submitting..." : "Submit application"}
          </button>
        </form>

        <LoanStatusTable title="My applications" loans={loans} showName={false} />
      </div>

      {popup && <Modal {...popup} />}
    </div>
  );
}

export default User;
