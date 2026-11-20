package com.aaseya.microlending.dto.process;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/** Process variables needed for the affordability calculation (read from the job). */
@JsonIgnoreProperties(ignoreUnknown = true)
public record AffordabilityInput(
    double verifiedIncome,
    double monthlyIncome,
    double monthlyExpenses,
    double recurringExpenses,
    double monthlyLiabilities,
    double loanAmount,
    int termMonths,
    boolean employmentVerified,
    boolean incomeDocumentsProvided) {
}
