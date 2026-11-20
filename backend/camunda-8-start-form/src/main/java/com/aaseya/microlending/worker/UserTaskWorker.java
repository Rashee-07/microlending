package com.aaseya.microlending.worker;

import org.springframework.stereotype.Component;

import com.aaseya.microlending.constants.ProcessConstants;
import com.aaseya.microlending.service.TaskService;

import io.camunda.zeebe.client.api.response.ActivatedJob;
import io.camunda.zeebe.spring.client.annotation.JobWorker;

/**
 * Picks up every Camunda user task of the loan process and stores it as a work item, so the React app can
 * list and complete tasks from the database. The job is NOT completed here: it stays activated (30-day timeout)
 * until the user submits the task through POST /api/tasks/{jobKey}/complete.
 *
 * Only one client may subscribe to io.camunda.zeebe:userTask - another subscriber would take the tasks away.
 */
@Component
public class UserTaskWorker {

  private static final long THIRTY_DAYS_MS = 30L * 24 * 60 * 60 * 1000;

  private final TaskService taskService;

  public UserTaskWorker(TaskService taskService) {
    this.taskService = taskService;
  }

  @JobWorker(type = ProcessConstants.JOB_USER_TASK, autoComplete = false, timeout = THIRTY_DAYS_MS, fetchAllVariables = true)
  public void captureUserTask(ActivatedJob job) {
    if (!ProcessConstants.PROCESS_ID.equals(job.getBpmnProcessId())) {
      return; // tasks of other processes (legacy LoanApplication) are handled in Tasklist
    }
    JobVariables v = JobVariables.of(job);
    String group = v.header(ProcessConstants.HEADER_CANDIDATE_GROUPS);
    if (group != null) {
      group = group.replaceAll("[\\[\\]\" ]", "").split(",")[0]; // header is a JSON array, e.g. ["credit-officer"]
    }
    taskService.captureUserTask(job.getKey(), job.getProcessInstanceKey(), job.getBpmnProcessId(), job.getElementId(),
        v.applicationId(), v.header(ProcessConstants.HEADER_ASSIGNEE), group, v.all());
  }
}
