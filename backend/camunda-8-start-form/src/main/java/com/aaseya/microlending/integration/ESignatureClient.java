package com.aaseya.microlending.integration;

import java.util.UUID;

import org.springframework.stereotype.Component;

import com.aaseya.microlending.config.DemoSwitches;
import com.aaseya.microlending.exception.ServiceUnavailableException;

/** SIMULATED e-signature provider (UC03). Demo switch "esignDown" makes it unavailable. */
@Component
public class ESignatureClient {

  private final DemoSwitches switches;

  public ESignatureClient(DemoSwitches switches) {
    this.switches = switches;
  }

  /** Sends the agreement for signing and returns the envelope id. */
  public String sendAgreement(long applicationId) {
    if (switches.isOn(DemoSwitches.ESIGN_DOWN)) {
      throw new ServiceUnavailableException("E-signature service is not responding (HTTP 503)");
    }
    return "ENV-" + applicationId + "-" + UUID.randomUUID().toString().substring(0, 8);
  }
}
