package com.aaseya.microlending.dto.process;

/** Output of the DMN credit-decision (variable creditDecision). outcome = APPROVE, REFER, DECLINE or FRAUD. */
public record CreditDecision(String outcome, String reason, String riskCategory) {
}
