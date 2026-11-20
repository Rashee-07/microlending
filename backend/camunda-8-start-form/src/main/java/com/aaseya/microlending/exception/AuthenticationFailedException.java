package com.aaseya.microlending.exception;

/** Wrong username or password (HTTP 401). */
public class AuthenticationFailedException extends RuntimeException {
  public AuthenticationFailedException(String message) {
    super(message);
  }
}
