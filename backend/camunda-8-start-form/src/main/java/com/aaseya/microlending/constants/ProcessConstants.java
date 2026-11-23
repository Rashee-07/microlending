package com.aaseya.microlending.constants;

/** Names shared between the BPMN/DMN models (tools/generate-models.js) and the Java code. */
public final class ProcessConstants {

  private ProcessConstants() {
  }

  // ---- the process: release 1 = UC01 + UC02, one sub-process per use case ----
  public static final String PROCESS_ID = "microlending-loan";
  public static final String STAGE_UC01 = "uc01";
  public static final String STAGE_UC02 = "uc02";

  // ---- job types (service tasks) ----------------------------------------------
  public static final String JOB_USER_TASK = "io.camunda.zeebe:userTask";
  public static final String JOB_NOTIFY = "notify";
  public static final String JOB_CLOSE_APPLICATION = "close-application";
  /** End of release 1: approved applications are approved in principle and the customer is told. */
  public static final String JOB_APPROVE_IN_PRINCIPLE = "approve-in-principle";
  // UC01
  public static final String JOB_VERIFY_IDENTITY = "verify-identity";
  public static final String JOB_CHECK_DUPLICATE = "check-duplicate";
  public static final String JOB_VALIDATE_APPLICATION = "validate-application";
  public static final String JOB_EXPIRE_APPLICATION = "expire-application";
  // UC02
  public static final String JOB_RETRIEVE_CUSTOMER = "retrieve-customer";
  public static final String JOB_RETRIEVE_CREDIT_REPORT = "retrieve-credit-report";
  public static final String JOB_ANALYSE_BANK_STATEMENTS = "analyse-bank-statements";
  public static final String JOB_CALCULATE_AFFORDABILITY = "calculate-affordability";
  public static final String JOB_RECORD_ASSESSMENT = "record-assessment";

  // ---- task headers -------------------------------------------------------------
  public static final String HEADER_TITLE = "title";
  public static final String HEADER_MESSAGE = "message";
  public static final String HEADER_ASSIGNEE = "io.camunda.zeebe:assignee";
  public static final String HEADER_CANDIDATE_GROUPS = "io.camunda.zeebe:candidateGroups";

  // ---- process variables ----------------------------------------------------------
  public static final String VAR_APPLICATION_ID = "applicationId";
  public static final String VAR_CUSTOMER_USERNAME = "customerUsername";
  /** Set when the application must stop; the gateways after UC01 and UC02 continue only while it is "". */
  public static final String VAR_CLOSE_REASON = "closeReason";
  /** Final application status when closed: REJECTED or DECLINED. */
  public static final String VAR_CLOSE_STATUS = "closeStatus";
  public static final String VAR_RISK_CATEGORY = "riskCategory";
  public static final String VAR_LOAN_AMOUNT = "loanAmount";
}
