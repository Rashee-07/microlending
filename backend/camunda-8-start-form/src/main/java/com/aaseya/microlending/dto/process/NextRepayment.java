package com.aaseya.microlending.dto.process;

/** UC04: the next instalment to collect (hasNextRepayment = false when the loan is fully repaid). */
public record NextRepayment(boolean hasNextRepayment, Long repaymentId, Integer instalmentNo, Double repaymentAmount,
    String dueDate, Integer attempts) {

  public static NextRepayment none() {
    return new NextRepayment(false, null, null, null, null, null);
  }
}
