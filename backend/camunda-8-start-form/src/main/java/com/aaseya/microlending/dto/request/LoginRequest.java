package com.aaseya.microlending.dto.request;

/** Username and password, checked against Keycloak. */
public record LoginRequest(String username, String password) {
}
