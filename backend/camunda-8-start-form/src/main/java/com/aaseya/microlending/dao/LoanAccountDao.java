package com.aaseya.microlending.dao;

import java.math.BigDecimal;
import java.util.Optional;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import com.aaseya.microlending.model.LoanAccount;
import com.aaseya.microlending.model.enums.AgreementStatus;
import com.aaseya.microlending.model.enums.LoanStatus;

/** Table loan_account (one per application). */
@Repository
public class LoanAccountDao extends BaseDao<LoanAccount> {

  public LoanAccountDao(JdbcTemplate jdbc) {
    super(jdbc, LoanAccount.class);
  }

  /** Creates (or regenerates) the loan offer; the account number is derived from the row id. */
  public LoanAccount createOffer(long applicationId, BigDecimal principal, BigDecimal rate, int term,
      BigDecimal monthlyRepayment, BigDecimal totalRepayable) {
    long id = insert("INSERT INTO loan_account (application_id, principal, interest_rate, term_months,"
        + " monthly_repayment, outstanding_balance, agreement_status, status) VALUES (?,?,?,?,?,?,?,?)"
        + " ON CONFLICT (application_id) DO UPDATE SET principal = EXCLUDED.principal,"
        + " interest_rate = EXCLUDED.interest_rate, term_months = EXCLUDED.term_months,"
        + " monthly_repayment = EXCLUDED.monthly_repayment, outstanding_balance = EXCLUDED.outstanding_balance,"
        + " agreement_status = EXCLUDED.agreement_status",
        applicationId, principal, rate, term, monthlyRepayment, totalRepayable,
        AgreementStatus.GENERATED.name(), LoanStatus.PENDING.name());
    jdbc.update("UPDATE loan_account SET account_number = ? WHERE id = ?", String.format("ML%08d", id), id);
    return findByApplication(applicationId).orElseThrow();
  }

  public Optional<LoanAccount> findByApplication(long applicationId) {
    return findOne("SELECT * FROM loan_account WHERE application_id = ?", applicationId);
  }

  public void updateAgreementStatus(long applicationId, AgreementStatus status) {
    jdbc.update("UPDATE loan_account SET agreement_status = ? WHERE application_id = ?", status.name(), applicationId);
  }

  public void updateStatus(long applicationId, LoanStatus status) {
    jdbc.update("UPDATE loan_account SET status = ? WHERE application_id = ?", status.name(), applicationId);
  }

  public void reduceBalance(long applicationId, BigDecimal amount) {
    jdbc.update("UPDATE loan_account SET outstanding_balance = GREATEST(outstanding_balance - ?, 0)"
        + " WHERE application_id = ?", amount, applicationId);
  }
}
