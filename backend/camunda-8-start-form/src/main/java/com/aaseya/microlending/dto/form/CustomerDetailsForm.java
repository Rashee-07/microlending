package com.aaseya.microlending.dto.form;

import java.math.BigDecimal;
import java.time.LocalDate;

/** UC01 task: capture personal, address and employment details. */
public record CustomerDetailsForm(
    String firstName,
    String lastName,
    LocalDate dateOfBirth,
    String addressLine,
    String suburb,
    String state,
    String postcode,
    String employmentStatus,
    String employerName,
    BigDecimal employmentYears) {
}
