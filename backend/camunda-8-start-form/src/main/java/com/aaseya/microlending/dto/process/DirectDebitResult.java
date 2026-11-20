package com.aaseya.microlending.dto.process;

/** attempts = how many times this instalment has been tried (compared with maxPaymentAttempts). */
public record DirectDebitResult(int attempts) {
}
