package com.aaseya.microlending.dao;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import com.aaseya.microlending.model.Repayment;
import com.aaseya.microlending.model.enums.RepaymentStatus;

/** Table repayment (the repayment schedule). */
@Repository
public class RepaymentDao extends BaseDao<Repayment> {

  public RepaymentDao(JdbcTemplate jdbc) {
    super(jdbc, Repayment.class);
  }

  /** Replaces the schedule: one instalment per month starting at firstDue. */
  public void createSchedule(long applicationId, int term, BigDecimal amount, LocalDate firstDue) {
    jdbc.update("DELETE FROM repayment WHERE application_id = ?", applicationId);
    for (int i = 1; i <= term; i++) {
      jdbc.update("INSERT INTO repayment (application_id, instalment_no, due_date, amount, status) VALUES (?,?,?,?,?)",
          applicationId, i, firstDue.plusMonths(i - 1), amount, RepaymentStatus.SCHEDULED.name());
    }
  }

  public Optional<Repayment> findById(long id) {
    return findOne("SELECT * FROM repayment WHERE id = ?", id);
  }

  /** Next instalment that still has to be collected. */
  public Optional<Repayment> findNextUnpaid(long applicationId) {
    return findOne("SELECT * FROM repayment WHERE application_id = ? AND status <> 'PAID'"
        + " ORDER BY instalment_no LIMIT 1", applicationId);
  }

  public List<Repayment> findByApplication(long applicationId) {
    return findAll("SELECT * FROM repayment WHERE application_id = ? ORDER BY instalment_no", applicationId);
  }

  public int incrementAttempts(long id) {
    jdbc.update("UPDATE repayment SET attempts = attempts + 1 WHERE id = ?", id);
    return jdbc.queryForObject("SELECT attempts FROM repayment WHERE id = ?", Integer.class, id);
  }

  public void updateStatus(long id, RepaymentStatus status, String failureReason) {
    jdbc.update("UPDATE repayment SET status = ?, last_failure_reason = ?,"
        + " paid_at = CASE WHEN ? = 'PAID' THEN now() ELSE paid_at END WHERE id = ?",
        status.name(), failureReason, status.name(), id);
  }

  /** Moves every unpaid instalment to the given day of the month (max 28). */
  public int changeDueDay(long applicationId, int day) {
    return jdbc.update("UPDATE repayment SET due_date = make_date(CAST(extract(year FROM due_date) AS int),"
        + " CAST(extract(month FROM due_date) AS int), LEAST(?, 28)) WHERE application_id = ? AND status <> 'PAID'",
        day, applicationId);
  }
}
