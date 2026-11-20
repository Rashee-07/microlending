package com.aaseya.microlending.util;

import java.math.BigDecimal;
import java.math.RoundingMode;

/** Money helpers (2 decimals, half-up). */
public final class MoneyUtils {

  private MoneyUtils() {
  }

  public static double round2(double v) {
    return BigDecimal.valueOf(v).setScale(2, RoundingMode.HALF_UP).doubleValue();
  }

  public static BigDecimal money(double v) {
    return BigDecimal.valueOf(v).setScale(2, RoundingMode.HALF_UP);
  }

  public static double toDouble(BigDecimal v) {
    return v == null ? 0 : v.doubleValue();
  }

  /** Monthly repayment of an amortising loan. annualRatePercent e.g. 12.0 = 12% p.a. */
  public static double monthlyRepayment(double principal, double annualRatePercent, int termMonths) {
    int n = termMonths <= 0 ? 12 : termMonths;
    double r = annualRatePercent / 100 / 12;
    if (r == 0) {
      return round2(principal / n);
    }
    return round2(principal * r / (1 - Math.pow(1 + r, -n)));
  }
}
