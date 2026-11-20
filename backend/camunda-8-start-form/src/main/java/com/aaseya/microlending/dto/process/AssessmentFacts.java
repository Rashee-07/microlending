package com.aaseya.microlending.dto.process;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/** Everything UC02 collected, plus the DMN result - stored as the credit assessment record. */
@JsonIgnoreProperties(ignoreUnknown = true)
public record AssessmentFacts(
    boolean employmentVerified,
    double verifiedIncome,
    int creditScore,
    int bureauDefaults,
    String fraudRisk,
    double recurringExpenses,
    double disposableIncome,
    double monthlyRepayment,
    double dti,
    double surplus,
    CreditDecision creditDecision) {
}
