package com.aaseya.microlending.service;

import java.util.Set;

import org.springframework.stereotype.Service;

import com.aaseya.microlending.dao.UserDao;
import com.aaseya.microlending.dto.request.LoginRequest;
import com.aaseya.microlending.dto.response.LoginResponse;
import com.aaseya.microlending.exception.AccessDeniedException;
import com.aaseya.microlending.exception.BusinessException;
import com.aaseya.microlending.integration.KeycloakClient;
import com.fasterxml.jackson.databind.JsonNode;

/** Login: Keycloak checks the password, the realm role decides which screens the user gets. */
@Service
public class AuthService {

  private static final Set<String> APP_ROLES = Set.of("USER", "REVIEWER", "MANAGER");

  private final KeycloakClient keycloak;
  private final UserDao userDao;

  public AuthService(KeycloakClient keycloak, UserDao userDao) {
    this.keycloak = keycloak;
    this.userDao = userDao;
  }

  public LoginResponse login(LoginRequest request) {
    if (request.username() == null || request.password() == null) {
      throw new BusinessException("username and password are required");
    }
    JsonNode claims = keycloak.login(request.username(), request.password());
    String role = null;
    for (JsonNode r : claims.path("realm_access").path("roles")) {
      if (APP_ROLES.contains(r.asText())) {
        role = r.asText();
        break;
      }
    }
    if (role == null) {
      throw new AccessDeniedException("User has no MicroLending role");
    }
    userDao.createIfMissing(request.username(), role);
    userDao.recordLogin(request.username(), role);
    String name = claims.path("name").asText();
    return new LoginResponse(request.username(), role, name.isBlank() ? request.username() : name);
  }
}
