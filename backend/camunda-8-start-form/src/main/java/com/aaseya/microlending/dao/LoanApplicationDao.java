package com.aaseya.microlending.dao;

import java.util.List;
import java.util.Optional;

import org.springframework.jdbc.core.DataClassRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import com.aaseya.microlending.dto.form.FinancialDetailsForm;
import com.aaseya.microlending.dto.response.ApplicationSummary;
import com.aaseya.microlending.model.LoanApplication;
import com.aaseya.microlending.model.enums.ApplicationStatus;

/** Table application. */
@Repository
public class LoanApplicationDao extends BaseDao<LoanApplication> {

  /** Statuses after which an application no longer counts as active (duplicate check). */
  private static final String CLOSED_STATUSES =
      "('REJECTED','EXPIRED','DECLINED','OFFER_EXPIRED','CLOSED','DEFAULTED')";

  private static final String SUMMARY_SQL = "SELECT a.id, a.username, c.first_name, c.last_name, c.email,"
      + " a.loan_amount, a.loan_purpose, a.status, a.status_reason, a.process_instance_key, a.created_at, a.updated_at"
      + " FROM application a JOIN customer c ON c.id = a.customer_id";

  private final DataClassRowMapper<ApplicationSummary> summaryMapper = new DataClassRowMapper<>(ApplicationSummary.class);

  public LoanApplicationDao(JdbcTemplate jdbc) {
    super(jdbc, LoanApplication.class);
  }

  public long create(long customerId, String username) {
    return insert("INSERT INTO application (customer_id, username, status) VALUES (?, ?, ?)",
        customerId, username, ApplicationStatus.IN_PROGRESS.name());
  }

  public Optional<LoanApplication> findById(long id) {
    return findOne("SELECT * FROM application WHERE id = ?", id);
  }

  public List<ApplicationSummary> findSummaries(String username) {
    return username == null
        ? jdbc.query(SUMMARY_SQL + " ORDER BY a.id DESC", summaryMapper)
        : jdbc.query(SUMMARY_SQL + " WHERE a.username = ? ORDER BY a.id DESC", summaryMapper, username);
  }

  public void updateStatus(long id, ApplicationStatus status, String reason) {
    jdbc.update("UPDATE application SET status = ?, status_reason = ?, updated_at = now() WHERE id = ?",
        status.name(), reason, id);
  }

  public void updateProcessInstance(long id, long processInstanceKey) {
    jdbc.update("UPDATE application SET process_instance_key = ?, updated_at = now() WHERE id = ?",
        processInstanceKey, id);
  }

  public void updateFinancials(long id, FinancialDetailsForm f) {
    jdbc.update("UPDATE application SET loan_amount = ?, loan_purpose = ?, term_months = COALESCE(?, term_months),"
        + " monthly_income = ?, monthly_expenses = ?, monthly_liabilities = ?, bank_account_number = ?,"
        + " updated_at = now() WHERE id = ?",
        f.loanAmount(), f.loanPurpose(), f.termMonths(), f.monthlyIncome(), f.monthlyExpenses(),
        f.monthlyLiabilities(), f.bankAccountNumber(), id);
  }

  public void updateBankAccount(long id, String accountNumber) {
    jdbc.update("UPDATE application SET bank_account_number = ?, updated_at = now() WHERE id = ?", accountNumber, id);
  }

  /** Ids of other active applications of the same person (same email, mobile or identity document number). */
  public List<Long> findActiveDuplicates(long id) {
    return jdbc.queryForList(
        "SELECT DISTINCT a2.id FROM application a"
            + " JOIN customer c ON c.id = a.customer_id"
            + " JOIN application a2 ON a2.id <> a.id AND a2.status NOT IN " + CLOSED_STATUSES
            + " JOIN customer c2 ON c2.id = a2.customer_id"
            + " LEFT JOIN application_document d ON d.application_id = a.id AND d.doc_type IN ('PASSPORT','DRIVERS_LICENCE')"
            + " LEFT JOIN application_document d2 ON d2.application_id = a2.id AND d2.doc_type IN ('PASSPORT','DRIVERS_LICENCE')"
            + " WHERE a.id = ? AND (lower(c2.email) = lower(c.email) OR c2.mobile = c.mobile"
            + "   OR (d.doc_number IS NOT NULL AND d2.doc_number = d.doc_number))",
        Long.class, id);
  }
}
