package com.aaseya.microlending.dto.process;

/** validationStatus = COMPLETE or MISSING_INFORMATION; missingItems is shown to the customer. */
public record ValidationResult(String validationStatus, String missingItems) {
}
