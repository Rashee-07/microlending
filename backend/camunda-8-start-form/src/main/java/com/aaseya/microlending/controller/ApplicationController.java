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

import com.aaseya.microlending.dto.request.RegisterRequest;
import com.aaseya.microlending.dto.response.ApplicationCreatedResponse;
import com.aaseya.microlending.dto.response.ApplicationDetailResponse;
import com.aaseya.microlending.dto.response.ApplicationSummary;
import com.aaseya.microlending.service.ApplicationQueryService;
import com.aaseya.microlending.service.OnboardingService;

/** Loan applications (release 1: UC01 application and UC02 credit assessment). */
@RestController
@RequestMapping("/api/applications")
public class ApplicationController {

  private final OnboardingService onboardingService;
  private final ApplicationQueryService queryService;

  public ApplicationController(OnboardingService onboardingService, ApplicationQueryService queryService) {
    this.onboardingService = onboardingService;
    this.queryService = queryService;
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
}
