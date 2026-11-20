package com.aaseya.microlending.config;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Demo timers and policy from application.properties ({@code demo.*}).
 * Timers are ISO-8601 durations, kept short so every path can be shown live.
 */
@ConfigurationProperties(prefix = "demo")
public record DemoProperties(Timers timers, Policy policy, Bank bank) {

  public record Timers(String resumeReminder, String abandonAfter, String signDeadline, String dueDateWait,
      String paymentRetry) {
  }

  /** maxPaymentAttempts: direct debits tried before collections. interestRate: % per year. */
  public record Policy(int maxPaymentAttempts, double interestRate) {
  }

  /** Delay before the simulated bank sends its asynchronous confirmation. */
  public record Bank(long callbackDelayMs) {
  }

  /** Timer and policy variables every process instance gets (used by BPMN timers and gateways). */
  public Map<String, Object> processVariables() {
    Map<String, Object> v = new LinkedHashMap<>();
    v.put("resumeReminderAfter", timers.resumeReminder());
    v.put("abandonAfter", timers.abandonAfter());
    v.put("signDeadline", timers.signDeadline());
    v.put("dueDateWait", timers.dueDateWait());
    v.put("paymentRetryDelay", timers.paymentRetry());
    v.put("maxPaymentAttempts", policy.maxPaymentAttempts());
    return v;
  }
}
