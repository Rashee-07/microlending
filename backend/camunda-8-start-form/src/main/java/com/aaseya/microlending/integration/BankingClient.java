package com.aaseya.microlending.integration;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import com.aaseya.microlending.config.DemoProperties;
import com.aaseya.microlending.config.DemoSwitches;
import com.aaseya.microlending.constants.ProcessConstants;
import com.aaseya.microlending.service.ProcessService;

/**
 * SIMULATED bank / payment gateway (UC03 payout, UC04 direct debit). Like a real bank it answers
 * asynchronously: a few seconds later it publishes a Camunda message with the result.
 *
 * Demo triggers: switch "bankTransferFails" = payout rejected; account ending 00 = incorrect account details;
 * account ending 99 or switch "insufficientFunds" = insufficient funds.
 */
@Component
public class BankingClient {

  private static final Logger LOG = LoggerFactory.getLogger(BankingClient.class);

  private final ProcessService processService;
  private final DemoSwitches switches;
  private final DemoProperties properties;
  private final ScheduledExecutorService callbacks = Executors.newScheduledThreadPool(2);

  public BankingClient(ProcessService processService, DemoSwitches switches, DemoProperties properties) {
    this.processService = processService;
    this.switches = switches;
    this.properties = properties;
  }

  /** Requests the payout. Returns false when the bank rejects it; otherwise confirms later. */
  public boolean transfer(long applicationId, String reference) {
    if (switches.isOn(DemoSwitches.TRANSFER_FAILS)) {
      return false;
    }
    later(() -> processService.publishMessage(ProcessConstants.MSG_DISBURSEMENT_CONFIRMED, applicationId,
        Map.of("bankReference", reference)));
    return true;
  }

  /** Starts a direct debit; the result arrives later as message "payment-result". */
  public void directDebit(long applicationId, String accountNumber, double amount) {
    String status = "SUCCESS";
    String reason = "";
    String account = accountNumber == null ? "" : accountNumber.trim();
    if (account.isEmpty() || account.endsWith("00")) {
      status = "FAILED";
      reason = "INCORRECT_ACCOUNT";
    } else if (account.endsWith("99") || switches.isOn(DemoSwitches.INSUFFICIENT_FUNDS)) {
      status = "FAILED";
      reason = "INSUFFICIENT_FUNDS";
    }
    Map<String, Object> result = Map.of("paymentStatus", status, "failureReason", reason,
        "paymentReference", "DD-" + UUID.randomUUID().toString().substring(0, 8));
    later(() -> processService.publishMessage(ProcessConstants.MSG_PAYMENT_RESULT, applicationId, result));
  }

  private void later(Runnable callback) {
    callbacks.schedule(() -> {
      try {
        callback.run();
      } catch (Exception e) {
        LOG.error("Simulated bank callback failed", e);
      }
    }, properties.bank().callbackDelayMs(), TimeUnit.MILLISECONDS);
  }
}
