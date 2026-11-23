package com.aaseya.microlending.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.aaseya.microlending.model.enums.ApplicationStatus;

/** Row of table application: one loan application, followed through UC01 and UC02 (release 1). */
public record LoanApplication(
    Long id,
    Long customerId,
    String username,
    BigDecimal loanAmount,
    String loanPurpose,
    Integer termMonths,
    BigDecimal monthlyIncome,
    BigDecimal monthlyExpenses,
    BigDecimal monthlyLiabilities,
    String bankAccountNumber,
    ApplicationStatus status,
    String statusReason,
    Long processInstanceKey,
    LocalDateTime createdAt,
    LocalDateTime updatedAt) {
}
