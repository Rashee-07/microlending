package com.aaseya.microlending.dao;

import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

/** Demo test-data reset: finds the process instances of all applications and empties the lending tables. */
@Repository
public class DemoDataDao {

  /** Every lending table (user accounts are kept). */
  private static final String LENDING_TABLES = "repayment, loan_account, disbursement, credit_assessment,"
      + " application_document, work_item, notification, event_log, application, customer";

  private final JdbcTemplate jdbc;

  public DemoDataDao(JdbcTemplate jdbc) {
    this.jdbc = jdbc;
  }

  /** Process instances that may still be running: the application's own, plus any with an open task. */
  public List<Long> processInstanceKeys() {
    return jdbc.queryForList("SELECT process_instance_key FROM application WHERE process_instance_key IS NOT NULL"
        + " UNION SELECT process_instance_key FROM work_item WHERE status = 'OPEN' AND process_instance_key IS NOT NULL",
        Long.class);
  }

  public long countApplications() {
    Long n = jdbc.queryForObject("SELECT count(*) FROM application", Long.class);
    return n == null ? 0 : n;
  }

  /**
   * Empties all lending tables. Ids are NOT restarted: a late message for an old application id
   * (bank callbacks, 5 min TTL) must never reach a new application that happens to get the same id.
   */
  public void deleteAll() {
    jdbc.execute("TRUNCATE " + LENDING_TABLES + " CASCADE");
  }
}
