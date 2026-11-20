package com.aaseya.microlending.exception;

/** A request that breaks a business rule or has invalid input (HTTP 400). */
public class BusinessException extends RuntimeException {
  public BusinessException(String message) {
    super(message);
  }
}
