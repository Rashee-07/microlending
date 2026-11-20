package com.aaseya.microlending.controller;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.aaseya.microlending.dto.request.LoginRequest;
import com.aaseya.microlending.dto.response.LoginResponse;
import com.aaseya.microlending.service.AuthService;

/** POST /login - checks the credentials with Keycloak and returns the user's role. */
@RestController
public class AuthController {

  private final AuthService authService;

  public AuthController(AuthService authService) {
    this.authService = authService;
  }

  @PostMapping("/login")
  public LoginResponse login(@RequestBody LoginRequest request) {
    return authService.login(request);
  }
}
