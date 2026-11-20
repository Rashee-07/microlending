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
  // UC03
  public static final String OFFICER_APPROVAL = "officer-approval";
  public static final String SENIOR_APPROVAL = "senior-approval";
  public static final String MANUAL_SIGNING = "manual-signing";
  public static final String RESOLVE_TRANSFER = "resolve-transfer";
  // UC04
  public static final String UPDATE_BANK_DETAILS = "update-bank-details";
  public static final String COLLECTIONS = "collections";
  public static final String INVESTIGATE_DISPUTE = "investigate-dispute";
  public static final String REVIEW_DATE_CHANGE = "review-date-change";

  /** Names shown in the task lists (same text as in the BPMN). */
  public static final Map<String, String> NAMES = Map.ofEntries(
      Map.entry(CAPTURE_DETAILS, "Capture personal, address & employment details"),
      Map.entry(UPLOAD_IDENTITY, "Upload identity documents"),
      Map.entry(CAPTURE_FINANCIALS, "Provide income, expenses, liabilities & loan purpose"),
      Map.entry(UPLOAD_INCOME_DOCS, "Upload missing income documents"),
      Map.entry(MANUAL_ASSESSMENT, "Manual credit assessment"),
      Map.entry(FRAUD_INVESTIGATION, "Fraud investigation"),
      Map.entry(OFFICER_APPROVAL, "Credit officer approval"),
      Map.entry(SENIOR_APPROVAL, "Senior credit approval"),
      Map.entry(MANUAL_SIGNING, "Arrange manual signing (e-signature down)"),
      Map.entry(RESOLVE_TRANSFER, "Resolve failed bank transfer"),
      Map.entry(UPDATE_BANK_DETAILS, "Update bank account details"),
      Map.entry(COLLECTIONS, "Collections follow-up"),
      Map.entry(INVESTIGATE_DISPUTE, "Investigate payment dispute"),
      Map.entry(REVIEW_DATE_CHANGE, "Review repayment date change"));

  /** Application status shown while one of these tasks is open. */
  public static final Map<String, ApplicationStatus> STATUS_WHILE_OPEN = Map.of(
      MANUAL_ASSESSMENT, ApplicationStatus.REFERRED,
      FRAUD_INVESTIGATION, ApplicationStatus.FRAUD_INVESTIGATION,
      OFFICER_APPROVAL, ApplicationStatus.PENDING_APPROVAL,
      SENIOR_APPROVAL, ApplicationStatus.PENDING_SENIOR_APPROVAL,
      MANUAL_SIGNING, ApplicationStatus.ESIGN_UNAVAILABLE,
      RESOLVE_TRANSFER, ApplicationStatus.DISBURSEMENT_FAILED,
      UPDATE_BANK_DETAILS, ApplicationStatus.BANK_DETAILS_REQUIRED);
}
