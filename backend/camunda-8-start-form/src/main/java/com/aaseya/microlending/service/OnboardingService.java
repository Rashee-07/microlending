package com.aaseya.microlending.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.aaseya.microlending.constants.ProcessConstants;
import com.aaseya.microlending.dao.CustomerDao;
import com.aaseya.microlending.dao.DocumentDao;
import com.aaseya.microlending.dao.LoanApplicationDao;
import com.aaseya.microlending.dao.WorkItemDao;
import com.aaseya.microlending.dto.form.CustomerDetailsForm;
import com.aaseya.microlending.dto.form.FinancialDetailsForm;
import com.aaseya.microlending.dto.form.IdentityDocumentForm;
import com.aaseya.microlending.dto.form.IncomeDocumentForm;
import com.aaseya.microlending.dto.process.DuplicateCheckResult;
import com.aaseya.microlending.dto.process.IdentityCheckResult;
import com.aaseya.microlending.dto.process.ValidationResult;
import com.aaseya.microlending.dto.request.RegisterRequest;
import com.aaseya.microlending.exception.BusinessException;
import com.aaseya.microlending.exception.NotFoundException;
import com.aaseya.microlending.integration.IdentityVerificationClient;
import com.aaseya.microlending.model.ApplicationDocument;
import com.aaseya.microlending.model.Customer;
import com.aaseya.microlending.model.LoanApplication;
import com.aaseya.microlending.model.enums.ApplicationStatus;
import com.aaseya.microlending.model.enums.DocumentType;
import com.aaseya.microlending.model.enums.VerificationStatus;

/** UC01 - digital loan application and customer onboarding. */
@Service
public class OnboardingService {

  private final CustomerDao customerDao;
  private final LoanApplicationDao applicationDao;
  private final DocumentDao documentDao;
  private final WorkItemDao workItemDao;
  private final IdentityVerificationClient identityClient;
  private final ProcessService processService;
  private final AuditService audit;

  public OnboardingService(CustomerDao customerDao, LoanApplicationDao applicationDao, DocumentDao documentDao,
      WorkItemDao workItemDao, IdentityVerificationClient identityClient, ProcessService processService,
      AuditService audit) {
    this.customerDao = customerDao;
    this.applicationDao = applicationDao;
    this.documentDao = documentDao;
    this.workItemDao = workItemDao;
    this.identityClient = identityClient;
    this.processService = processService;
    this.audit = audit;
  }

  // ---------------------------------------------------------------- customer actions

  /** Customer registers with email + mobile: creates the application and starts UC01. */
  public long register(RegisterRequest request) {
    if (isBlank(request.username()) || isBlank(request.email()) || isBlank(request.mobile())) {
      throw new BusinessException("username, email and mobile are required");
    }
    String email = request.email().trim();
    String mobile = request.mobile().trim();
    long customerId = customerDao.create(request.username(), email, mobile);
    long applicationId = applicationDao.create(customerId, request.username());
    audit.log(applicationId, "REGISTERED", "Customer registered with " + email + " / " + mobile, request.username());

    Map<String, Object> vars = new HashMap<>();
    vars.put(ProcessConstants.VAR_CUSTOMER_USERNAME, request.username());
    vars.put("email", email);
    vars.put("mobile", mobile);
    // defaults, so the gateways never see a missing variable
    vars.put("idStatus", "PENDING");
    vars.put("duplicateFound", false);
    vars.put("validationStatus", "PENDING");
    processService.startLoanProcess(applicationId, vars, null);
    return applicationId;
  }

  public void saveCustomerDetails(long applicationId, CustomerDetailsForm form) {
    customerDao.updateDetails(application(applicationId).customerId(), form);
  }

  public void saveIdentityDocument(long applicationId, IdentityDocumentForm form) {
    if (form.idType() == null || !form.idType().isIdentityDocument()) {
      throw new BusinessException("idType must be PASSPORT or DRIVERS_LICENCE");
    }
    documentDao.create(applicationId, form.idType(), form.idNumber(), form.idExpiry(), form.fileName());
    applicationDao.updateStatus(applicationId, ApplicationStatus.IN_PROGRESS, null);
  }

  public void saveFinancialDetails(long applicationId, FinancialDetailsForm form) {
    applicationDao.updateFinancials(applicationId, form);
    if (form.incomeDocType() != null) {
      documentDao.create(applicationId, form.incomeDocType(), null, null, form.incomeDocFileName());
    }
  }

  public void saveIncomeDocument(long applicationId, IncomeDocumentForm form) {
    DocumentType type = form.incomeDocType() == null ? DocumentType.PAYSLIP : form.incomeDocType();
    documentDao.create(applicationId, type, null, null, form.incomeDocFileName());
  }

  // ---------------------------------------------------------------- process steps

  /** Identity verification and document validation. */
  public IdentityCheckResult verifyIdentity(long applicationId) {
    ApplicationDocument doc = documentDao.findLatestIdentityDocument(applicationId).orElse(null);
    VerificationStatus result = identityClient.verify(doc);
    if (doc != null) {
      documentDao.updateVerificationStatus(doc.id(), result);
    }
    String text = switch (result) {
      case VERIFIED -> "Identity verified";
      case EXPIRED -> "Identity document is expired or invalid - customer asked to upload a valid document";
      default -> "Identity verification failed - the identity provider could not match the customer";
    };
    String docText = doc == null ? "" : " (" + doc.docType() + " " + doc.docNumber() + ")";
    audit.log(applicationId, "IDENTITY_CHECK", text + docText, "identity-service");

    switch (result) {
      case EXPIRED -> {
        // the process goes back to "Upload identity document"
        applicationDao.updateStatus(applicationId, ApplicationStatus.ID_REUPLOAD_REQUIRED, "Identity document expired or invalid");
        audit.notifyCustomer(applicationId, "Identity document not accepted",
            "Your identity document is invalid or expired. Please upload a valid passport or driver licence to continue.");
        return new IdentityCheckResult(result.name(), "", "");
      }
      case FAILED -> {
        return new IdentityCheckResult(result.name(), ApplicationStatus.REJECTED.name(),
            "We could not verify your identity with the document provided");
      }
      default -> {
        return new IdentityCheckResult(result.name(), "", "");
      }
    }
  }

  /** Is there another active application for the same person? */
  public DuplicateCheckResult checkDuplicate(long applicationId) {
    List<Long> duplicates = applicationDao.findActiveDuplicates(applicationId);
    boolean found = !duplicates.isEmpty();
    audit.log(applicationId, "DUPLICATE_CHECK",
        found ? "Duplicate found: active application(s) " + duplicates : "No duplicate customer records", AuditService.SYSTEM);
    return found
        ? new DuplicateCheckResult(true, ApplicationStatus.REJECTED.name(),
            "Duplicate application - you already have an active loan application with us")
        : new DuplicateCheckResult(false, "", "");
  }

  /** Mandatory information and income documents present? */
  public ValidationResult validate(long applicationId) {
    LoanApplication a = application(applicationId);
    Customer c = customerDao.findById(a.customerId()).orElseThrow();
    List<String> missing = new ArrayList<>();
    require(missing, c.firstName(), "first name");
    require(missing, c.lastName(), "last name");
    require(missing, c.dateOfBirth(), "date of birth");
    require(missing, c.addressLine(), "address");
    require(missing, c.employmentStatus(), "employment details");
    require(missing, a.loanAmount(), "loan amount");
    require(missing, a.loanPurpose(), "loan purpose");
    require(missing, a.monthlyIncome(), "monthly income");
    require(missing, a.monthlyExpenses(), "monthly expenses");
    require(missing, a.bankAccountNumber(), "bank account number");
    if (!documentDao.hasIncomeDocument(applicationId)) {
      missing.add("income documents (payslip or bank statement)");
    }
    audit.log(applicationId, "VALIDATION",
        missing.isEmpty() ? "All mandatory information provided" : "Missing: " + missing, AuditService.SYSTEM);
    if (missing.isEmpty()) {
      return new ValidationResult("COMPLETE", "");
    }
    // the process asks the customer to upload the missing documents
    String items = String.join(", ", missing);
    applicationDao.updateStatus(applicationId, ApplicationStatus.INFO_REQUIRED, "Missing: " + items);
    audit.notifyCustomer(applicationId, "More information needed", "We need more information to continue: " + items + ".");
    return new ValidationResult("MISSING_INFORMATION", items);
  }

  /** The customer abandoned the application. */
  public void expire(long applicationId) {
    workItemDao.cancelOpen(applicationId);
    applicationDao.updateStatus(applicationId, ApplicationStatus.EXPIRED, "Application not completed in time");
    audit.notifyCustomer(applicationId, "Your application has expired",
        "Your loan application was not completed in time and has been closed. You can start a new application at any time.");
    audit.log(applicationId, "APPLICATION_EXPIRED", "Abandoned application expired", AuditService.SYSTEM);
  }

  // ---------------------------------------------------------------- helpers

  private LoanApplication application(long id) {
    return applicationDao.findById(id).orElseThrow(() -> new NotFoundException("Application " + id + " not found"));
  }

  private static void require(List<String> missing, Object value, String label) {
    if (value == null || value.toString().isBlank()) {
      missing.add(label);
    }
  }

  private static boolean isBlank(String s) {
    return s == null || s.isBlank();
  }
}
