package com.aaseya.microlending.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.aaseya.microlending.model.Notification;
import com.aaseya.microlending.service.ApplicationQueryService;

/** In-app notifications of a customer. */
@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

  private final ApplicationQueryService queryService;

  public NotificationController(ApplicationQueryService queryService) {
    this.queryService = queryService;
  }

  @GetMapping
  public List<Notification> notifications(@RequestParam String username) {
    return queryService.notifications(username);
  }
}
