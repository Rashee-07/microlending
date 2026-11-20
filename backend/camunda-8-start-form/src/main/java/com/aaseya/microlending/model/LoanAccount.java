package com.aaseya.microlending.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.aaseya.microlending.model.enums.AgreementStatus;
import com.aaseya.microlending.model.enums.LoanStatus;

/** Row of table loan_account (UC03 offer / UC04 balance). */
public record LoanAccount(
    Long id,
    Long applicationId,
    String accountNumber,
    BigDecimal principal,
    BigDecimal interestRate,
    Integer termMonths,
    BigDecimal monthlyRepayment,
    BigDecimal outstandingBalance,
    AgreementStatus agreementStatus,
    LoanStatus status,
    LocalDateTime createdAt) {
}
