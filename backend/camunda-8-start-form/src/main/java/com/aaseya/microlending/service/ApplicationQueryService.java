package com.aaseya.microlending.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.aaseya.microlending.dao.CreditAssessmentDao;
import com.aaseya.microlending.dao.CustomerDao;
import com.aaseya.microlending.dao.DisbursementDao;
import com.aaseya.microlending.dao.DocumentDao;
import com.aaseya.microlending.dao.EventLogDao;
import com.aaseya.microlending.dao.LoanAccountDao;
import com.aaseya.microlending.dao.LoanApplicationDao;
import com.aaseya.microlending.dao.NotificationDao;
import com.aaseya.microlending.dao.RepaymentDao;
import com.aaseya.microlending.dao.WorkItemDao;
import com.aaseya.microlending.dto.response.ApplicationDetailResponse;
import com.aaseya.microlending.dto.response.ApplicationSummary;
import com.aaseya.microlending.exception.NotFoundException;
import com.aaseya.microlending.model.LoanApplication;
import com.aaseya.microlending.model.Notification;

/** Read-only views for the screens. */
@Service
public class ApplicationQueryService {

  private final LoanApplicationDao applicationDao;
  private final CustomerDao customerDao;
  private final DocumentDao documentDao;
  private final CreditAssessmentDao assessmentDao;
  private final LoanAccountDao loanAccountDao;
  private final DisbursementDao disbursementDao;
  private final RepaymentDao repaymentDao;
  private final WorkItemDao workItemDao;
  private final NotificationDao notificationDao;
  private final EventLogDao eventLogDao;

  public ApplicationQueryService(LoanApplicationDao applicationDao, CustomerDao customerDao, DocumentDao documentDao,
      CreditAssessmentDao assessmentDao, LoanAccountDao loanAccountDao, DisbursementDao disbursementDao,
      RepaymentDao repaymentDao, WorkItemDao workItemDao, NotificationDao notificationDao, EventLogDao eventLogDao) {
    this.applicationDao = applicationDao;
    this.customerDao = customerDao;
    this.documentDao = documentDao;
    this.assessmentDao = assessmentDao;
    this.loanAccountDao = loanAccountDao;
    this.disbursementDao = disbursementDao;
    this.repaymentDao = repaymentDao;
    this.workItemDao = workItemDao;
    this.notificationDao = notificationDao;
    this.eventLogDao = eventLogDao;
  }

  /** All applications, or only one customer's. */
  public List<ApplicationSummary> list(String username) {
    return applicationDao.findSummaries(username);
  }

  public ApplicationDetailResponse detail(long id) {
    LoanApplication app = applicationDao.findById(id)
        .orElseThrow(() -> new NotFoundException("Application " + id + " not found"));
    return new ApplicationDetailResponse(
        app,
        customerDao.findById(app.customerId()).orElse(null),
        documentDao.findByApplication(id),
        assessmentDao.findLatest(id).orElse(null),
        loanAccountDao.findByApplication(id).orElse(null),
        disbursementDao.findByApplication(id).orElse(null),
        repaymentDao.findByApplication(id),
        workItemDao.findOpenByApplication(id),
        notificationDao.findByApplication(id),
        eventLogDao.findByApplication(id));
  }

  public List<Notification> notifications(String username) {
    return notificationDao.findByUsername(username);
  }
}
