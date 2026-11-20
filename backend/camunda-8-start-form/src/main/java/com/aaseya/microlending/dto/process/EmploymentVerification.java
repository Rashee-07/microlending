package com.aaseya.microlending.dto.process;

/** Result of the (simulated) employment and income verification. */
public record EmploymentVerification(boolean employmentVerified, double verifiedIncome) {
}
