package com.aaseya.microlending.dto.request;

/** UC04: customer disputes a repayment. */
public record DisputeRequest(String username, String reason) {
}
