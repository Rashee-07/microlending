package com.aaseya.microlending.dto.response;

/** role = USER, REVIEWER or MANAGER (Keycloak realm role). */
public record LoginResponse(String username, String role, String name) {
}
