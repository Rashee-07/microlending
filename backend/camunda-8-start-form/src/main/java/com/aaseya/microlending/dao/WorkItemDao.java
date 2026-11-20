package com.aaseya.microlending.dao;

import java.util.List;
import java.util.Optional;

import org.springframework.jdbc.core.DataClassRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import com.aaseya.microlending.dto.response.TaskResponse;
import com.aaseya.microlending.model.WorkItem;
import com.aaseya.microlending.model.enums.WorkItemStatus;

/** Table work_item: Camunda user tasks picked up by the backend. */
@Repository
public class WorkItemDao extends BaseDao<WorkItem> {

  private final DataClassRowMapper<TaskResponse> taskMapper = new DataClassRowMapper<>(TaskResponse.class);

  public WorkItemDao(JdbcTemplate jdbc) {
    super(jdbc, WorkItem.class);
  }

  /** Stores a new task (ignored if the same Camunda job is delivered twice). */
  public void create(long jobKey, long processInstanceKey, String bpmnProcessId, String elementId, String name,
      long applicationId, String assignee, String candidateGroup) {
    jdbc.update("INSERT INTO work_item (job_key, process_instance_key, bpmn_process_id, element_id, name,"
        + " application_id, assignee, candidate_group, status) VALUES (?,?,?,?,?,?,?,?,?)"
        + " ON CONFLICT (job_key) DO NOTHING",
        jobKey, processInstanceKey, bpmnProcessId, elementId, name, applicationId, assignee, candidateGroup,
        WorkItemStatus.OPEN.name());
  }

  public Optional<WorkItem> findByJobKey(long jobKey) {
    return findOne("SELECT * FROM work_item WHERE job_key = ?", jobKey);
  }

  public List<WorkItem> findOpenByApplication(long applicationId) {
    return findAll("SELECT * FROM work_item WHERE application_id = ? AND status = 'OPEN' ORDER BY id", applicationId);
  }

  /** Open tasks assigned to the user or offered to one of the groups, with applicant details. */
  public List<TaskResponse> findOpenTasks(String assignee, List<String> groups) {
    String in = groups.isEmpty() ? "NULL" : String.join(",", groups.stream().map(g -> "?").toList());
    Object[] args = new Object[groups.size() + 1];
    args[0] = assignee;
    for (int i = 0; i < groups.size(); i++) {
      args[i + 1] = groups.get(i);
    }
    return jdbc.query("SELECT w.job_key, w.element_id, w.name, w.application_id, w.assignee, w.candidate_group,"
        + " w.created_at, c.first_name, c.last_name, a.loan_amount, a.loan_purpose, a.status AS application_status"
        + " FROM work_item w JOIN application a ON a.id = w.application_id JOIN customer c ON c.id = a.customer_id"
        + " WHERE w.status = 'OPEN' AND (w.assignee = ? OR w.candidate_group IN (" + in + ")) ORDER BY w.id",
        taskMapper, args);
  }

  public void close(long jobKey, WorkItemStatus status, String user) {
    jdbc.update("UPDATE work_item SET status = ?, completed_by = ?, completed_at = now() WHERE job_key = ?",
        status.name(), user, jobKey);
  }

  public void cancelOpen(long applicationId) {
    jdbc.update("UPDATE work_item SET status = 'CANCELED', completed_at = now()"
        + " WHERE application_id = ? AND status = 'OPEN'", applicationId);
  }
}
