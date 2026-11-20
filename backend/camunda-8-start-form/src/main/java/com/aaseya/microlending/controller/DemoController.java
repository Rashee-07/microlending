package com.aaseya.microlending.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.aaseya.microlending.dto.request.QuickStartRequest;
import com.aaseya.microlending.dto.response.ApplicationCreatedResponse;
import com.aaseya.microlending.dto.response.DisbursementResponse;
import com.aaseya.microlending.service.DemoService;
import com.aaseya.microlending.service.LoanApprovalService;

/** Demo panel: failure switches, quick start of a use case, duplicate payout request. */
@RestController
@RequestMapping("/api/demo")
public class DemoController {

  private final DemoService demoService;
  private final LoanApprovalService loanApprovalService;

  public DemoController(DemoService demoService, LoanApprovalService loanApprovalService) {
    this.demoService = demoService;
    this.loanApprovalService = loanApprovalService;
  }

  @GetMapping("/switches")
  public Map<String, Boolean> switches() {
    return demoService.switches();
  }

  /** Body e.g. {"esignDown": true}. */
  @PostMapping("/switches")
  public Map<String, Boolean> setSwitches(@RequestBody Map<String, Boolean> body) {
    return demoService.setSwitches(body);
  }

  /** Body: {"useCase": "uc02" | "uc03" | "uc04", "username": "priya", "data": {overrides}}. */
  @PostMapping("/quick-start")
  @ResponseStatus(HttpStatus.CREATED)
  public ApplicationCreatedResponse quickStart(@RequestBody QuickStartRequest request) {
    return new ApplicationCreatedResponse(demoService.quickStart(request));
  }

  /** Deletes all applications (and cancels their process instances) so the demo starts clean. */
  @PostMapping("/reset")
  public Map<String, Object> reset() {
    return demoService.resetTestData();
  }

  /** UC03 exception: a second disbursement request for the same loan is blocked. */
  @PostMapping("/applications/{id}/duplicate-disbursement")
  public DisbursementResponse duplicateDisbursement(@PathVariable long id) {
    return new DisbursementResponse(loanApprovalService.requestDuplicateDisbursement(id));
  }
}
