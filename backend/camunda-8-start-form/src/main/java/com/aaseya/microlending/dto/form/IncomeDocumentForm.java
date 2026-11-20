package com.aaseya.microlending.dto.form;

import com.aaseya.microlending.model.enums.DocumentType;

/** UC01 task: upload missing income documents. */
public record IncomeDocumentForm(DocumentType incomeDocType, String incomeDocFileName) {
}
