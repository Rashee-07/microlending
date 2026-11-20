package com.aaseya.microlending.legacy;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@CrossOrigin("*")
@RestController
public class LoanApplicationController {

  @Autowired
  private JdbcTemplate jdbcTemplate;

  // Saved loan applications with their status, newest first.
  // /loans                -> all loans (Manager page)
  // /loans?username=user1 -> only that user's loans (User page)
  @GetMapping("/loans")
  public List<Map<String, Object>> getLoans(@RequestParam(required = false) String username) {
    String sql = "SELECT id, process_instance_id, first_name, last_name, loan_type, loan_amount, status, created_at"
        + " FROM loan_application";
    if (username == null) {
      return jdbcTemplate.queryForList(sql + " ORDER BY id DESC");
    }
    return jdbcTemplate.queryForList(sql + " WHERE username = ? ORDER BY id DESC", username);
  }
}
