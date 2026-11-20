package com.aaseya.microlending.dto.process;

/** UC03 loan offer figures. */
public record LoanOffer(String loanAccountNumber, double monthlyRepayment, double interestRate, int termMonths) {
}
