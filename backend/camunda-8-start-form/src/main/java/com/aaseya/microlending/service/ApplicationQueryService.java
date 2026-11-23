package com.aaseya.microlending.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.aaseya.microlending.dao.CreditAssessmentDao;
import com.aaseya.microlending.dao.CustomerDao;
import com.aaseya.microlending.dao.DocumentDao;
import com.aaseya.microlending.dao.EventLogDao;
import com.aaseya.microlending.dao.LoanApplicationDao;
import com.aaseya.microlending.dao.NotificationDao;
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
  private final WorkItemDao workItemDao;
  private final NotificationDao notificationDao;
  private final EventLogDao eventLogDao;

  public ApplicationQueryService(LoanApplicationDao applicationDao, CustomerDao customerDao, DocumentDao documentDao,
      CreditAssessmentDao assessmentDao, WorkItemDao workItemDao, NotificationDao notificationDao, EventLogDao eventLogDao) {
    this.applicationDao = applicationDao;
    this.customerDao = customerDao;
    this.documentDao = documentDao;
    this.assessmentDao = assessmentDao;
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
        workItemDao.findOpenByApplication(id),
        notificationDao.findByApplication(id),
        eventLogDao.findByApplication(id));
  }

  public List<Notification> notifications(String username) {
    return notificationDao.findByUsername(username);
  }
}
