package com.aaseya.microlending.exception;

/** The user may not perform this action (HTTP 403). */
public class AccessDeniedException extends RuntimeException {
  public AccessDeniedException(String message) {
    super(message);
  }
}
