package com.aaseya.microlending.exception;

/** The task was already completed or cancelled by the process (HTTP 409). */
public class TaskNotActiveException extends RuntimeException {
  public TaskNotActiveException(String message) {
    super(message);
  }
}
