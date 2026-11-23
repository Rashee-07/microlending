package com.aaseya.microlending.service;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.aaseya.microlending.config.DemoProperties;
import com.aaseya.microlending.constants.ProcessConstants;
import com.aaseya.microlending.dao.LoanApplicationDao;
import com.aaseya.microlending.exception.TaskNotActiveException;

import io.camunda.zeebe.client.ZeebeClient;
import io.camunda.zeebe.client.api.command.ClientStatusException;

/** All calls to Zeebe: start process instances, publish messages, complete user-task jobs. */
@Service
public class ProcessService {

  private static final Logger LOG = LoggerFactory.getLogger(ProcessService.class);
  private static final Duration MESSAGE_TTL = Duration.ofMinutes(5);

  private final ZeebeClient zeebe;
  private final LoanApplicationDao applicationDao;
  private final AuditService audit;
  private final DemoProperties properties;

  public ProcessService(ZeebeClient zeebe, LoanApplicationDao applicationDao, AuditService audit,
      DemoProperties properties) {
    this.zeebe = zeebe;
    this.applicationDao = applicationDao;
    this.audit = audit;
    this.properties = properties;
  }

  /**
   * Starts the loan process for an application (adds applicationId, the demo timers and an empty close reason).
   *
   * @param startAt null = from the beginning (UC01); otherwise a stage id (uc02) to start there
   */
  public long startLoanProcess(long applicationId, Map<String, Object> variables, String startAt) {
    Map<String, Object> vars = new HashMap<>(variables);
    vars.putAll(properties.processVariables());
    vars.put(ProcessConstants.VAR_APPLICATION_ID, String.valueOf(applicationId));
    vars.putIfAbsent(ProcessConstants.VAR_CLOSE_REASON, "");
    vars.putIfAbsent(ProcessConstants.VAR_CLOSE_STATUS, "");
    var command = zeebe.newCreateInstanceCommand()
        .bpmnProcessId(ProcessConstants.PROCESS_ID)
        .latestVersion()
        .variables(vars);
    if (startAt != null) {
      command = command.startBeforeElement(startAt);
    }
    long key = command.send().join().getProcessInstanceKey();
    applicationDao.updateProcessInstance(applicationId, key);
    audit.log(applicationId, "PROCESS_STARTED", "Started loan process" + (startAt == null ? "" : " at " + startAt)
        + " (instance " + key + ")", AuditService.SYSTEM);
    LOG.info("Started loan process for application {} at {} -> instance {}", applicationId,
        startAt == null ? "start" : startAt, key);
    return key;
  }

  /** Publishes a message to the process instance(s) of this application (correlation key = applicationId). */
  public void publishMessage(String messageName, long applicationId, Map<String, Object> variables) {
    zeebe.newPublishMessageCommand()
        .messageName(messageName)
        .correlationKey(String.valueOf(applicationId))
        .timeToLive(MESSAGE_TTL)
        .variables(variables)
        .send()
        .join();
    LOG.info("Published message {} for application {} {}", messageName, applicationId, variables);
  }

  /** Cancels a process instance; returns false when it had already ended (or never existed). */
  public boolean cancelInstance(long processInstanceKey) {
    try {
      zeebe.newCancelInstanceCommand(processInstanceKey).send().join();
      return true;
    } catch (ClientStatusException e) {
      return false;
    }
  }

  /** Completes a user-task job; throws when the task no longer exists in the process. */
  public void completeJob(long jobKey, Map<String, Object> variables) {
    try {
      zeebe.newCompleteCommand(jobKey).variables(variables).send().join();
    } catch (ClientStatusException e) {
      throw new TaskNotActiveException("Task " + jobKey + " is no longer active: " + e.getMessage());
    }
  }
}
