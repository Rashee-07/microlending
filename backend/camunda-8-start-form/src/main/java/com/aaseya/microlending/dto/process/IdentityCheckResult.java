package com.aaseya.microlending.dto.process;

/** idStatus = VERIFIED, EXPIRED or FAILED. A FAILED check also sets closeStatus / closeReason. */
public record IdentityCheckResult(String idStatus, String closeStatus, String closeReason) {
}
