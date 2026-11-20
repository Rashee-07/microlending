import React, { useState } from "react";

// Small helpers shared by the task forms.

/** Form state: values, change(field) handler for inputs, setValues to replace everything (sample data). */
export function useForm(initial) {
  const [values, setValues] = useState(initial);
  const change = (field) => (e) => setValues({ ...values, [field]: e.target.value });
  return { values, change, setValues };
}

export function Field({ label, hint, wide, children }) {
  return (
    <div className={"field" + (wide ? " wide" : "")}>
      <label>{label}</label>
      {children}
      {hint && <small className="hint">{hint}</small>}
    </div>
  );
}

/** File picker: the demo stores only the file name (no real upload). */
export function FileField({ label, value, onChange, required }) {
  return (
    <Field label={label} hint={value ? "Selected: " + value : "PDF, JPG or PNG"}>
      <input
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        required={required && !value}
        onChange={(e) => onChange(e.target.files.length ? e.target.files[0].name : "")}
      />
    </Field>
  );
}

/** Demo helper: buttons that fill the form with prepared data for each scenario. */
export function SampleButtons({ samples, onPick }) {
  if (!samples || samples.length === 0) return null;
  return (
    <div className="samples">
      <span>Demo data:</span>
      {samples.map((s) => (
        <button type="button" key={s.label} className="chip" onClick={() => onPick(s.values)}>
          {s.label}
        </button>
      ))}
    </div>
  );
}

/** Title, intro, sample buttons, the fields and a submit button. */
export function TaskForm({ title, intro, samples, onSample, onSubmit, busy, submitText, children }) {
  const submit = (e) => {
    e.preventDefault();
    onSubmit();
  };
  return (
    <form className="card taskForm" onSubmit={submit}>
      <h3 className="cardTitle">{title}</h3>
      {intro && <p className="muted intro">{intro}</p>}
      <SampleButtons samples={samples} onPick={onSample} />
      <div className="formGrid">{children}</div>
      <button type="submit" className="btnPrimary full" disabled={busy}>
        {busy ? "Saving..." : submitText || "Continue"}
      </button>
    </form>
  );
}

export const AU_STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"];
