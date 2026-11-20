import React from "react";
import { useForm, Field, FileField, TaskForm } from "./FormKit";

const PURPOSES = ["Emergency expense", "Car repairs", "Medical bills", "Education", "Home improvement", "Debt consolidation", "Other"];

const EMPTY = {
  loanAmount: "", loanPurpose: "Emergency expense", termMonths: "12", monthlyIncome: "", monthlyExpenses: "",
  monthlyLiabilities: "", bankAccountNumber: "", incomeDocType: "PAYSLIP", incomeDocFileName: "",
};

const BASE = {
  loanAmount: "3000", loanPurpose: "Emergency expense", termMonths: "24", monthlyIncome: "5200",
  monthlyExpenses: "2400", monthlyLiabilities: "300", bankAccountNumber: "062000123456",
  incomeDocType: "PAYSLIP", incomeDocFileName: "payslip-october.pdf",
};

const SAMPLES = [
  { label: "Affordable (AUD 3,000)", values: BASE },
  { label: "Payslip missing", values: { ...BASE, incomeDocFileName: "" } },
  { label: "Financial hardship", values: { ...BASE, monthlyExpenses: "4900" } },
  { label: "Account with no funds", values: { ...BASE, bankAccountNumber: "062000555599" } },
];

/** UC01 task capture-financials: income, expenses, liabilities, loan purpose and an income document. */
function FinancialsForm({ onSubmit, busy }) {
  const { values, change, setValues } = useForm(EMPTY);

  const submit = () => {
    const data = { ...values };
    // amounts become process variables used by decision rules - send them as numbers
    ["loanAmount", "termMonths", "monthlyIncome", "monthlyExpenses", "monthlyLiabilities"].forEach((k) => {
      data[k] = Number(data[k]);
    });
    if (!data.incomeDocFileName) {
      delete data.incomeDocType; // no document attached - the process will ask for it
      delete data.incomeDocFileName;
    }
    onSubmit(data);
  };

  return (
    <TaskForm
      title="Your loan and finances"
      intro="How much you need, and your monthly income, expenses and existing debts."
      samples={SAMPLES}
      onSample={setValues}
      onSubmit={submit}
      busy={busy}
      submitText="Submit application"
    >
      <Field label="Loan amount (AUD)"><input type="number" min="500" max="50000" value={values.loanAmount} onChange={change("loanAmount")} required /></Field>
      <Field label="Loan purpose">
        <select value={values.loanPurpose} onChange={change("loanPurpose")}>
          {PURPOSES.map((p) => <option key={p}>{p}</option>)}
        </select>
      </Field>
      <Field label="Repay over">
        <select value={values.termMonths} onChange={change("termMonths")}>
          {["6", "12", "18", "24"].map((m) => <option key={m} value={m}>{m} months</option>)}
        </select>
      </Field>
      <Field label="Monthly income after tax (AUD)"><input type="number" min="0" value={values.monthlyIncome} onChange={change("monthlyIncome")} required /></Field>
      <Field label="Monthly living expenses (AUD)"><input type="number" min="0" value={values.monthlyExpenses} onChange={change("monthlyExpenses")} required /></Field>
      <Field label="Monthly repayments on other debts (AUD)"><input type="number" min="0" value={values.monthlyLiabilities} onChange={change("monthlyLiabilities")} required /></Field>
      <Field label="Bank account (for payout and repayments)" hint="BSB + account number">
        <input value={values.bankAccountNumber} onChange={change("bankAccountNumber")} required />
      </Field>
      <Field label="Income document">
        <select value={values.incomeDocType} onChange={change("incomeDocType")}>
          <option value="PAYSLIP">Payslip</option>
          <option value="BANK_STATEMENT">Bank statement</option>
        </select>
      </Field>
      <FileField label="Upload income document" value={values.incomeDocFileName}
        onChange={(f) => setValues({ ...values, incomeDocFileName: f })} />
    </TaskForm>
  );
}

export default FinancialsForm;
