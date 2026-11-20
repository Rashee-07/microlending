package com.aaseya.microlending.exception;

/** An external system (e.g. the e-signature provider) is not responding. */
public class ServiceUnavailableException extends RuntimeException {
  public ServiceUnavailableException(String message) {
    super(message);
  }
}
