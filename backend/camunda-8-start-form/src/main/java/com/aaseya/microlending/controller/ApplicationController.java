package com.aaseya.microlending.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.aaseya.microlending.dto.request.DateChangeRequest;
import com.aaseya.microlending.dto.request.DisputeRequest;
import com.aaseya.microlending.dto.request.RegisterRequest;
import com.aaseya.microlending.dto.request.SignAgreementRequest;
import com.aaseya.microlending.dto.response.ApplicationCreatedResponse;
import com.aaseya.microlending.dto.response.ApplicationDetailResponse;
import com.aaseya.microlending.dto.response.ApplicationSummary;
import com.aaseya.microlending.dto.response.MessageResponse;
import com.aaseya.microlending.service.ApplicationQueryService;
import com.aaseya.microlending.service.LoanApprovalService;
import com.aaseya.microlending.service.OnboardingService;
import com.aaseya.microlending.service.RepaymentService;

/** Loan applications and the customer actions on them. */
@RestController
@RequestMapping("/api/applications")
public class ApplicationController {

  private final OnboardingService onboardingService;
  private final ApplicationQueryService queryService;
  private final LoanApprovalService loanApprovalService;
  private final RepaymentService repaymentService;

  public ApplicationController(OnboardingService onboardingService, ApplicationQueryService queryService,
      LoanApprovalService loanApprovalService, RepaymentService repaymentService) {
    this.onboardingService = onboardingService;
    this.queryService = queryService;
    this.loanApprovalService = loanApprovalService;
    this.repaymentService = repaymentService;
  }

  /** UC01: customer registers with email + mobile; starts the onboarding process. */
  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public ApplicationCreatedResponse register(@RequestBody RegisterRequest request) {
    return new ApplicationCreatedResponse(onboardingService.register(request));
  }

  /** All applications, or only one customer's (?username=). */
  @GetMapping
  public List<ApplicationSummary> list(@RequestParam(required = false) String username) {
    return queryService.list(username);
  }

  @GetMapping("/{id}")
  public ApplicationDetailResponse detail(@PathVariable long id) {
    return queryService.detail(id);
  }

  /** UC03: customer signs the loan agreement. */
  @PostMapping("/{id}/sign")
  public MessageResponse sign(@PathVariable long id, @RequestBody SignAgreementRequest request) {
    loanApprovalService.sign(id, request);
    return new MessageResponse("Agreement signed");
  }

  /** UC04: customer disputes a repayment. */
  @PostMapping("/{id}/dispute")
  public MessageResponse dispute(@PathVariable long id, @RequestBody DisputeRequest request) {
    repaymentService.raiseDispute(id, request);
    return new MessageResponse("Dispute submitted");
  }

  /** UC04: customer asks to move the repayment date. */
  @PostMapping("/{id}/date-change")
  public MessageResponse dateChange(@PathVariable long id, @RequestBody DateChangeRequest request) {
    repaymentService.requestDateChange(id, request);
    return new MessageResponse("Date change requested");
  }
}
