package com.aaseya.microlending.dto.request;

import java.util.Map;

/** Completes a human task. The data map holds the form fields or the decision (becomes process variables). */
public record CompleteTaskRequest(String username, Map<String, Object> data) {
}
