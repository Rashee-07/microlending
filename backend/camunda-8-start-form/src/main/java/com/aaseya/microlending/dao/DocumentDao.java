package com.aaseya.microlending.dao;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import com.aaseya.microlending.model.ApplicationDocument;
import com.aaseya.microlending.model.enums.DocumentType;
import com.aaseya.microlending.model.enums.VerificationStatus;

/** Table application_document. */
@Repository
public class DocumentDao extends BaseDao<ApplicationDocument> {

  public DocumentDao(JdbcTemplate jdbc) {
    super(jdbc, ApplicationDocument.class);
  }

  public long create(long applicationId, DocumentType type, String number, LocalDate expiry, String fileName) {
    return insert("INSERT INTO application_document (application_id, doc_type, doc_number, expiry_date, file_name,"
        + " verification_status) VALUES (?, ?, ?, ?, ?, ?)",
        applicationId, name(type), number, expiry, fileName, VerificationStatus.PENDING.name());
  }

  public List<ApplicationDocument> findByApplication(long applicationId) {
    return findAll("SELECT * FROM application_document WHERE application_id = ? ORDER BY id", applicationId);
  }

  public Optional<ApplicationDocument> findLatestIdentityDocument(long applicationId) {
    return findOne("SELECT * FROM application_document WHERE application_id = ?"
        + " AND doc_type IN ('PASSPORT','DRIVERS_LICENCE') ORDER BY id DESC LIMIT 1", applicationId);
  }

  public boolean hasIncomeDocument(long applicationId) {
    Integer n = jdbc.queryForObject("SELECT count(*) FROM application_document WHERE application_id = ?"
        + " AND doc_type IN ('PAYSLIP','BANK_STATEMENT')", Integer.class, applicationId);
    return n != null && n > 0;
  }

  public void updateVerificationStatus(long documentId, VerificationStatus status) {
    jdbc.update("UPDATE application_document SET verification_status = ? WHERE id = ?", status.name(), documentId);
  }
}
