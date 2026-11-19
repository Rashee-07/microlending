import React from "react";

// A simple popup with a title, a message and buttons.
// type: "confirm" | "success" | "error"
// If onCancel is given, a Cancel button is shown too.
function Modal({ type, title, message, confirmText, confirmStyle, onConfirm, onCancel }) {
  const icons = { confirm: "?", success: "✓", error: "!" };

  return (
    <div className="modalOverlay">
      <div className="modal">
        <div className={"modalIcon " + type}>{icons[type]}</div>
        <h2>{title}</h2>
        <p>{message}</p>
        <div className="modalButtons">
          {onCancel && (
            <button className="btnSecondary" onClick={onCancel}>
              Cancel
            </button>
          )}
          <button className={confirmStyle || "btnPrimary"} onClick={onConfirm}>
            {confirmText || "OK"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Modal;
