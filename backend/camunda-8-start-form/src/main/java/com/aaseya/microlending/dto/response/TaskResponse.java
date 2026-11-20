package com.aaseya.microlending.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.aaseya.microlending.model.enums.ApplicationStatus;

/** An open task in a work queue, with the applicant it belongs to. */
public record TaskResponse(
    Long jobKey,
    String elementId,
    String name,
    Long applicationId,
    String assignee,
    String candidateGroup,
    LocalDateTime createdAt,
    String firstName,
    String lastName,
    BigDecimal loanAmount,
    String loanPurpose,
    ApplicationStatus applicationStatus) {
}
