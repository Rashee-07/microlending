package com.aaseya.microlending.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.aaseya.microlending.model.enums.ApplicationStatus;

/** One row of the application list. */
public record ApplicationSummary(
    Long id,
    String username,
    String firstName,
    String lastName,
    String email,
    BigDecimal loanAmount,
    String loanPurpose,
    ApplicationStatus status,
    String statusReason,
    Long processInstanceKey,
    LocalDateTime createdAt,
    LocalDateTime updatedAt) {
}
