package com.aaseya.microlending.integration;

import org.springframework.stereotype.Component;

import com.aaseya.microlending.dto.process.BankStatementAnalysis;
import com.aaseya.microlending.util.MoneyUtils;

/** SIMULATED bank statement analysis (UC02): finds recurring expenses slightly above what was declared. */
@Component
public class BankStatementClient {

  public BankStatementAnalysis analyse(double declaredMonthlyExpenses) {
    return new BankStatementAnalysis(MoneyUtils.round2(declaredMonthlyExpenses * 1.05));
  }
}
