package com.aaseya.microlending.dto.process;

/** A DECLINE outcome also sets closeStatus / closeReason. */
public record AssessmentRecorded(String riskCategory, String closeStatus, String closeReason) {
}
