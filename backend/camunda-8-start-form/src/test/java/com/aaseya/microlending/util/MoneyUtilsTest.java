package com.aaseya.microlending.util;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;

import org.junit.jupiter.api.Test;

class MoneyUtilsTest {

  @Test
  void roundsHalfUpToTwoDecimals() {
    assertThat(MoneyUtils.round2(10.005)).isEqualTo(10.01);
    assertThat(MoneyUtils.round2(10.004)).isEqualTo(10.0);
    assertThat(MoneyUtils.money(3.14159)).isEqualByComparingTo(new BigDecimal("3.14"));
    assertThat(MoneyUtils.money(2).scale()).isEqualTo(2);
  }

  @Test
  void nullBigDecimalIsZero() {
    assertThat(MoneyUtils.toDouble(null)).isZero();
    assertThat(MoneyUtils.toDouble(new BigDecimal("12.50"))).isEqualTo(12.5);
  }

  @Test
  void monthlyRepaymentOfAmortisingLoan() {
    // 3000 over 12 months at 12% p.a. (1% per month) = 266.55
    assertThat(MoneyUtils.monthlyRepayment(3000, 12.0, 12)).isEqualTo(266.55);
  }

  @Test
  void zeroInterestSplitsPrincipalEvenly() {
    assertThat(MoneyUtils.monthlyRepayment(1200, 0, 12)).isEqualTo(100.0);
  }

  @Test
  void missingTermFallsBackToTwelveMonths() {
    assertThat(MoneyUtils.monthlyRepayment(3000, 12.0, 0))
        .isEqualTo(MoneyUtils.monthlyRepayment(3000, 12.0, 12));
  }
}
