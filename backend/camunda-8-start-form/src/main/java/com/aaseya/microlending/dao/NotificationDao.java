package com.aaseya.microlending.dao;

import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import com.aaseya.microlending.model.Notification;

/** Table notification. */
@Repository
public class NotificationDao extends BaseDao<Notification> {

  public NotificationDao(JdbcTemplate jdbc) {
    super(jdbc, Notification.class);
  }

  /** Notification for the customer who owns the application. */
  public void create(long applicationId, String title, String message) {
    jdbc.update("INSERT INTO notification (application_id, username, title, message)"
        + " SELECT id, username, ?, ? FROM application WHERE id = ?", title, message, applicationId);
  }

  public List<Notification> findByUsername(String username) {
    return findAll("SELECT * FROM notification WHERE username = ? ORDER BY id DESC LIMIT 50", username);
  }

  public List<Notification> findByApplication(long applicationId) {
    return findAll("SELECT * FROM notification WHERE application_id = ? ORDER BY id DESC", applicationId);
  }
}
