import React from "react";
import { useForm, Field, FileField, TaskForm } from "./FormKit";

/** UC01 task upload-income-docs. missing = what the validation step listed. */
function IncomeDocumentForm({ onSubmit, busy, missing }) {
  const { values, change, setValues } = useForm({ incomeDocType: "PAYSLIP", incomeDocFileName: "" });
  return (
    <TaskForm
      title="Upload your income document"
      intro={"We need more information to continue" + (missing ? ": " + missing.replace(/^Missing: /, "") : ".")}
      samples={[{ label: "Payslip", values: { incomeDocType: "PAYSLIP", incomeDocFileName: "payslip-october.pdf" } }]}
      onSample={setValues}
      onSubmit={() => onSubmit(values)}
      busy={busy}
      submitText="Upload"
    >
      <Field label="Document type">
        <select value={values.incomeDocType} onChange={change("incomeDocType")}>
          <option value="PAYSLIP">Payslip</option>
          <option value="BANK_STATEMENT">Bank statement</option>
        </select>
      </Field>
      <FileField label="File" value={values.incomeDocFileName}
        onChange={(f) => setValues({ ...values, incomeDocFileName: f })} required />
    </TaskForm>
  );
}

export default IncomeDocumentForm;
