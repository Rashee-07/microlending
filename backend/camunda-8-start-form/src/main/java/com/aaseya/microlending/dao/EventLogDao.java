package com.aaseya.microlending.dao;

import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import com.aaseya.microlending.model.EventLog;

/** Table event_log (audit trail). */
@Repository
public class EventLogDao extends BaseDao<EventLog> {

  public EventLogDao(JdbcTemplate jdbc) {
    super(jdbc, EventLog.class);
  }

  public void create(long applicationId, String eventType, String description, String actor) {
    jdbc.update("INSERT INTO event_log (application_id, event_type, description, actor) VALUES (?,?,?,?)",
        applicationId, eventType, description, actor);
  }

  public List<EventLog> findByApplication(long applicationId) {
    return findAll("SELECT * FROM event_log WHERE application_id = ? ORDER BY id", applicationId);
  }
}
