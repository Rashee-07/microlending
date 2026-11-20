package com.aaseya.microlending.dao;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

/** Tables users and login_history (filled on every successful login). */
@Repository
public class UserDao {

  private final JdbcTemplate jdbc;

  public UserDao(JdbcTemplate jdbc) {
    this.jdbc = jdbc;
  }

  public void createIfMissing(String username, String role) {
    jdbc.update("INSERT INTO users (username, role) VALUES (?, ?) ON CONFLICT (username) DO NOTHING", username, role);
  }

  public void recordLogin(String username, String role) {
    jdbc.update("INSERT INTO login_history (username, role) VALUES (?, ?)", username, role);
  }
}
