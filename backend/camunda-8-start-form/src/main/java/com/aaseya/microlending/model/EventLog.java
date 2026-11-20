package com.aaseya.microlending.model;

import java.time.LocalDateTime;

/** Row of table event_log: audit trail of every interaction, decision and payment event. */
public record EventLog(
    Long id,
    Long applicationId,
    String eventType,
    String description,
    String actor,
    LocalDateTime createdAt) {
}
