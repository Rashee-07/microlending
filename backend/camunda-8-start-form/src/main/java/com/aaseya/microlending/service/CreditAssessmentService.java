package com.aaseya.microlending.service;

import static com.aaseya.microlending.util.MoneyUtils.money;
import static com.aaseya.microlending.util.MoneyUtils.round2;
import static com.aaseya.microlending.util.MoneyUtils.toDouble;

import java.math.BigDecimal;

import org.springframework.stereotype.Service;

import com.aaseya.microlending.config.DemoProperties;
import com.aaseya.microlending.dao.CreditAssessmentDao;
import com.aaseya.microlending.dao.CustomerDao;
import com.aaseya.microlending.dao.DocumentDao;
import com.aaseya.microlending.dao.LoanApplicationDao;
import com.aaseya.microlending.dto.process.AffordabilityInput;
import com.aaseya.microlending.dto.process.AffordabilityResult;
import com.aaseya.microlending.dto.process.AssessmentFacts;
import com.aaseya.microlending.dto.process.AssessmentRecorded;
import com.aaseya.microlending.dto.process.BankStatementAnalysis;
import com.aaseya.microlending.dto.process.CreditDecision;
import com.aaseya.microlending.dto.process.CreditReport;
import com.aaseya.microlending.dto.process.CustomerProfile;
import com.aaseya.microlending.dto.process.EmploymentVerification;
import com.aaseya.microlending.exception.NotFoundException;
import com.aaseya.microlending.integration.BankStatementClient;
import com.aaseya.microlending.integration.CreditBureauClient;
import com.aaseya.microlending.integration.EmploymentVerificationClient;
import com.aaseya.microlending.model.CreditAssessment;
import com.aaseya.microlending.model.Customer;
import com.aaseya.microlending.model.LoanApplication;
import com.aaseya.microlending.model.enums.ApplicationStatus;
import com.aaseya.microlending.util.MoneyUtils;

/** UC02 - automated credit assessment. The decision itself is the DMN table credit-decision.dmn. */
@Service
public class CreditAssessmentService {

  private final LoanApplicationDao applicationDao;
  private final CustomerDao customerDao;
  private final DocumentDao documentDao;
  private final CreditAssessmentDao assessmentDao;
  private final EmploymentVerificationClient employmentClient;
  private final CreditBureauClient bureauClient;
  private final BankStatementClient bankStatementClient;
  private final DemoProperties properties;
  private final AuditService audit;

  public CreditAssessmentService(LoanApplicationDao applicationDao, CustomerDao customerDao, DocumentDao documentDao,
      CreditAssessmentDao assessmentDao, EmploymentVerificationClient employmentClient, CreditBureauClient bureauClient,
      BankStatementClient bankStatementClient, DemoProperties properties, AuditService audit) {
    this.applicationDao = applicationDao;
    this.customerDao = customerDao;
    this.documentDao = documentDao;
    this.assessmentDao = assessmentDao;
    this.employmentClient = employmentClient;
    this.bureauClient = bureauClient;
    this.bankStatementClient = bankStatementClient;
    this.properties = properties;
    this.audit = audit;
  }

  /** Retrieves the customer and the loan, and verifies employment & income with the employer. */
  public CustomerProfile retrieveCustomer(long applicationId) {
    LoanApplication a = applicationDao.findById(applicationId)
        .orElseThrow(() -> new NotFoundException("Application " + applicationId + " not found"));
    Customer c = customerDao.findById(a.customerId()).orElseThrow();
    applicationDao.updateStatus(applicationId, ApplicationStatus.ASSESSING, null);
    audit.log(applicationId, "ASSESSMENT_STARTED", "Customer information retrieved", AuditService.SYSTEM);

    EmploymentVerification employment = employmentClient.verify(c.employmentStatus(), c.employerName(),
        toDouble(a.monthlyIncome()));
    audit.log(applicationId, "INCOME_VERIFICATION", "Employment verified: " + employment.employmentVerified()
        + ", verified monthly income AUD " + employment.verifiedIncome(), "employment-verification-service");

    return new CustomerProfile(c.firstName(), c.lastName(), c.email(), c.employmentStatus(), c.employerName(),
        toDouble(a.loanAmount()), a.termMonths() == null ? 12 : a.termMonths(), toDouble(a.monthlyIncome()),
        toDouble(a.monthlyExpenses()), toDouble(a.monthlyLiabilities()), documentDao.hasIncomeDocument(applicationId),
        employment.employmentVerified(), employment.verifiedIncome());
  }

  public CreditReport retrieveCreditReport(long applicationId, String lastName, String email) {
    CreditReport r = bureauClient.fetchReport(lastName, email);
    audit.log(applicationId, "CREDIT_BUREAU", "Credit score " + r.creditScore() + ", defaults " + r.bureauDefaults()
        + ", fraud risk " + r.fraudRisk(), "credit-bureau");
    return r;
  }

  public BankStatementAnalysis analyseBankStatements(long applicationId, double declaredExpenses) {
    BankStatementAnalysis r = bankStatementClient.analyse(declaredExpenses);
    audit.log(applicationId, "BANK_STATEMENTS", "Recurring monthly expenses found: AUD " + r.recurringExpenses(),
        "bank-statement-service");
    return r;
  }

  /** Disposable income, debt-to-income ratio and affordability indicators. */
  public AffordabilityResult calculateAffordability(long applicationId, AffordabilityInput in) {
    double income = in.verifiedIncome();
    double expenses = Math.max(in.monthlyExpenses(), in.recurringExpenses());
    double repayment = MoneyUtils.monthlyRepayment(in.loanAmount(), properties.policy().interestRate(), in.termMonths());
    double disposable = round2(income - expenses - in.monthlyLiabilities());
    double surplus = round2(disposable - repayment);
    double dti = income <= 0 ? 9.99 : Math.round((in.monthlyLiabilities() + repayment) / income * 1000) / 1000.0;
    boolean incomeConsistent = in.monthlyIncome() > 0
        && Math.abs(in.monthlyIncome() - income) / in.monthlyIncome() <= 0.15;
    boolean infoComplete = in.employmentVerified() && incomeConsistent && in.incomeDocumentsProvided();

    audit.log(applicationId, "AFFORDABILITY", "Repayment AUD " + repayment + "/month, disposable income AUD "
        + disposable + ", surplus AUD " + surplus + ", DTI " + Math.round(dti * 100) + "%, information complete: "
        + infoComplete, AuditService.SYSTEM);
    return new AffordabilityResult(repayment, disposable, surplus, dti, infoComplete);
  }

  /** Stores the assessment with the DMN outcome and moves the application to the matching status. */
  public AssessmentRecorded recordAssessment(long applicationId, AssessmentFacts f) {
    CreditDecision d = f.creditDecision();
    assessmentDao.create(new CreditAssessment(null, applicationId, f.employmentVerified(), money(f.verifiedIncome()),
        f.creditScore(), f.bureauDefaults(), f.fraudRisk(), money(f.recurringExpenses()), money(f.disposableIncome()),
        money(f.monthlyRepayment()), BigDecimal.valueOf(f.dti()), money(f.surplus()), d.riskCategory(), d.outcome(),
        d.reason(), null));
    ApplicationStatus status = switch (d.outcome()) {
      case "APPROVE" -> ApplicationStatus.APPROVED_IN_PRINCIPLE;
      case "REFER" -> ApplicationStatus.REFERRED;
      case "FRAUD" -> ApplicationStatus.FRAUD_INVESTIGATION;
      default -> ApplicationStatus.DECLINING;
    };
    applicationDao.updateStatus(applicationId, status, d.reason());
    audit.log(applicationId, "CREDIT_DECISION", d.outcome() + " - " + d.reason() + " (risk " + d.riskCategory() + ")",
        "credit-decision DMN");
    // a DECLINE closes the application at the "Credit approved?" gateway
    return "DECLINE".equals(d.outcome())
        ? new AssessmentRecorded(d.riskCategory(), ApplicationStatus.DECLINED.name(), d.reason())
        : new AssessmentRecorded(d.riskCategory(), "", "");
  }
}
