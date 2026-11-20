package com.aaseya.microlending.model.enums;

/** Uploaded document types. */
public enum DocumentType {
  PASSPORT, DRIVERS_LICENCE, PAYSLIP, BANK_STATEMENT;

  public boolean isIdentityDocument() {
    return this == PASSPORT || this == DRIVERS_LICENCE;
  }
}
