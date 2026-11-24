import React, { useState } from "react";
import { useForm, Field, FileField, TaskForm } from "./FormKit";
import Modal from "../Modal";

const random = () => String(Math.floor(1000000 + Math.random() * 8999999));

const samples = () => [
  { label: "Valid passport", values: { idType: "PASSPORT", idNumber: "PA" + random(), idExpiry: "2031-06-30", fileName: "passport.jpg" } },
  { label: "Expired document", values: { idType: "DRIVERS_LICENCE", idNumber: "DL" + random(), idExpiry: "2023-01-31", fileName: "licence.jpg" } },
  { label: "Fails verification", values: { idType: "PASSPORT", idNumber: "PA1234000", idExpiry: "2030-01-01", fileName: "passport.jpg" } },
];

/** UC01 task upload-identity. reupload = the previous document was expired or invalid. */
function IdentityDocumentForm({ onSubmit, busy, reupload }) {
  const { values, change, setValues } = useForm({ idType: "PASSPORT", idNumber: "", idExpiry: "", fileName: "" });
  const [missingScan, setMissingScan] = useState(false);

  // the identity cannot be verified without a scan or photo of the document
  const submit = () => {
    if (!values.fileName) {
      setMissingScan(true);
      return;
    }
    onSubmit(values);
  };

  return (
    <>
      <TaskForm
        title={reupload ? "Upload a valid identity document" : "Identity document"}
        intro={
          reupload
            ? "The document you uploaded is expired or could not be read. Please upload a valid passport or driver licence."
            : "Upload your passport or driver licence. We verify it with an identity service."
        }
        samples={samples()}
        onSample={setValues}
        onSubmit={submit}
        busy={busy}
        submitText="Verify my identity"
      >
        <Field label="Document type">
          <select value={values.idType} onChange={change("idType")}>
            <option value="PASSPORT">Passport</option>
            <option value="DRIVERS_LICENCE">Driver licence</option>
          </select>
        </Field>
        <Field label="Document number"><input value={values.idNumber} onChange={change("idNumber")} required /></Field>
        <Field label="Expiry date"><input type="date" value={values.idExpiry} onChange={change("idExpiry")} required /></Field>
        <FileField label="Scan / photo" value={values.fileName} onChange={(f) => setValues({ ...values, fileName: f })} />
      </TaskForm>

      {missingScan && (
        <Modal
          type="error"
          title="Identity document needed"
          message={`Please upload a photo or scan of your ${
            values.idType === "DRIVERS_LICENCE" ? "driver licence" : "passport"
          } before we can verify your identity.`}
          confirmText="Upload document"
          onConfirm={() => setMissingScan(false)}
        />
      )}
    </>
  );
}

export default IdentityDocumentForm;
