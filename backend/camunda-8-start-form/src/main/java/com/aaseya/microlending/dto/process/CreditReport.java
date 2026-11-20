package com.aaseya.microlending.dto.process;

/** Result of the (simulated) credit bureau check. fraudRisk = LOW or HIGH. */
public record CreditReport(int creditScore, int bureauDefaults, String fraudRisk) {
}
