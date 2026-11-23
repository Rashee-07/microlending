package com.aaseya.microlending.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.aaseya.microlending.dto.request.QuickStartRequest;
import com.aaseya.microlending.dto.response.ApplicationCreatedResponse;
import com.aaseya.microlending.service.DemoService;

/** Demo panel: quick start of UC02 and reset of the test data. */
@RestController
@RequestMapping("/api/demo")
public class DemoController {

  private final DemoService demoService;

  public DemoController(DemoService demoService) {
    this.demoService = demoService;
  }

  /** Body: {"useCase": "uc02", "username": "priya", "data": {overrides}}. */
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
}
