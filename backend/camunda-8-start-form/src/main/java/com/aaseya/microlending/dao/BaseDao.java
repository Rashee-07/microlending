package com.aaseya.microlending.dao;

import java.util.List;
import java.util.Optional;

import org.springframework.jdbc.core.DataClassRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;

/** Shared JdbcTemplate helpers. Rows are mapped to records by column name (snake_case -> camelCase). */
abstract class BaseDao<T> {

  protected final JdbcTemplate jdbc;
  protected final RowMapper<T> mapper;

  protected BaseDao(JdbcTemplate jdbc, Class<T> type) {
    this.jdbc = jdbc;
    this.mapper = new DataClassRowMapper<>(type);
  }

  /** Runs an INSERT and returns the generated id. */
  protected long insert(String sql, Object... args) {
    KeyHolder key = new GeneratedKeyHolder();
    jdbc.update(con -> {
      var ps = con.prepareStatement(sql, new String[] {"id"});
      for (int i = 0; i < args.length; i++) {
        ps.setObject(i + 1, args[i]);
      }
      return ps;
    }, key);
    return key.getKey().longValue();
  }

  protected Optional<T> findOne(String sql, Object... args) {
    return jdbc.query(sql, mapper, args).stream().findFirst();
  }

  protected List<T> findAll(String sql, Object... args) {
    return jdbc.query(sql, mapper, args);
  }

  protected static String name(Enum<?> e) {
    return e == null ? null : e.name();
  }
}
