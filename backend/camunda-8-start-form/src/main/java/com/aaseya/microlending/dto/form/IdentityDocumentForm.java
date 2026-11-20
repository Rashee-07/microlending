package com.aaseya.microlending.dto.form;

import java.time.LocalDate;

import com.aaseya.microlending.model.enums.DocumentType;

/** UC01 task: upload identity documents (passport or driver licence). */
public record IdentityDocumentForm(DocumentType idType, String idNumber, LocalDate idExpiry, String fileName) {
}
