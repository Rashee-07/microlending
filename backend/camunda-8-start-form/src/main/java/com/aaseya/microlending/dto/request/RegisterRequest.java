package com.aaseya.microlending.dto.request;

/** UC01: customer registers with email and mobile number. */
public record RegisterRequest(String username, String email, String mobile) {
}
