package com.aaseya.microlending.dto.response;

import java.util.List;

import com.aaseya.microlending.model.ApplicationDocument;
import com.aaseya.microlending.model.CreditAssessment;
import com.aaseya.microlending.model.Customer;
import com.aaseya.microlending.model.Disbursement;
import com.aaseya.microlending.model.EventLog;
import com.aaseya.microlending.model.LoanAccount;
import com.aaseya.microlending.model.LoanApplication;
import com.aaseya.microlending.model.Notification;
import com.aaseya.microlending.model.Repayment;
import com.aaseya.microlending.model.WorkItem;

/** Everything about one application (detail screen). */
public record ApplicationDetailResponse(
    LoanApplication application,
    Customer customer,
    List<ApplicationDocument> documents,
    CreditAssessment assessment,
    LoanAccount loanAccount,
    Disbursement disbursement,
    List<Repayment> repayments,
    List<WorkItem> openTasks,
    List<Notification> notifications,
    List<EventLog> events) {
}
