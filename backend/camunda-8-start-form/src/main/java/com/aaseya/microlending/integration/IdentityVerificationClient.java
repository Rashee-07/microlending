package com.aaseya.microlending.integration;

import java.time.LocalDate;

import org.springframework.stereotype.Component;

import com.aaseya.microlending.model.ApplicationDocument;
import com.aaseya.microlending.model.enums.VerificationStatus;

/**
 * SIMULATED identity provider (UC01). Demo triggers (docs/DEMO-TRIGGERS-RELEASE-1.md):
 * expiry in the past or number shorter than 6 characters = EXPIRED (invalid document, re-upload),
 * number ending in 000 = FAILED (person could not be matched).
 */
@Component
public class IdentityVerificationClient {

  public VerificationStatus verify(ApplicationDocument document) {
    if (document == null) {
      return VerificationStatus.FAILED;
    }
    String number = document.docNumber();
    if (document.expiryDate() == null || document.expiryDate().isBefore(LocalDate.now())) {
      return VerificationStatus.EXPIRED;
    }
    if (number == null || number.length() < 6) {
      return VerificationStatus.EXPIRED;
    }
    if (number.endsWith("000")) {
      return VerificationStatus.FAILED;
    }
    return VerificationStatus.VERIFIED;
  }
}
