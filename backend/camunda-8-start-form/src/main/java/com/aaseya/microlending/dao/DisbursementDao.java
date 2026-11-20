package com.aaseya.microlending.dao;

import java.math.BigDecimal;
import java.util.Optional;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import com.aaseya.microlending.model.Disbursement;
import com.aaseya.microlending.model.enums.DisbursementStatus;

/** Table disbursement (unique per application). */
@Repository
public class DisbursementDao extends BaseDao<Disbursement> {

  public DisbursementDao(JdbcTemplate jdbc) {
    super(jdbc, Disbursement.class);
  }

  /**
   * Records a new transfer. Returns false when a transfer for this application already exists and has not
   * failed - the request is a duplicate and must not be paid out again.
   */
  public boolean tryStart(long applicationId, BigDecimal amount, String reference) {
    int rows = jdbc.update("INSERT INTO disbursement (application_id, amount, bank_reference, status)"
        + " VALUES (?, ?, ?, 'INITIATED') ON CONFLICT (application_id) DO UPDATE"
        + " SET bank_reference = EXCLUDED.bank_reference, status = 'INITIATED', created_at = now()"
        + " WHERE disbursement.status = 'FAILED'", applicationId, amount, reference);
    return rows > 0;
  }

  public Optional<Disbursement> findByApplication(long applicationId) {
    return findOne("SELECT * FROM disbursement WHERE application_id = ?", applicationId);
  }

  public void updateStatus(long applicationId, DisbursementStatus status) {
    jdbc.update("UPDATE disbursement SET status = ? WHERE application_id = ?", status.name(), applicationId);
  }
}
