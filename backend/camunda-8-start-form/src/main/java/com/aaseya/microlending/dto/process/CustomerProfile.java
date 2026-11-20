package com.aaseya.microlending.dto.process;

/** UC02 input: the customer, the loan and the verified employment / income. */
public record CustomerProfile(
    String firstName,
    String lastName,
    String email,
    String employmentStatus,
    String employerName,
    double loanAmount,
    int termMonths,
    double monthlyIncome,
    double monthlyExpenses,
    double monthlyLiabilities,
    boolean incomeDocumentsProvided,
    boolean employmentVerified,
    double verifiedIncome) {
}
