package com.aaseya.microlending.config;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Demo timers and policy from application.properties ({@code demo.*}).
 * Timers are ISO-8601 durations, kept short so every path can be shown live.
 */
@ConfigurationProperties(prefix = "demo")
public record DemoProperties(Timers timers, Policy policy) {

  public record Timers(String resumeReminder, String abandonAfter) {
  }

  /** interestRate: % per year, used for the repayment in the affordability calculation. */
  public record Policy(double interestRate) {
  }

  /** Timer variables every process instance gets (used by the BPMN timers). */
  public Map<String, Object> processVariables() {
    Map<String, Object> v = new LinkedHashMap<>();
    v.put("resumeReminderAfter", timers.resumeReminder());
    v.put("abandonAfter", timers.abandonAfter());
    return v;
  }
}
