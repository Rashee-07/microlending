package com.aaseya.microlending.model;

import java.time.LocalDateTime;

import com.aaseya.microlending.model.enums.WorkItemStatus;

/** Row of table work_item: an open or finished Camunda user task. */
public record WorkItem(
    Long id,
    Long jobKey,
    Long processInstanceKey,
    String bpmnProcessId,
    String elementId,
    String name,
    Long applicationId,
    String assignee,
    String candidateGroup,
    WorkItemStatus status,
    String completedBy,
    LocalDateTime createdAt,
    LocalDateTime completedAt) {
}
