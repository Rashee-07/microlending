package com.aaseya.microlending.config;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;

import com.aaseya.microlending.exception.BusinessException;

/** Live "failure switches" the presenter flips from the demo panel to show exception paths. */
@Component
public class DemoSwitches {

  public static final String ESIGN_DOWN = "esignDown";
  public static final String TRANSFER_FAILS = "bankTransferFails";
  public static final String INSUFFICIENT_FUNDS = "insufficientFunds";

  private final Map<String, Boolean> switches = new ConcurrentHashMap<>(Map.of(
      ESIGN_DOWN, false,
      TRANSFER_FAILS, false,
      INSUFFICIENT_FUNDS, false));

  public boolean isOn(String name) {
    return switches.getOrDefault(name, false);
  }

  public Map<String, Boolean> all() {
    return new LinkedHashMap<>(switches);
  }

  public void set(String name, boolean on) {
    if (!switches.containsKey(name)) {
      throw new BusinessException("Unknown demo switch '" + name + "'. Known: " + switches.keySet());
    }
    switches.put(name, on);
  }
}
