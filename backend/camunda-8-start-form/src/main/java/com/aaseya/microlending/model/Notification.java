package com.aaseya.microlending.model;

import java.time.LocalDateTime;

/** Row of table notification: in-app message to the customer (stands in for email / SMS). */
public record Notification(
    Long id,
    Long applicationId,
    String username,
    String title,
    String message,
    LocalDateTime createdAt) {
}
