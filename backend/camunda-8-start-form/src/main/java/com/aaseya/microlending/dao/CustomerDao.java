package com.aaseya.microlending.dao;

import java.util.Optional;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import com.aaseya.microlending.dto.form.CustomerDetailsForm;
import com.aaseya.microlending.model.Customer;

/** Table customer. */
@Repository
public class CustomerDao extends BaseDao<Customer> {

  public CustomerDao(JdbcTemplate jdbc) {
    super(jdbc, Customer.class);
  }

  public long create(String username, String email, String mobile) {
    return insert("INSERT INTO customer (username, email, mobile) VALUES (?, ?, ?)", username, email, mobile);
  }

  public Optional<Customer> findById(long id) {
    return findOne("SELECT * FROM customer WHERE id = ?", id);
  }

  public void updateDetails(long customerId, CustomerDetailsForm f) {
    jdbc.update("UPDATE customer SET first_name = ?, last_name = ?, date_of_birth = ?, address_line = ?, suburb = ?,"
        + " state = ?, postcode = ?, employment_status = ?, employer_name = ?, employment_years = ? WHERE id = ?",
        f.firstName(), f.lastName(), f.dateOfBirth(), f.addressLine(), f.suburb(), f.state(), f.postcode(),
        f.employmentStatus(), f.employerName(), f.employmentYears(), customerId);
  }
}
