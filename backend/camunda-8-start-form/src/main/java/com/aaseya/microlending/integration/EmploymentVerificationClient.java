package com.aaseya.microlending.integration;

import org.springframework.stereotype.Component;

import com.aaseya.microlending.dto.process.EmploymentVerification;
import com.aaseya.microlending.util.MoneyUtils;

/**
 * SIMULATED employment & income verification (UC02).
 * UNEMPLOYED = no verified income; employer name containing "unknown" = only 60% of the income can be evidenced.
 */
@Component
public class EmploymentVerificationClient {

  public EmploymentVerification verify(String employmentStatus, String employerName, double declaredIncome) {
    if ("UNEMPLOYED".equalsIgnoreCase(employmentStatus)) {
      return new EmploymentVerification(false, 0);
    }
    if (employerName == null || employerName.toLowerCase().contains("unknown")) {
      return new EmploymentVerification(false, MoneyUtils.round2(declaredIncome * 0.6));
    }
    return new EmploymentVerification(true, declaredIncome);
  }
}
