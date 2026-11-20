package com.aaseya.microlending.worker;

import org.springframework.stereotype.Component;

import com.aaseya.microlending.constants.ProcessConstants;
import com.aaseya.microlending.model.enums.ApplicationStatus;
import com.aaseya.microlending.service.StatusService;

import io.camunda.zeebe.client.api.response.ActivatedJob;
import io.camunda.zeebe.spring.client.annotation.JobWorker;

/** Generic steps of the loan process: notifying the customer and closing the application. */
@Component
public class ProcessFlowWorker {

  private final StatusService statusService;

  public ProcessFlowWorker(StatusService statusService) {
    this.statusService = statusService;
  }

  /** In-app notification. Headers: title, message (with {variable} placeholders). */
  @JobWorker(type = ProcessConstants.JOB_NOTIFY, fetchAllVariables = true)
  public void notifyCustomer(ActivatedJob job) {
    JobVariables v = JobVariables.of(job);
    statusService.notifyCustomer(v.applicationId(), v.header(ProcessConstants.HEADER_TITLE),
        v.fill(v.header(ProcessConstants.HEADER_MESSAGE)), null);
  }

  /** "Close application & notify customer": uses closeStatus / closeReason set earlier in the process. */
  @JobWorker(type = ProcessConstants.JOB_CLOSE_APPLICATION, fetchAllVariables = true)
  public void closeApplication(ActivatedJob job) {
    JobVariables v = JobVariables.of(job);
    String status = v.string(ProcessConstants.VAR_CLOSE_STATUS);
    statusService.closeApplication(v.applicationId(),
        status == null || status.isBlank() ? ApplicationStatus.DECLINED : ApplicationStatus.valueOf(status),
        v.string(ProcessConstants.VAR_CLOSE_REASON));
  }
}
