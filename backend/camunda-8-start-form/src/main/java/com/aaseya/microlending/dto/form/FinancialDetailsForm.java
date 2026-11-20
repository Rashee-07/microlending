package com.aaseya.microlending.dto.form;

import java.math.BigDecimal;

import com.aaseya.microlending.model.enums.DocumentType;

/** UC01 task: income, expenses, liabilities and loan purpose (income document optional here). */
public record FinancialDetailsForm(
    BigDecimal loanAmount,
    String loanPurpose,
    Integer termMonths,
    BigDecimal monthlyIncome,
    BigDecimal monthlyExpenses,
    BigDecimal monthlyLiabilities,
    String bankAccountNumber,
    DocumentType incomeDocType,
    String incomeDocFileName) {
}
