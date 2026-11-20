package com.aaseya.microlending.dto.request;

/** UC04: customer asks to move the repayment date to another day of the month. */
public record DateChangeRequest(String username, Integer newDueDay) {
}
