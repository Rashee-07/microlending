package com.aaseya.microlending.dto.process;

/** Process variables that stop the application: the next gateway routes to "close application". */
public record CloseDecision(String closeStatus, String closeReason) {

  /** Nothing to close - the application continues. */
  public static CloseDecision none() {
    return new CloseDecision("", "");
  }
}
