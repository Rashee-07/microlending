package com.aaseya.microlending.worker;

import org.springframework.stereotype.Component;

import com.aaseya.microlending.constants.ProcessConstants;
import com.aaseya.microlending.dto.process.DuplicateCheckResult;
import com.aaseya.microlending.dto.process.IdentityCheckResult;
import com.aaseya.microlending.dto.process.ValidationResult;
import com.aaseya.microlending.service.OnboardingService;

import io.camunda.zeebe.client.api.response.ActivatedJob;
import io.camunda.zeebe.spring.client.annotation.JobWorker;

/** UC01 service tasks. Returned records become process variables. */
@Component
public class OnboardingWorker {

  private final OnboardingService onboardingService;

  public OnboardingWorker(OnboardingService onboardingService) {
    this.onboardingService = onboardingService;
  }

  @JobWorker(type = ProcessConstants.JOB_VERIFY_IDENTITY, fetchAllVariables = true)
  public IdentityCheckResult verifyIdentity(ActivatedJob job) {
    return onboardingService.verifyIdentity(JobVariables.of(job).applicationId());
  }

  @JobWorker(type = ProcessConstants.JOB_CHECK_DUPLICATE, fetchAllVariables = true)
  public DuplicateCheckResult checkDuplicate(ActivatedJob job) {
    return onboardingService.checkDuplicate(JobVariables.of(job).applicationId());
  }

  @JobWorker(type = ProcessConstants.JOB_VALIDATE_APPLICATION, fetchAllVariables = true)
  public ValidationResult validateApplication(ActivatedJob job) {
    return onboardingService.validate(JobVariables.of(job).applicationId());
  }

  @JobWorker(type = ProcessConstants.JOB_EXPIRE_APPLICATION, fetchAllVariables = true)
  public void expireApplication(ActivatedJob job) {
    onboardingService.expire(JobVariables.of(job).applicationId());
  }
}
