package com.aaseya.microlending.service;

import org.springframework.stereotype.Service;

import com.aaseya.microlending.dao.LoanApplicationDao;
import com.aaseya.microlending.dao.WorkItemDao;
import com.aaseya.microlending.model.enums.ApplicationStatus;

/** Application status changes, customer messages and closing an application. */
@Service
public class StatusService {

  private final LoanApplicationDao applicationDao;
  private final WorkItemDao workItemDao;
  private final AuditService audit;

  public StatusService(LoanApplicationDao applicationDao, WorkItemDao workItemDao, AuditService audit) {
    this.applicationDao = applicationDao;
    this.workItemDao = workItemDao;
    this.audit = audit;
  }

  public void updateStatus(long applicationId, ApplicationStatus status, String reason) {
    applicationDao.updateStatus(applicationId, status, reason);
  }

  /** Notifies the customer; when a status is given the application moves to it (reason = the message). */
  public void notifyCustomer(long applicationId, String title, String message, ApplicationStatus status) {
    if (status != null) {
      applicationDao.updateStatus(applicationId, status, message);
    }
    audit.notifyCustomer(applicationId, title, message);
  }

  /**
   * The single place where an application is stopped (rejected in UC01, declined in UC02/UC03, offer expired):
   * final status, reason for the customer, open tasks cancelled.
   */
  public void closeApplication(long applicationId, ApplicationStatus status, String reason) {
    workItemDao.cancelOpen(applicationId);
    applicationDao.updateStatus(applicationId, status, reason);
    String title = switch (status) {
      case REJECTED -> "Your application was not accepted";
      case OFFER_EXPIRED -> "Your loan offer has expired";
      default -> "Your loan application was declined";
    };
    audit.notifyCustomer(applicationId, title, "Reason: " + reason + ". You can contact us to discuss this or apply again.");
    audit.log(applicationId, "APPLICATION_CLOSED", status + " - " + reason, AuditService.SYSTEM);
  }
}
