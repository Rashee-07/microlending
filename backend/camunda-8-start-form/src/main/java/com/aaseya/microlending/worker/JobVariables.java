package com.aaseya.microlending.worker;

import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import com.aaseya.microlending.constants.ProcessConstants;

import io.camunda.zeebe.client.api.response.ActivatedJob;

/** Typed access to the variables and headers of an activated Zeebe job. */
final class JobVariables {

  private static final Pattern PLACEHOLDER = Pattern.compile("\\{(\\w+)}");

  private final ActivatedJob job;
  private final Map<String, Object> vars;

  private JobVariables(ActivatedJob job) {
    this.job = job;
    this.vars = job.getVariablesAsMap();
  }

  static JobVariables of(ActivatedJob job) {
    return new JobVariables(job);
  }

  long applicationId() {
    return Long.parseLong(String.valueOf(vars.get(ProcessConstants.VAR_APPLICATION_ID)));
  }

  String string(String name) {
    Object v = vars.get(name);
    return v == null ? null : v.toString();
  }

  double number(String name) {
    Object v = vars.get(name);
    return v == null ? 0 : ((Number) v).doubleValue();
  }

  int integer(String name) {
    Object v = vars.get(name);
    return v == null ? 0 : ((Number) v).intValue();
  }

  long longValue(String name) {
    return ((Number) vars.get(name)).longValue();
  }

  boolean bool(String name) {
    return Boolean.TRUE.equals(vars.get(name));
  }

  Map<String, Object> all() {
    return vars;
  }

  String header(String name) {
    return job.getCustomHeaders().get(name);
  }

  /** Replaces {variable} placeholders in a header text with variable values. */
  String fill(String template) {
    Matcher m = PLACEHOLDER.matcher(template == null ? "" : template);
    StringBuilder sb = new StringBuilder();
    while (m.find()) {
      Object v = vars.get(m.group(1));
      m.appendReplacement(sb, Matcher.quoteReplacement(v == null ? "" : v.toString()));
    }
    m.appendTail(sb);
    return sb.toString();
  }
}
