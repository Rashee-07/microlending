package com.aaseya.microlending.worker;

import org.springframework.stereotype.Component;

import com.aaseya.microlending.constants.ProcessConstants;
import com.aaseya.microlending.dto.process.AffordabilityInput;
import com.aaseya.microlending.dto.process.AffordabilityResult;
import com.aaseya.microlending.dto.process.AssessmentFacts;
import com.aaseya.microlending.dto.process.AssessmentRecorded;
import com.aaseya.microlending.dto.process.BankStatementAnalysis;
import com.aaseya.microlending.dto.process.CreditReport;
import com.aaseya.microlending.dto.process.CustomerProfile;
import com.aaseya.microlending.service.CreditAssessmentService;

import io.camunda.zeebe.client.api.response.ActivatedJob;
import io.camunda.zeebe.spring.client.annotation.JobWorker;

/** UC02 service tasks. Each step adds variables used by the DMN "credit-decision". */
@Component
public class CreditAssessmentWorker {

  private final CreditAssessmentService assessmentService;

  public CreditAssessmentWorker(CreditAssessmentService assessmentService) {
    this.assessmentService = assessmentService;
  }

  @JobWorker(type = ProcessConstants.JOB_RETRIEVE_CUSTOMER, fetchAllVariables = true)
  public CustomerProfile retrieveCustomer(ActivatedJob job) {
    return assessmentService.retrieveCustomer(JobVariables.of(job).applicationId());
  }

  @JobWorker(type = ProcessConstants.JOB_RETRIEVE_CREDIT_REPORT, fetchAllVariables = true)
  public CreditReport retrieveCreditReport(ActivatedJob job) {
    JobVariables v = JobVariables.of(job);
    return assessmentService.retrieveCreditReport(v.applicationId(), v.string("lastName"), v.string("email"));
  }

  @JobWorker(type = ProcessConstants.JOB_ANALYSE_BANK_STATEMENTS, fetchAllVariables = true)
  public BankStatementAnalysis analyseBankStatements(ActivatedJob job) {
    JobVariables v = JobVariables.of(job);
    return assessmentService.analyseBankStatements(v.applicationId(), v.number("monthlyExpenses"));
  }

  @JobWorker(type = ProcessConstants.JOB_CALCULATE_AFFORDABILITY, fetchAllVariables = true)
  public AffordabilityResult calculateAffordability(ActivatedJob job) {
    return assessmentService.calculateAffordability(JobVariables.of(job).applicationId(),
        job.getVariablesAsType(AffordabilityInput.class));
  }

  @JobWorker(type = ProcessConstants.JOB_RECORD_ASSESSMENT, fetchAllVariables = true)
  public AssessmentRecorded recordAssessment(ActivatedJob job) {
    return assessmentService.recordAssessment(JobVariables.of(job).applicationId(),
        job.getVariablesAsType(AssessmentFacts.class));
  }
}
