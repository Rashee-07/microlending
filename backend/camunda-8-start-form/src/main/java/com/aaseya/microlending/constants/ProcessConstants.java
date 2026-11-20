package com.aaseya.microlending.constants;

/** Names shared between the BPMN/DMN models (tools/generate-models.js) and the Java code. */
public final class ProcessConstants {

  private ProcessConstants() {
  }

  // ---- the process: one loan life cycle, one sub-process per use case ---------
  public static final String PROCESS_ID = "microlending-loan";
  public static final String STAGE_UC01 = "uc01";
  public static final String STAGE_UC02 = "uc02";
  public static final String STAGE_UC03 = "uc03";
  public static final String STAGE_UC04 = "uc04";

  // ---- job types (service tasks) ----------------------------------------------
  public static final String JOB_USER_TASK = "io.camunda.zeebe:userTask";
  public static final String JOB_NOTIFY = "notify";
  public static final String JOB_CLOSE_APPLICATION = "close-application";
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
  // UC03
  public static final String JOB_GENERATE_AGREEMENT = "generate-agreement";
  public static final String JOB_SEND_FOR_ESIGNATURE = "send-for-esignature";
  public static final String JOB_WITHDRAW_OFFER = "withdraw-offer";
  public static final String JOB_DISBURSE_FUNDS = "disburse-funds";
  public static final String JOB_ACTIVATE_LOAN_ACCOUNT = "activate-loan-account";
  // UC04
  public static final String JOB_GET_NEXT_REPAYMENT = "get-next-repayment";
  public static final String JOB_SEND_REPAYMENT_REMINDER = "send-repayment-reminder";
  public static final String JOB_INITIATE_DIRECT_DEBIT = "initiate-direct-debit";
  public static final String JOB_UPDATE_OUTSTANDING_BALANCE = "update-outstanding-balance";
  public static final String JOB_NOTIFY_PAYMENT_FAILED = "notify-payment-failed";
  public static final String JOB_CLOSE_LOAN_ACCOUNT = "close-loan-account";
  public static final String JOB_RECORD_DISPUTE_OUTCOME = "record-dispute-outcome";
  public static final String JOB_UPDATE_REPAYMENT_SCHEDULE = "update-repayment-schedule";

  // ---- messages (correlation key = applicationId) -----------------------------
  public static final String MSG_AGREEMENT_SIGNED = "agreement-signed";
  public static final String MSG_DISBURSEMENT_CONFIRMED = "disbursement-confirmed";
  public static final String MSG_PAYMENT_RESULT = "payment-result";
  public static final String MSG_REPAYMENT_DISPUTED = "repayment-disputed";
  public static final String MSG_REPAYMENT_DATE_CHANGE = "repayment-date-change";

  // ---- BPMN error codes ---------------------------------------------------------
  public static final String ERROR_ESIGN_UNAVAILABLE = "ESIGN_UNAVAILABLE";
  public static final String ERROR_TRANSFER_FAILED = "TRANSFER_FAILED";

  // ---- task headers -------------------------------------------------------------
  public static final String HEADER_TITLE = "title";
  public static final String HEADER_MESSAGE = "message";
  public static final String HEADER_ASSIGNEE = "io.camunda.zeebe:assignee";
  public static final String HEADER_CANDIDATE_GROUPS = "io.camunda.zeebe:candidateGroups";

  // ---- process variables ----------------------------------------------------------
  public static final String VAR_APPLICATION_ID = "applicationId";
  public static final String VAR_CUSTOMER_USERNAME = "customerUsername";
  /** Set when the application must stop; the gateways after UC01-UC03 continue only while it is "". */
  public static final String VAR_CLOSE_REASON = "closeReason";
  /** Final application status when closed: REJECTED, DECLINED or OFFER_EXPIRED. */
  public static final String VAR_CLOSE_STATUS = "closeStatus";
  public static final String VAR_RISK_CATEGORY = "riskCategory";
  public static final String VAR_LOAN_AMOUNT = "loanAmount";
  public static final String VAR_REPAYMENT_ID = "repaymentId";
}
