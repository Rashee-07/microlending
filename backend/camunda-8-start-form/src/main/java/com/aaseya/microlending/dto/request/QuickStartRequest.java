package com.aaseya.microlending.dto.request;

import java.util.Map;

/** Demo: start UC02/UC03/UC04 directly with a sample application; data overrides sample fields. */
public record QuickStartRequest(String useCase, String username, Map<String, Object> data) {
}
