package com.aaseya.microlending.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** Row of table credit_assessment (UC02 result). */
public record CreditAssessment(
    Long id,
    Long applicationId,
    Boolean employmentVerified,
    BigDecimal verifiedIncome,
    Integer creditScore,
    Integer bureauDefaults,
    String fraudRisk,
    BigDecimal recurringExpenses,
    BigDecimal disposableIncome,
    BigDecimal monthlyRepayment,
    BigDecimal dti,
    BigDecimal surplus,
    String riskCategory,
    String outcome,
    String reason,
    LocalDateTime createdAt) {
}
