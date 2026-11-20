package com.aaseya.microlending.dto.process;

/** A duplicate also sets closeStatus / closeReason. */
public record DuplicateCheckResult(boolean duplicateFound, String closeStatus, String closeReason) {
}
