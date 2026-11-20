package com.aaseya.microlending.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/** Row of table customer (UC01: registration, personal, address and employment details). */
public record Customer(
    Long id,
    String username,
    String email,
    String mobile,
    String firstName,
    String lastName,
    LocalDate dateOfBirth,
    String addressLine,
    String suburb,
    String state,
    String postcode,
    String employmentStatus,
    String employerName,
    BigDecimal employmentYears,
    LocalDateTime createdAt) {

  public String fullName() {
    return ((firstName == null ? "" : firstName) + " " + (lastName == null ? "" : lastName)).trim();
  }
}
