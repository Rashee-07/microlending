package com.aaseya.microlending.worker;

import java.time.Duration;
import java.util.Map;

import org.springframework.stereotype.Component;

import com.aaseya.microlending.constants.ProcessConstants;
import com.aaseya.microlending.dto.process.CloseDecision;
import com.aaseya.microlending.dto.process.EsignatureSent;
import com.aaseya.microlending.dto.process.LoanOffer;
import com.aaseya.microlending.exception.ServiceUnavailableException;
import com.aaseya.microlending.model.enums.DisbursementResult;
import com.aaseya.microlending.service.LoanApprovalService;

import io.camunda.zeebe.client.api.response.ActivatedJob;
import io.camunda.zeebe.client.api.worker.JobClient;
import io.camunda.zeebe.spring.client.annotation.JobWorker;

/** UC03 service tasks. */
@Component
public class LoanApprovalWorker {

  private static final Duration RETRY_BACKOFF = Duration.ofSeconds(5);

  private final LoanApprovalService loanApprovalService;

  public LoanApprovalWorker(LoanApprovalService loanApprovalService) {
    this.loanApprovalService = loanApprovalService;
  }

  @JobWorker(type = ProcessConstants.JOB_GENERATE_AGREEMENT, fetchAllVariables = true)
  public LoanOffer generateAgreement(ActivatedJob job) {
    return loanApprovalService.createOffer(JobVariables.of(job).applicationId());
  }

  /**
   * If the e-signature provider is down the job is retried with back-off; after the last retry a BPMN error
   * moves the process to "Arrange manual signing".
   */
  @JobWorker(type = ProcessConstants.JOB_SEND_FOR_ESIGNATURE, autoComplete = false, fetchAllVariables = true)
  public void sendForSignature(JobClient client, ActivatedJob job) {
    long appId = JobVariables.of(job).applicationId();
    try {
      EsignatureSent sent = loanApprovalService.sendForSignature(appId);
      client.newCompleteCommand(job.getKey()).variables(sent).send().join();
    } catch (ServiceUnavailableException e) {
      int attemptsLeft = job.getRetries() - 1;
      loanApprovalService.recordSignatureServiceDown(appId, e.getMessage(), attemptsLeft);
      if (attemptsLeft > 0) {
        client.newFailCommand(job.getKey()).retries(attemptsLeft).retryBackoff(RETRY_BACKOFF)
            .errorMessage(e.getMessage()).send().join();
      } else {
        client.newThrowErrorCommand(job.getKey()).errorCode(ProcessConstants.ERROR_ESIGN_UNAVAILABLE)
            .errorMessage(e.getMessage()).send().join();
      }
    }
  }

  /** Signing deadline passed: withdraw the offer; the "Loan disbursed?" gateway then closes the application. */
  @JobWorker(type = ProcessConstants.JOB_WITHDRAW_OFFER, fetchAllVariables = true)
  public CloseDecision withdrawOffer(ActivatedJob job) {
    return loanApprovalService.withdrawOffer(JobVariables.of(job).applicationId());
  }

  /** A failed bank transfer becomes the BPMN error TRANSFER_FAILED ("Resolve failed bank transfer"). */
  @JobWorker(type = ProcessConstants.JOB_DISBURSE_FUNDS, autoComplete = false, fetchAllVariables = true)
  public void disburseFunds(JobClient client, ActivatedJob job) {
    DisbursementResult result = loanApprovalService.disburse(JobVariables.of(job).applicationId());
    if (result == DisbursementResult.FAILED) {
      client.newThrowErrorCommand(job.getKey()).errorCode(ProcessConstants.ERROR_TRANSFER_FAILED)
          .errorMessage("Bank rejected the transfer").send().join();
    } else {
      client.newCompleteCommand(job.getKey()).variables(Map.of("disbursementResult", result.name())).send().join();
    }
  }

  @JobWorker(type = ProcessConstants.JOB_ACTIVATE_LOAN_ACCOUNT, fetchAllVariables = true)
  public void activateLoanAccount(ActivatedJob job) {
    JobVariables v = JobVariables.of(job);
    loanApprovalService.activateLoan(v.applicationId(), v.string("bankReference"));
  }
}
