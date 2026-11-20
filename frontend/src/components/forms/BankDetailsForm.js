import React from "react";
import { useForm, Field, TaskForm } from "./FormKit";

/** UC04 task update-bank-details: the direct debit failed because the account details were wrong. */
function BankDetailsForm({ onSubmit, busy }) {
  const { values, change, setValues } = useForm({ bankAccountNumber: "" });
  return (
    <TaskForm
      title="Update your bank details"
      intro="Your last repayment could not be collected because the bank account details are incorrect."
      samples={[{ label: "Correct account", values: { bankAccountNumber: "062000777711" } }]}
      onSample={setValues}
      onSubmit={() => onSubmit(values)}
      busy={busy}
      submitText="Update and retry payment"
    >
      <Field label="Bank account" hint="BSB + account number" wide>
        <input value={values.bankAccountNumber} onChange={change("bankAccountNumber")} required />
      </Field>
    </TaskForm>
  );
}

export default BankDetailsForm;
