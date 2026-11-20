package com.aaseya.microlending.service;

import static com.aaseya.microlending.util.MoneyUtils.toDouble;

import java.util.Map;

import org.springframework.stereotype.Service;

import com.aaseya.microlending.constants.ProcessConstants;
import com.aaseya.microlending.dao.LoanAccountDao;
import com.aaseya.microlending.dao.LoanApplicationDao;
import com.aaseya.microlending.dao.RepaymentDao;
import com.aaseya.microlending.dto.form.BankDetailsForm;
import com.aaseya.microlending.dto.process.DirectDebitResult;
import com.aaseya.microlending.dto.process.NextRepayment;
import com.aaseya.microlending.dto.request.DateChangeRequest;
import com.aaseya.microlending.dto.request.DisputeRequest;
import com.aaseya.microlending.exception.BusinessException;
import com.aaseya.microlending.exception.NotFoundException;
import com.aaseya.microlending.integration.BankingClient;
import com.aaseya.microlending.model.LoanApplication;
import com.aaseya.microlending.model.Repayment;
import com.aaseya.microlending.model.enums.ApplicationStatus;
import com.aaseya.microlending.model.enums.LoanStatus;
import com.aaseya.microlending.model.enums.RepaymentStatus;

/** UC04 - repayment management and delinquency handling. Every payment event is written to the event log. */
@Service
public class RepaymentService {

  private final LoanApplicationDao applicationDao;
  private final LoanAccountDao loanAccountDao;
  private final RepaymentDao repaymentDao;
  private final BankingClient bankingClient;
  private final ProcessService processService;
  private final AuditService audit;

  public RepaymentService(LoanApplicationDao applicationDao, LoanAccountDao loanAccountDao, RepaymentDao repaymentDao,
      BankingClient bankingClient, ProcessService processService, AuditService audit) {
    this.applicationDao = applicationDao;
    this.loanAccountDao = loanAccountDao;
    this.repaymentDao = repaymentDao;
    this.bankingClient = bankingClient;
    this.processService = processService;
    this.audit = audit;
  }

  // ---------------------------------------------------------------- process steps

  public NextRepayment nextRepayment(long applicationId) {
    return repaymentDao.findNextUnpaid(applicationId)
        .map(r -> new NextRepayment(true, r.id(), r.instalmentNo(), toDouble(r.amount()), r.dueDate().toString(),
            r.attempts()))
        .orElse(NextRepayment.none());
  }

  public void sendReminder(long applicationId, long repaymentId) {
    Repayment r = repayment(repaymentId);
    String msg = "Your repayment of AUD " + r.amount() + " (instalment " + r.instalmentNo() + ") is due on "
        + r.dueDate() + ". It will be collected by direct debit.";
    audit.notifyCustomer(applicationId, "Repayment reminder", msg);
  }

  public DirectDebitResult initiateDirectDebit(long applicationId, long repaymentId) {
    int attempts = repaymentDao.incrementAttempts(repaymentId);
    Repayment r = repayment(repaymentId);
    String account = application(applicationId).bankAccountNumber();
    bankingClient.directDebit(applicationId, account, toDouble(r.amount()));
    audit.log(applicationId, "DIRECT_DEBIT_INITIATED", "Direct debit of AUD " + r.amount() + " from account " + account
        + " (instalment " + r.instalmentNo() + ", attempt " + attempts + ")", AuditService.SYSTEM);
    return new DirectDebitResult(attempts);
  }

  public void recordPayment(long applicationId, long repaymentId, String paymentReference) {
    Repayment r = repayment(repaymentId);
    repaymentDao.updateStatus(repaymentId, RepaymentStatus.PAID, null);
    loanAccountDao.reduceBalance(applicationId, r.amount());
    loanAccountDao.updateStatus(applicationId, LoanStatus.ACTIVE);
    applicationDao.updateStatus(applicationId, ApplicationStatus.ACTIVE, null);
    Object balance = loanAccountDao.findByApplication(applicationId).orElseThrow().outstandingBalance();
    audit.notifyCustomer(applicationId, "Payment received",
        "Thank you - we received AUD " + r.amount() + ". Outstanding balance: AUD " + balance + ".");
    audit.log(applicationId, "PAYMENT_SUCCESS", "Received AUD " + r.amount() + " (" + paymentReference
        + "); outstanding balance AUD " + balance, "bank");
  }

  public void recordFailedPayment(long applicationId, long repaymentId, String failureReason, int attempts) {
    Repayment r = repayment(repaymentId);
    repaymentDao.updateStatus(repaymentId, RepaymentStatus.FAILED, failureReason);
    loanAccountDao.updateStatus(applicationId, LoanStatus.IN_ARREARS);
    applicationDao.updateStatus(applicationId, ApplicationStatus.IN_ARREARS, failureReason);
    String msg = "INCORRECT_ACCOUNT".equals(failureReason)
        ? "We could not collect your repayment of AUD " + r.amount()
            + " because your bank account details are incorrect. Please update them in the app."
        : "We could not collect your repayment of AUD " + r.amount()
            + " due to insufficient funds. We will try again soon - please make sure funds are available.";
    audit.notifyCustomer(applicationId, "Repayment unsuccessful", msg);
    audit.log(applicationId, "PAYMENT_FAILED", "Direct debit failed: " + failureReason + " (attempt " + attempts + ")",
        "bank");
  }

  public void escalateToCollections(long applicationId, long repaymentId, int attempts) {
    repaymentDao.updateStatus(repaymentId, RepaymentStatus.COLLECTIONS, "REPEATED_FAILURE");
    loanAccountDao.updateStatus(applicationId, LoanStatus.COLLECTIONS);
    applicationDao.updateStatus(applicationId, ApplicationStatus.COLLECTIONS,
        "Repayment still outstanding after " + attempts + " attempts");
    audit.notifyCustomer(applicationId, "Your account is overdue",
        "Your repayment is still outstanding. Our collections team will contact you to agree a way forward.");
    audit.log(applicationId, "ESCALATED_TO_COLLECTIONS", "Repeated payment failures - escalated to collections",
        AuditService.SYSTEM);
  }

  public void markDefaulted(long applicationId) {
    loanAccountDao.updateStatus(applicationId, LoanStatus.DEFAULTED);
    applicationDao.updateStatus(applicationId, ApplicationStatus.DEFAULTED,
        "Collections could not recover the outstanding amount");
    audit.log(applicationId, "LOAN_DEFAULTED", "Loan marked as defaulted", "collections");
  }

  public void closeLoan(long applicationId) {
    loanAccountDao.updateStatus(applicationId, LoanStatus.CLOSED);
    applicationDao.updateStatus(applicationId, ApplicationStatus.CLOSED, "Loan fully repaid");
    audit.notifyCustomer(applicationId, "Loan fully repaid",
        "Congratulations - your loan is fully repaid and the account is closed.");
    audit.log(applicationId, "LOAN_CLOSED", "All instalments paid - loan closed", AuditService.SYSTEM);
  }

  public void recordDisputeOutcome(long applicationId, String outcome, String comment) {
    String text = "Outcome: " + outcome + (comment == null ? "" : " - " + comment);
    audit.notifyCustomer(applicationId, "Your payment dispute", "We have reviewed your dispute. " + text);
    audit.log(applicationId, "DISPUTE_RESOLVED", text, "collections");
  }

  public void updateSchedule(long applicationId, boolean approved, Integer newDueDay) {
    if (approved && newDueDay != null) {
      int moved = repaymentDao.changeDueDay(applicationId, newDueDay);
      audit.notifyCustomer(applicationId, "Repayment date changed",
          "Your remaining repayments are now due on day " + Math.min(newDueDay, 28) + " of each month.");
      audit.log(applicationId, "SCHEDULE_UPDATED", moved + " instalment(s) moved to day " + newDueDay, "credit-officer");
    } else {
      audit.notifyCustomer(applicationId, "Repayment date change",
          "We are unable to change your repayment date at this time.");
      audit.log(applicationId, "DATE_CHANGE_DECLINED", "Request to change the repayment date was declined",
          "credit-officer");
    }
  }

  // ---------------------------------------------------------------- customer / demo actions

  public void updateBankDetails(long applicationId, BankDetailsForm form) {
    if (form.bankAccountNumber() == null || form.bankAccountNumber().isBlank()) {
      throw new BusinessException("bankAccountNumber is required");
    }
    applicationDao.updateBankAccount(applicationId, form.bankAccountNumber().trim());
  }

  public void raiseDispute(long applicationId, DisputeRequest request) {
    String reason = request.reason() == null ? "" : request.reason();
    audit.log(applicationId, "CUSTOMER_DISPUTE", "Customer disputed a repayment: " + reason, request.username());
    processService.publishMessage(ProcessConstants.MSG_REPAYMENT_DISPUTED, applicationId,
        Map.of("disputeReason", reason));
  }

  public void requestDateChange(long applicationId, DateChangeRequest request) {
    Integer day = request.newDueDay();
    if (day == null || day < 1 || day > 31) {
      throw new BusinessException("newDueDay must be between 1 and 31");
    }
    audit.log(applicationId, "CUSTOMER_DATE_CHANGE_REQUEST", "Customer asked to move repayments to day " + day,
        request.username());
    processService.publishMessage(ProcessConstants.MSG_REPAYMENT_DATE_CHANGE, applicationId, Map.of("newDueDay", day));
  }

  // ---------------------------------------------------------------- helpers

  private Repayment repayment(long id) {
    return repaymentDao.findById(id).orElseThrow(() -> new NotFoundException("Repayment " + id + " not found"));
  }

  private LoanApplication application(long id) {
    return applicationDao.findById(id).orElseThrow(() -> new NotFoundException("Application " + id + " not found"));
  }
}
