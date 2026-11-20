package com.aaseya.microlending.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.aaseya.microlending.model.enums.DisbursementStatus;

/** Row of table disbursement (one per application, so duplicate payouts are impossible). */
public record Disbursement(
    Long id,
    Long applicationId,
    BigDecimal amount,
    String bankReference,
    DisbursementStatus status,
    LocalDateTime createdAt) {
}
