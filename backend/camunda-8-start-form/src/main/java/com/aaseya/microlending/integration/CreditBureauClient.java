package com.aaseya.microlending.integration;

import org.springframework.stereotype.Component;

import com.aaseya.microlending.dto.process.CreditReport;

/**
 * SIMULATED credit bureau (UC02). Last name "Fraud" = high fraud risk; last name "Risky" = score 480 with defaults;
 * everyone else gets a stable score between 680 and 799.
 */
@Component
public class CreditBureauClient {

  public CreditReport fetchReport(String lastName, String email) {
    String ln = lastName == null ? "" : lastName.trim().toLowerCase();
    String fraudRisk = ln.equals("fraud") ? "HIGH" : "LOW";
    if (ln.equals("risky")) {
      return new CreditReport(480, 2, fraudRisk);
    }
    int score = 680 + Math.abs((email == null ? "" : email).hashCode()) % 120;
    return new CreditReport(score, 0, fraudRisk);
  }
}
