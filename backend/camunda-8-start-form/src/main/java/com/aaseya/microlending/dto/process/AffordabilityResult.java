package com.aaseya.microlending.dto.process;

/** Inputs for the DMN credit-decision. dti = (liabilities + new repayment) / verified income. */
public record AffordabilityResult(double monthlyRepayment, double disposableIncome, double surplus, double dti,
    boolean infoComplete) {
}
