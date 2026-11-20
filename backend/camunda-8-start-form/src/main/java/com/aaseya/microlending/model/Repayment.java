package com.aaseya.microlending.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import com.aaseya.microlending.model.enums.RepaymentStatus;

/** Row of table repayment: one instalment of the schedule (UC04). */
public record Repayment(
    Long id,
    Long applicationId,
    Integer instalmentNo,
    LocalDate dueDate,
    BigDecimal amount,
    RepaymentStatus status,
    Integer attempts,
    String lastFailureReason,
    LocalDateTime paidAt) {
}
