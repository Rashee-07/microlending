import React from "react";
import { useForm, Field, TaskForm, AU_STATES } from "./FormKit";

const EMPTY = {
  firstName: "", lastName: "", dateOfBirth: "", addressLine: "", suburb: "", state: "NSW", postcode: "",
  employmentStatus: "FULL_TIME", employerName: "", employmentYears: "",
};

const BASE = {
  firstName: "Priya", lastName: "Sharma", dateOfBirth: "1990-04-12", addressLine: "12 George Street",
  suburb: "Sydney", state: "NSW", postcode: "2000", employmentStatus: "FULL_TIME",
  employerName: "Harbour Logistics Pty Ltd", employmentYears: "4",
};

// Demo scenarios that are decided by these details (see docs/DEMO-TRIGGERS.md)
const SAMPLES = [
  { label: "Standard", values: BASE },
  { label: "Unknown employer (refer)", values: { ...BASE, employerName: "Unknown Pty Ltd" } },
  { label: "Low credit score (refer)", values: { ...BASE, lastName: "Risky" } },
  { label: "Fraud alert", values: { ...BASE, lastName: "Fraud" } },
];

/** UC01 task capture-details. */
function PersonalDetailsForm({ onSubmit, busy }) {
  const { values, change, setValues } = useForm(EMPTY);
  return (
    <TaskForm
      title="Your details"
      intro="Tell us about yourself, where you live and your work."
      samples={SAMPLES}
      onSample={setValues}
      onSubmit={() => onSubmit({ ...values, employmentYears: values.employmentYears === "" ? null : Number(values.employmentYears) })}
      busy={busy}
    >
      <Field label="First name"><input value={values.firstName} onChange={change("firstName")} required /></Field>
      <Field label="Last name"><input value={values.lastName} onChange={change("lastName")} required /></Field>
      <Field label="Date of birth"><input type="date" value={values.dateOfBirth} onChange={change("dateOfBirth")} required /></Field>
      <Field label="Street address"><input value={values.addressLine} onChange={change("addressLine")} required /></Field>
      <Field label="Suburb"><input value={values.suburb} onChange={change("suburb")} required /></Field>
      <Field label="State">
        <select value={values.state} onChange={change("state")}>
          {AU_STATES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </Field>
      <Field label="Postcode"><input value={values.postcode} onChange={change("postcode")} maxLength={4} required /></Field>
      <Field label="Employment">
        <select value={values.employmentStatus} onChange={change("employmentStatus")}>
          <option value="FULL_TIME">Full-time</option>
          <option value="PART_TIME">Part-time</option>
          <option value="CASUAL">Casual</option>
          <option value="SELF_EMPLOYED">Self-employed</option>
          <option value="UNEMPLOYED">Not employed</option>
        </select>
      </Field>
      <Field label="Employer"><input value={values.employerName} onChange={change("employerName")} /></Field>
      <Field label="Years with employer">
        <input type="number" min="0" step="0.5" value={values.employmentYears} onChange={change("employmentYears")} />
      </Field>
    </TaskForm>
  );
}

export default PersonalDetailsForm;
