package com.aaseya.microlending.service;

import org.springframework.stereotype.Service;

import com.aaseya.microlending.dao.EventLogDao;
import com.aaseya.microlending.dao.NotificationDao;

/** Audit trail (event_log) and in-app customer notifications. */
@Service
public class AuditService {

  public static final String SYSTEM = "system";

  private final EventLogDao eventLogDao;
  private final NotificationDao notificationDao;

  public AuditService(EventLogDao eventLogDao, NotificationDao notificationDao) {
    this.eventLogDao = eventLogDao;
    this.notificationDao = notificationDao;
  }

  /** Records an event. actor = username, external system name or "system". */
  public void log(long applicationId, String eventType, String description, String actor) {
    eventLogDao.create(applicationId, eventType, description, actor == null ? SYSTEM : actor);
  }

  /** Sends an in-app notification to the customer (stands in for email / SMS) and logs it. */
  public void notifyCustomer(long applicationId, String title, String message) {
    notificationDao.create(applicationId, title, message);
    log(applicationId, "NOTIFICATION", title + ": " + message, SYSTEM);
  }
}
