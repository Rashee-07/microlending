package com.aaseya.microlending.service;

import static com.aaseya.microlending.util.MoneyUtils.money;
import static com.aaseya.microlending.util.MoneyUtils.toDouble;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.aaseya.microlending.config.DemoProperties;
import com.aaseya.microlending.constants.ProcessConstants;
import com.aaseya.microlending.dao.DisbursementDao;
import com.aaseya.microlending.dao.LoanAccountDao;
import com.aaseya.microlending.dao.LoanApplicationDao;
import com.aaseya.microlending.dao.RepaymentDao;
import com.aaseya.microlending.dto.process.CloseDecision;
import com.aaseya.microlending.dto.process.EsignatureSent;
import com.aaseya.microlending.dto.process.LoanOffer;
import com.aaseya.microlending.dto.request.SignAgreementRequest;
import com.aaseya.microlending.exception.BusinessException;
import com.aaseya.microlending.exception.NotFoundException;
import com.aaseya.microlending.integration.BankingClient;
import com.aaseya.microlending.integration.ESignatureClient;
import com.aaseya.microlending.model.Disbursement;
import com.aaseya.microlending.model.LoanAccount;
import com.aaseya.microlending.model.LoanApplication;
import com.aaseya.microlending.model.Repayment;
import com.aaseya.microlending.model.enums.AgreementStatus;
import com.aaseya.microlending.model.enums.ApplicationStatus;
import com.aaseya.microlending.model.enums.DisbursementResult;
import com.aaseya.microlending.model.enums.DisbursementStatus;
import com.aaseya.microlending.model.enums.LoanStatus;
import com.aaseya.microlending.util.MoneyUtils;

/** UC03 - loan approval, contract generation, e-signature and disbursement. */
@Service
public class LoanApprovalService {

  private final LoanApplicationDao applicationDao;
  private final LoanAccountDao loanAccountDao;
  private final DisbursementDao disbursementDao;
  private final RepaymentDao repaymentDao;
  private final ESignatureClient esignClient;
  private final BankingClient bankingClient;
  private final ProcessService processService;
  private final DemoProperties properties;
  private final AuditService audit;

  public LoanApprovalService(LoanApplicationDao applicationDao, LoanAccountDao loanAccountDao,
      DisbursementDao disbursementDao, RepaymentDao repaymentDao, ESignatureClient esignClient,
      BankingClient bankingClient, ProcessService processService, DemoProperties properties, AuditService audit) {
    this.applicationDao = applicationDao;
    this.loanAccountDao = loanAccountDao;
    this.disbursementDao = disbursementDao;
    this.repaymentDao = repaymentDao;
    this.esignClient = esignClient;
    this.bankingClient = bankingClient;
    this.processService = processService;
    this.properties = properties;
    this.audit = audit;
  }

  /** Generates the loan offer & agreement (loan account in PENDING state). */
  public LoanOffer createOffer(long applicationId) {
    LoanApplication app = application(applicationId);
    double amount = toDouble(app.loanAmount());
    int term = app.termMonths() == null ? 12 : app.termMonths();
    double rate = properties.policy().interestRate();
    double repayment = MoneyUtils.monthlyRepayment(amount, rate, term);
    LoanAccount loan = loanAccountDao.createOffer(applicationId, money(amount), BigDecimal.valueOf(rate), term,
        money(repayment), money(repayment * term));
    applicationDao.updateStatus(applicationId, ApplicationStatus.OFFER_GENERATED, null);
    audit.log(applicationId, "OFFER_GENERATED", "Loan offer & agreement generated: account " + loan.accountNumber()
        + ", AUD " + repayment + "/month over " + term + " months at " + rate + "% p.a.", AuditService.SYSTEM);
    return new LoanOffer(loan.accountNumber(), repayment, rate, term);
  }

  /** Sends the agreement to the e-signature provider (throws ServiceUnavailableException when it is down). */
  public EsignatureSent sendForSignature(long applicationId) {
    String envelope = esignClient.sendAgreement(applicationId);
    loanAccountDao.updateAgreementStatus(applicationId, AgreementStatus.SENT);
    applicationDao.updateStatus(applicationId, ApplicationStatus.AGREEMENT_SENT, null);
    audit.notifyCustomer(applicationId, "Please sign your loan agreement",
        "Your loan offer is ready. Review and sign the agreement electronically to receive the funds.");
    audit.log(applicationId, "ESIGNATURE_SENT", "Agreement sent for e-signature (envelope " + envelope + ")",
        "esignature-service");
    return new EsignatureSent(envelope);
  }

  public void recordSignatureServiceDown(long applicationId, String error, int attemptsLeft) {
    audit.log(applicationId, attemptsLeft > 0 ? "ESIGNATURE_RETRY" : "ESIGNATURE_UNAVAILABLE",
        error + (attemptsLeft > 0 ? " - retrying (" + attemptsLeft + " attempt(s) left)" : " - switching to manual signing"),
        "esignature-service");
  }

  /** Credit officer sent the agreement by other means because the e-signature service was down. */
  public void agreementSentManually(long applicationId) {
    loanAccountDao.updateAgreementStatus(applicationId, AgreementStatus.SENT);
    applicationDao.updateStatus(applicationId, ApplicationStatus.AGREEMENT_SENT,
        "Agreement sent manually (e-signature service was down)");
    audit.notifyCustomer(applicationId, "Please sign your loan agreement",
        "Your loan agreement has been sent to you. Please review and sign it to receive the funds.");
  }

  /** Customer signs in the app: correlates message "agreement-signed". */
  public void sign(long applicationId, SignAgreementRequest request) {
    LoanApplication app = application(applicationId);
    if (app.status() != ApplicationStatus.AGREEMENT_SENT) {
      throw new BusinessException("There is no agreement waiting for signature (status " + app.status() + ")");
    }
    loanAccountDao.updateAgreementStatus(applicationId, AgreementStatus.SIGNED);
    applicationDao.updateStatus(applicationId, ApplicationStatus.SIGNED, null);
    audit.log(applicationId, "AGREEMENT_SIGNED", "Customer signed the loan agreement electronically", request.username());
    processService.publishMessage(ProcessConstants.MSG_AGREEMENT_SIGNED, applicationId,
        Map.of("signedBy", String.valueOf(request.username())));
  }

  /** Customer did not sign within the signing period: the offer is withdrawn and the application closed. */
  public CloseDecision withdrawOffer(long applicationId) {
    loanAccountDao.updateAgreementStatus(applicationId, AgreementStatus.EXPIRED);
    loanAccountDao.updateStatus(applicationId, LoanStatus.CANCELLED);
    audit.log(applicationId, "OFFER_WITHDRAWN", "Agreement not signed in time - offer withdrawn", AuditService.SYSTEM);
    return new CloseDecision(ApplicationStatus.OFFER_EXPIRED.name(),
        "The loan agreement was not signed within the signing period");
  }

  /**
   * Pays out the loan through the bank. Idempotent: a second request while a transfer is in progress or done
   * is blocked (DUPLICATE_BLOCKED), so the customer can never be paid twice.
   */
  public DisbursementResult disburse(long applicationId) {
    LoanAccount loan = loanAccountDao.findByApplication(applicationId)
        .orElseThrow(() -> new BusinessException("No loan account for application " + applicationId));
    BigDecimal amount = loan.principal();
    String reference = "TRF-" + applicationId + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
    if (!disbursementDao.tryStart(applicationId, amount, reference)) {
      Disbursement existing = disbursementDao.findByApplication(applicationId).orElseThrow();
      audit.log(applicationId, "DUPLICATE_DISBURSEMENT_BLOCKED", "Duplicate disbursement request blocked - transfer "
          + existing.bankReference() + " is already " + existing.status(), AuditService.SYSTEM);
      return DisbursementResult.DUPLICATE_BLOCKED;
    }
    if (!bankingClient.transfer(applicationId, reference)) {
      disbursementDao.updateStatus(applicationId, DisbursementStatus.FAILED);
      applicationDao.updateStatus(applicationId, ApplicationStatus.DISBURSEMENT_FAILED, "Bank transfer failed");
      audit.log(applicationId, "TRANSFER_FAILED", "Bank rejected transfer " + reference + " of AUD " + amount, "bank");
      return DisbursementResult.FAILED;
    }
    applicationDao.updateStatus(applicationId, ApplicationStatus.DISBURSING, null);
    audit.log(applicationId, "DISBURSEMENT_INITIATED", "Transfer " + reference + " of AUD " + amount + " sent to the bank",
        AuditService.SYSTEM);
    return DisbursementResult.INITIATED;
  }

  /** Demo: a second payout request for the same loan. */
  public DisbursementResult requestDuplicateDisbursement(long applicationId) {
    if (disbursementDao.findByApplication(applicationId).isEmpty()) {
      throw new BusinessException("No disbursement has been made for this application yet");
    }
    return disburse(applicationId);
  }

  /** Bank confirmed the payout: activate the loan and create the repayment schedule (first due in one month). */
  public void activateLoan(long applicationId, String bankReference) {
    LoanAccount loan = loanAccountDao.findByApplication(applicationId).orElseThrow();
    disbursementDao.updateStatus(applicationId, DisbursementStatus.CONFIRMED);
    loanAccountDao.updateStatus(applicationId, LoanStatus.ACTIVE);
    repaymentDao.createSchedule(applicationId, loan.termMonths(), loan.monthlyRepayment(), LocalDate.now().plusMonths(1));
    applicationDao.updateStatus(applicationId, ApplicationStatus.ACTIVE, null);

    Repayment first = repaymentDao.findNextUnpaid(applicationId).orElseThrow();
    audit.notifyCustomer(applicationId, "Your loan has been paid out", "AUD " + loan.principal()
        + " has been transferred to your bank account. Your first repayment of AUD " + loan.monthlyRepayment()
        + " is due on " + first.dueDate() + ".");
    audit.log(applicationId, "PAYMENT_CONFIRMED", "Bank confirmed transfer " + bankReference + "; loan account "
        + loan.accountNumber() + " is active", "bank");
  }

  private LoanApplication application(long id) {
    return applicationDao.findById(id).orElseThrow(() -> new NotFoundException("Application " + id + " not found"));
  }
}
