package com.aaseya.microlending.worker;

import org.springframework.stereotype.Component;

import com.aaseya.microlending.constants.ProcessConstants;
import com.aaseya.microlending.dto.process.DirectDebitResult;
import com.aaseya.microlending.dto.process.NextRepayment;
import com.aaseya.microlending.service.RepaymentService;

import io.camunda.zeebe.client.api.response.ActivatedJob;
import io.camunda.zeebe.spring.client.annotation.JobWorker;

/** UC04 service tasks. */
@Component
public class RepaymentWorker {

  private final RepaymentService repaymentService;

  public RepaymentWorker(RepaymentService repaymentService) {
    this.repaymentService = repaymentService;
  }

  @JobWorker(type = ProcessConstants.JOB_GET_NEXT_REPAYMENT, fetchAllVariables = true)
  public NextRepayment nextRepayment(ActivatedJob job) {
    return repaymentService.nextRepayment(JobVariables.of(job).applicationId());
  }

  @JobWorker(type = ProcessConstants.JOB_SEND_REPAYMENT_REMINDER, fetchAllVariables = true)
  public void sendReminder(ActivatedJob job) {
    JobVariables v = JobVariables.of(job);
    repaymentService.sendReminder(v.applicationId(), v.longValue(ProcessConstants.VAR_REPAYMENT_ID));
  }

  @JobWorker(type = ProcessConstants.JOB_INITIATE_DIRECT_DEBIT, fetchAllVariables = true)
  public DirectDebitResult initiateDirectDebit(ActivatedJob job) {
    JobVariables v = JobVariables.of(job);
    return repaymentService.initiateDirectDebit(v.applicationId(), v.longValue(ProcessConstants.VAR_REPAYMENT_ID));
  }

  @JobWorker(type = ProcessConstants.JOB_UPDATE_OUTSTANDING_BALANCE, fetchAllVariables = true)
  public void updateOutstandingBalance(ActivatedJob job) {
    JobVariables v = JobVariables.of(job);
    repaymentService.recordPayment(v.applicationId(), v.longValue(ProcessConstants.VAR_REPAYMENT_ID),
        v.string("paymentReference"));
  }

  @JobWorker(type = ProcessConstants.JOB_NOTIFY_PAYMENT_FAILED, fetchAllVariables = true)
  public void notifyPaymentFailed(ActivatedJob job) {
    JobVariables v = JobVariables.of(job);
    repaymentService.recordFailedPayment(v.applicationId(), v.longValue(ProcessConstants.VAR_REPAYMENT_ID),
        v.string("failureReason"), v.integer("attempts"));
  }

  @JobWorker(type = ProcessConstants.JOB_CLOSE_LOAN_ACCOUNT, fetchAllVariables = true)
  public void closeLoanAccount(ActivatedJob job) {
    repaymentService.closeLoan(JobVariables.of(job).applicationId());
  }

  @JobWorker(type = ProcessConstants.JOB_RECORD_DISPUTE_OUTCOME, fetchAllVariables = true)
  public void recordDisputeOutcome(ActivatedJob job) {
    JobVariables v = JobVariables.of(job);
    String outcome = v.string("disputeOutcome");
    repaymentService.recordDisputeOutcome(v.applicationId(), outcome == null ? "REVIEWED" : outcome, v.string("comment"));
  }

  @JobWorker(type = ProcessConstants.JOB_UPDATE_REPAYMENT_SCHEDULE, fetchAllVariables = true)
  public void updateRepaymentSchedule(ActivatedJob job) {
    JobVariables v = JobVariables.of(job);
    Integer day = v.all().get("newDueDay") == null ? null : v.integer("newDueDay");
    repaymentService.updateSchedule(v.applicationId(), v.bool("dateChangeApproved"), day);
  }
}
