package com.aaseya.microlending.service;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.aaseya.microlending.config.DemoSwitches;
import com.aaseya.microlending.constants.ProcessConstants;
import com.aaseya.microlending.dao.CustomerDao;
import com.aaseya.microlending.dao.DemoDataDao;
import com.aaseya.microlending.dao.DisbursementDao;
import com.aaseya.microlending.dao.DocumentDao;
import com.aaseya.microlending.dao.LoanAccountDao;
import com.aaseya.microlending.dao.LoanApplicationDao;
import com.aaseya.microlending.dto.form.CustomerDetailsForm;
import com.aaseya.microlending.dto.form.FinancialDetailsForm;
import com.aaseya.microlending.dto.request.QuickStartRequest;
import com.aaseya.microlending.exception.BusinessException;
import com.aaseya.microlending.model.enums.AgreementStatus;
import com.aaseya.microlending.model.enums.ApplicationStatus;
import com.aaseya.microlending.model.enums.DocumentType;
import com.aaseya.microlending.util.MoneyUtils;
import com.fasterxml.jackson.databind.ObjectMapper;

/** Demo panel: failure switches and "quick start" of UC02/UC03/UC04 with a ready-made application. */
@Service
public class DemoService {

  private final DemoSwitches switches;
  private final CustomerDao customerDao;
  private final LoanApplicationDao applicationDao;
  private final DocumentDao documentDao;
  private final LoanAccountDao loanAccountDao;
  private final DisbursementDao disbursementDao;
  private final LoanApprovalService loanApprovalService;
  private final ProcessService processService;
  private final AuditService audit;
  private final ObjectMapper objectMapper;
  private final DemoDataDao demoDataDao;

  public DemoService(DemoSwitches switches, CustomerDao customerDao, LoanApplicationDao applicationDao,
      DocumentDao documentDao, LoanAccountDao loanAccountDao, DisbursementDao disbursementDao,
      LoanApprovalService loanApprovalService, ProcessService processService, AuditService audit,
      ObjectMapper objectMapper, DemoDataDao demoDataDao) {
    this.demoDataDao = demoDataDao;
    this.switches = switches;
    this.customerDao = customerDao;
    this.applicationDao = applicationDao;
    this.documentDao = documentDao;
    this.loanAccountDao = loanAccountDao;
    this.disbursementDao = disbursementDao;
    this.loanApprovalService = loanApprovalService;
    this.processService = processService;
    this.audit = audit;
    this.objectMapper = objectMapper;
  }

  public Map<String, Boolean> switches() {
    return switches.all();
  }

  public Map<String, Boolean> setSwitches(Map<String, Boolean> values) {
    values.forEach(switches::set);
    return switches.all();
  }

  /**
   * Fresh start for the demo: cancels the process instances of all applications in Zeebe,
   * deletes all lending data (user accounts are kept) and turns every failure switch off.
   */
  public Map<String, Object> resetTestData() {
    long applications = demoDataDao.countApplications();
    int cancelled = 0;
    for (long key : demoDataDao.processInstanceKeys()) {
      if (processService.cancelInstance(key)) {
        cancelled++;
      }
    }
    demoDataDao.deleteAll();
    switches.all().keySet().forEach(name -> switches.set(name, false));
    Map<String, Object> result = new HashMap<>();
    result.put("applicationsDeleted", applications);
    result.put("processInstancesCancelled", cancelled);
    result.put("switches", switches.all());
    return result;
  }

  /** Creates a complete sample application and starts the requested use case directly. */
  public long quickStart(QuickStartRequest request) {
    String useCase = String.valueOf(request.useCase());
    if (!useCase.matches("uc0[234]")) {
      throw new BusinessException("useCase must be uc02, uc03 or uc04");
    }
    String username = request.username() == null ? "priya" : request.username();
    Map<String, Object> d = sampleApplicant();
    if (request.data() != null) {
      d.putAll(request.data());
    }

    long customerId = customerDao.create(username, String.valueOf(d.get("email")), String.valueOf(d.get("mobile")));
    long appId = applicationDao.create(customerId, username);
    customerDao.updateDetails(customerId, objectMapper.convertValue(d, CustomerDetailsForm.class));
    FinancialDetailsForm financials = objectMapper.convertValue(d, FinancialDetailsForm.class);
    applicationDao.updateFinancials(appId, financials);
    documentDao.create(appId, DocumentType.PASSPORT, String.valueOf(d.get("idNumber")), LocalDate.now().plusYears(5), "passport.jpg");
    documentDao.create(appId, DocumentType.PAYSLIP, null, null, "payslip.pdf");
    audit.log(appId, "DEMO_QUICK_START", "Sample application created to start " + useCase + " directly", "demo");

    Map<String, Object> vars = new HashMap<>();
    vars.put(ProcessConstants.VAR_CUSTOMER_USERNAME, username);
    vars.put(ProcessConstants.VAR_LOAN_AMOUNT, financials.loanAmount().doubleValue());
    // the same loan process, started at the sub-process of the requested use case
    switch (useCase) {
      case "uc02" -> {
        applicationDao.updateStatus(appId, ApplicationStatus.SUBMITTED, null);
        processService.startLoanProcess(appId, vars, ProcessConstants.STAGE_UC02);
      }
      case "uc03" -> {
        vars.put(ProcessConstants.VAR_RISK_CATEGORY, d.getOrDefault("riskCategory", "LOW"));
        applicationDao.updateStatus(appId, ApplicationStatus.APPROVED_IN_PRINCIPLE,
            "Verified income and affordability within policy");
        processService.startLoanProcess(appId, vars, ProcessConstants.STAGE_UC03);
      }
      default -> {
        // uc04: an already disbursed, active loan
        loanApprovalService.createOffer(appId);
        loanAccountDao.updateAgreementStatus(appId, AgreementStatus.SIGNED);
        disbursementDao.tryStart(appId, MoneyUtils.money(financials.loanAmount().doubleValue()), "TRF-DEMO-" + appId);
        loanApprovalService.activateLoan(appId, "TRF-DEMO-" + appId);
        processService.startLoanProcess(appId, vars, ProcessConstants.STAGE_UC04);
      }
    }
    return appId;
  }

  /** UC02 scenario: AUD 5,000 loan, comfortably affordable. Override fields to trigger other outcomes. */
  private static Map<String, Object> sampleApplicant() {
    long n = System.currentTimeMillis() % 100000;
    Map<String, Object> d = new HashMap<>();
    d.put("email", "demo" + n + "@example.com");
    d.put("mobile", "04" + String.format("%08d", n));
    d.put("firstName", "Priya");
    d.put("lastName", "Sharma");
    d.put("dateOfBirth", "1990-04-12");
    d.put("addressLine", "12 George Street");
    d.put("suburb", "Sydney");
    d.put("state", "NSW");
    d.put("postcode", "2000");
    d.put("employmentStatus", "FULL_TIME");
    d.put("employerName", "Harbour Logistics Pty Ltd");
    d.put("employmentYears", 4);
    d.put("idNumber", "PA" + String.format("%07d", n));
    d.put("loanAmount", 5000);
    d.put("loanPurpose", "Car repairs");
    d.put("termMonths", 12);
    d.put("monthlyIncome", 5200);
    d.put("monthlyExpenses", 2400);
    d.put("monthlyLiabilities", 300);
    // valid account: never ends in 00 (incorrect account) or 99 (insufficient funds)
    d.put("bankAccountNumber", "062000" + String.format("%04d", n % 10000) + "11");
    return d;
  }
}
