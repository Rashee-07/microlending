package com.aaseya.microlending.dao;

import java.util.Optional;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import com.aaseya.microlending.model.CreditAssessment;

/** Table credit_assessment. */
@Repository
public class CreditAssessmentDao extends BaseDao<CreditAssessment> {

  public CreditAssessmentDao(JdbcTemplate jdbc) {
    super(jdbc, CreditAssessment.class);
  }

  public long create(CreditAssessment a) {
    return insert("INSERT INTO credit_assessment (application_id, employment_verified, verified_income, credit_score,"
        + " bureau_defaults, fraud_risk, recurring_expenses, disposable_income, monthly_repayment, dti, surplus,"
        + " risk_category, outcome, reason) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
        a.applicationId(), a.employmentVerified(), a.verifiedIncome(), a.creditScore(), a.bureauDefaults(),
        a.fraudRisk(), a.recurringExpenses(), a.disposableIncome(), a.monthlyRepayment(), a.dti(), a.surplus(),
        a.riskCategory(), a.outcome(), a.reason());
  }

  public Optional<CreditAssessment> findLatest(long applicationId) {
    return findOne("SELECT * FROM credit_assessment WHERE application_id = ? ORDER BY id DESC LIMIT 1", applicationId);
  }
}
