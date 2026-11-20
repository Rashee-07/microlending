package com.aaseya.microlending.model;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.aaseya.microlending.model.enums.DocumentType;
import com.aaseya.microlending.model.enums.VerificationStatus;

/** Row of table application_document (metadata only for the demo). */
public record ApplicationDocument(
    Long id,
    Long applicationId,
    DocumentType docType,
    String docNumber,
    LocalDate expiryDate,
    String fileName,
    VerificationStatus verificationStatus,
    LocalDateTime uploadedAt) {
}
