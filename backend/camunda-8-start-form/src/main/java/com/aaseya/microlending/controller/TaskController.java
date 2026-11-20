package com.aaseya.microlending.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.aaseya.microlending.dto.request.CompleteTaskRequest;
import com.aaseya.microlending.dto.response.MessageResponse;
import com.aaseya.microlending.dto.response.TaskResponse;
import com.aaseya.microlending.service.TaskService;

/** Work queues: open human tasks and completing them. */
@RestController
@RequestMapping("/api/tasks")
public class TaskController {

  private final TaskService taskService;

  public TaskController(TaskService taskService) {
    this.taskService = taskService;
  }

  /** Open tasks for a user: own customer tasks plus the queues of the role (REVIEWER, MANAGER). */
  @GetMapping
  public List<TaskResponse> openTasks(@RequestParam String username, @RequestParam String role) {
    return taskService.findOpenTasks(username, role);
  }

  @PostMapping("/{jobKey}/complete")
  public MessageResponse complete(@PathVariable long jobKey, @RequestBody CompleteTaskRequest request) {
    taskService.complete(jobKey, request);
    return new MessageResponse("Task " + jobKey + " completed");
  }
}
