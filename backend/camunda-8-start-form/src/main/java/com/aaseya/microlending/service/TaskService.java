package com.aaseya.microlending.service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.aaseya.microlending.constants.ProcessConstants;
import com.aaseya.microlending.constants.TaskElements;
import com.aaseya.microlending.dao.LoanApplicationDao;
import com.aaseya.microlending.dao.WorkItemDao;
import com.aaseya.microlending.dto.form.CustomerDetailsForm;
import com.aaseya.microlending.dto.form.FinancialDetailsForm;
import com.aaseya.microlending.dto.form.IdentityDocumentForm;
import com.aaseya.microlending.dto.form.IncomeDocumentForm;
import com.aaseya.microlending.dto.request.CompleteTaskRequest;
import com.aaseya.microlending.dto.response.TaskResponse;
import com.aaseya.microlending.exception.AccessDeniedException;
import com.aaseya.microlending.exception.TaskNotActiveException;
import com.aaseya.microlending.model.WorkItem;
import com.aaseya.microlending.model.enums.ApplicationStatus;
import com.aaseya.microlending.model.enums.WorkItemStatus;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Human tasks. Camunda user tasks are stored as work items when they are created; when a user submits a task,
 * its data is saved through the domain services and the Camunda job is completed with the data as variables.
 */
@Service
public class TaskService {

  private static final Logger LOG = LoggerFactory.getLogger(TaskService.class);

  /** Which task groups each login role works on (Keycloak realm role -> candidate groups). */
  private static final Map<String, List<String>> GROUPS_BY_ROLE = Map.of(
      "USER", List.of(),
      "REVIEWER", List.of("credit-officer", "fraud-team"),
      "MANAGER", List.of("senior-approver", "collections", "operations"));

  private final WorkItemDao workItemDao;
  private final LoanApplicationDao applicationDao;
  private final OnboardingService onboardingService;
  private final ProcessService processService;
  private final AuditService audit;
  private final ObjectMapper objectMapper;

  public TaskService(WorkItemDao workItemDao, LoanApplicationDao applicationDao, OnboardingService onboardingService,
      ProcessService processService, AuditService audit, ObjectMapper objectMapper) {
    this.workItemDao = workItemDao;
    this.applicationDao = applicationDao;
    this.onboardingService = onboardingService;
    this.processService = processService;
    this.audit = audit;
    this.objectMapper = objectMapper;
  }

  /** Called by the user-task worker when Camunda creates a user task. */
  public void captureUserTask(long jobKey, long processInstanceKey, String bpmnProcessId, String elementId,
      long applicationId, String assignee, String candidateGroup, Map<String, Object> variables) {
    String name = TaskElements.NAMES.getOrDefault(elementId, elementId);
    workItemDao.create(jobKey, processInstanceKey, bpmnProcessId, elementId, name, applicationId, assignee, candidateGroup);
    ApplicationStatus status = TaskElements.STATUS_WHILE_OPEN.get(elementId);
    if (status != null) {
      applicationDao.updateStatus(applicationId, status, null);
    }
    audit.log(applicationId, "TASK_CREATED",
        name + (assignee != null ? " (assigned to " + assignee + ")" : " (group " + candidateGroup + ")"), AuditService.SYSTEM);
    LOG.info("User task {} for application {} -> work item {}", elementId, applicationId, jobKey);
  }

  /** Open tasks for a user: their own customer tasks plus the queues of their role. */
  public List<TaskResponse> findOpenTasks(String username, String role) {
    return workItemDao.findOpenTasks(username, GROUPS_BY_ROLE.getOrDefault(role, List.of()));
  }

  /** Saves the submitted data and completes the Camunda job. */
  public void complete(long jobKey, CompleteTaskRequest request) {
    WorkItem item = workItemDao.findByJobKey(jobKey)
        .filter(w -> w.status() == WorkItemStatus.OPEN)
        .orElseThrow(() -> new TaskNotActiveException("Task " + jobKey + " is not open any more"));
    if (item.assignee() != null && !item.assignee().equals(request.username())) {
      throw new AccessDeniedException("This task belongs to another user");
    }
    long appId = item.applicationId();
    Map<String, Object> data = request.data() == null ? Map.of() : request.data();
    Map<String, Object> variables = new LinkedHashMap<>(data);
    variables.putAll(applyTaskData(appId, item.elementId(), data));

    try {
      processService.completeJob(jobKey, variables);
    } catch (TaskNotActiveException e) {
      // the process already moved on (e.g. the application expired) - close the task here too
      workItemDao.close(jobKey, WorkItemStatus.CANCELED, request.username());
      throw e;
    }
    workItemDao.close(jobKey, WorkItemStatus.COMPLETED, request.username());
    audit.log(appId, "TASK_COMPLETED", item.name() + decisionSummary(variables), request.username());
  }

  /** Stores the form data of the task and returns extra process variables derived from it. */
  private Map<String, Object> applyTaskData(long appId, String elementId, Map<String, Object> data) {
    Map<String, Object> extra = new LinkedHashMap<>();
    switch (elementId) {
      case TaskElements.CAPTURE_DETAILS -> onboardingService.saveCustomerDetails(appId, form(data, CustomerDetailsForm.class));
      case TaskElements.UPLOAD_IDENTITY -> onboardingService.saveIdentityDocument(appId, form(data, IdentityDocumentForm.class));
      case TaskElements.CAPTURE_FINANCIALS -> onboardingService.saveFinancialDetails(appId, form(data, FinancialDetailsForm.class));
      case TaskElements.UPLOAD_INCOME_DOCS -> onboardingService.saveIncomeDocument(appId, form(data, IncomeDocumentForm.class));
      case TaskElements.MANUAL_ASSESSMENT -> {
        if (!"APPROVE".equals(data.get("officerDecision"))) {
          close(extra, withComment("Declined after manual credit assessment", data));
        }
      }
      case TaskElements.FRAUD_INVESTIGATION -> {
        boolean confirmed = Boolean.parseBoolean(String.valueOf(data.get("fraudConfirmed")));
        extra.put("fraudConfirmed", confirmed);
        if (confirmed) {
          close(extra, withComment("Application declined following a fraud investigation", data));
        }
      }
      default -> {
        // other tasks: the data is passed on as variables only
      }
    }
    return extra;
  }

  /** Sets the variables that make the next gateway close the application (status DECLINED). */
  private static void close(Map<String, Object> vars, String reason) {
    vars.put(ProcessConstants.VAR_CLOSE_STATUS, ApplicationStatus.DECLINED.name());
    vars.put(ProcessConstants.VAR_CLOSE_REASON, reason);
  }

  private <T> T form(Map<String, Object> data, Class<T> type) {
    return objectMapper.convertValue(data, type);
  }

  private static String withComment(String text, Map<String, Object> data) {
    Object c = data.get("comment");
    return c == null || c.toString().isBlank() ? text : text + ": " + c;
  }

  private static String decisionSummary(Map<String, Object> v) {
    for (String k : new String[] {"officerDecision", "fraudConfirmed"}) {
      if (v.containsKey(k)) {
        return " (" + k + " = " + v.get(k) + ")";
      }
    }
    return "";
  }
}
