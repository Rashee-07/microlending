package com.aaseya.microlending.constants;

import java.util.Map;

import com.aaseya.microlending.model.enums.ApplicationStatus;

/** Element ids of the user tasks in the BPMN models, with their display names. */
public final class TaskElements {

  private TaskElements() {
  }

  // UC01 (customer)
  public static final String CAPTURE_DETAILS = "capture-details";
  public static final String UPLOAD_IDENTITY = "upload-identity";
  public static final String CAPTURE_FINANCIALS = "capture-financials";
  public static final String UPLOAD_INCOME_DOCS = "upload-income-docs";
  // UC02
  public static final String MANUAL_ASSESSMENT = "manual-assessment";
  public static final String FRAUD_INVESTIGATION = "fraud-investigation";

  /** Names shown in the task lists (same text as in the BPMN). */
  public static final Map<String, String> NAMES = Map.ofEntries(
      Map.entry(CAPTURE_DETAILS, "Capture personal, address & employment details"),
      Map.entry(UPLOAD_IDENTITY, "Upload identity documents"),
      Map.entry(CAPTURE_FINANCIALS, "Provide income, expenses, liabilities & loan purpose"),
      Map.entry(UPLOAD_INCOME_DOCS, "Upload missing income documents"),
      Map.entry(MANUAL_ASSESSMENT, "Manual credit assessment"),
      Map.entry(FRAUD_INVESTIGATION, "Fraud investigation"));

  /** Application status shown while one of these tasks is open. */
  public static final Map<String, ApplicationStatus> STATUS_WHILE_OPEN = Map.of(
      MANUAL_ASSESSMENT, ApplicationStatus.REFERRED,
      FRAUD_INVESTIGATION, ApplicationStatus.FRAUD_INVESTIGATION);
}
