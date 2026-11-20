-- MicroLending demo schema for UC01-UC04 (onboarding, assessment, approval/disbursement, repayment)

-- UC01: customer registered with email/mobile + personal, address and employment details
CREATE TABLE customer (
  id                BIGSERIAL PRIMARY KEY,
  username          VARCHAR(100),              -- login that owns the record (Keycloak user)
  email             VARCHAR(150) NOT NULL,
  mobile            VARCHAR(20)  NOT NULL,
  first_name        VARCHAR(100),
  last_name         VARCHAR(100),
  date_of_birth     DATE,
  address_line      VARCHAR(200),
  suburb            VARCHAR(100),
  state             VARCHAR(20),
  postcode          VARCHAR(10),
  employment_status VARCHAR(30),               -- FULL_TIME / PART_TIME / CASUAL / SELF_EMPLOYED / UNEMPLOYED
  employer_name     VARCHAR(150),
  employment_years  NUMERIC(4,1),
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_customer_email ON customer (lower(email));
CREATE INDEX idx_customer_mobile ON customer (mobile);

-- One loan application; status follows the process across UC01-UC04
CREATE TABLE application (
  id                   BIGSERIAL PRIMARY KEY,
  customer_id          BIGINT NOT NULL REFERENCES customer (id),
  username             VARCHAR(100),
  loan_amount          NUMERIC(15,2),
  loan_purpose         VARCHAR(200),
  term_months          INT DEFAULT 12,
  monthly_income       NUMERIC(15,2),
  monthly_expenses     NUMERIC(15,2),
  monthly_liabilities  NUMERIC(15,2),
  bank_account_number  VARCHAR(30),
  status               VARCHAR(40) NOT NULL DEFAULT 'DRAFT',
  status_reason        VARCHAR(300),
  process_instance_key BIGINT,
  created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Identity and income documents (metadata only for the demo)
CREATE TABLE application_document (
  id                  BIGSERIAL PRIMARY KEY,
  application_id      BIGINT NOT NULL REFERENCES application (id),
  doc_type            VARCHAR(30) NOT NULL,    -- PASSPORT / DRIVERS_LICENCE / PAYSLIP / BANK_STATEMENT
  doc_number          VARCHAR(50),
  expiry_date         DATE,
  file_name           VARCHAR(200),
  verification_status VARCHAR(20) DEFAULT 'PENDING', -- PENDING / VERIFIED / FAILED / EXPIRED
  uploaded_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- UC02: results of the automated assessment
CREATE TABLE credit_assessment (
  id                  BIGSERIAL PRIMARY KEY,
  application_id      BIGINT NOT NULL REFERENCES application (id),
  employment_verified BOOLEAN,
  verified_income     NUMERIC(15,2),
  credit_score        INT,
  bureau_defaults     INT,
  fraud_risk          VARCHAR(10),
  recurring_expenses  NUMERIC(15,2),
  disposable_income   NUMERIC(15,2),
  monthly_repayment   NUMERIC(15,2),
  dti                 NUMERIC(6,3),
  surplus             NUMERIC(15,2),
  risk_category       VARCHAR(10),
  outcome             VARCHAR(20),             -- APPROVE / REFER / DECLINE / FRAUD
  reason              VARCHAR(300),
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- UC03: one disbursement per application (unique = duplicate requests are blocked)
CREATE TABLE disbursement (
  id             BIGSERIAL PRIMARY KEY,
  application_id BIGINT NOT NULL UNIQUE REFERENCES application (id),
  amount         NUMERIC(15,2),
  bank_reference VARCHAR(50),
  status         VARCHAR(20),                  -- INITIATED / CONFIRMED / FAILED
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE loan_account (
  id                  BIGSERIAL PRIMARY KEY,
  application_id      BIGINT NOT NULL UNIQUE REFERENCES application (id),
  account_number      VARCHAR(30),
  principal           NUMERIC(15,2),
  interest_rate       NUMERIC(5,2),
  term_months         INT,
  monthly_repayment   NUMERIC(15,2),
  outstanding_balance NUMERIC(15,2),
  agreement_status    VARCHAR(20),             -- GENERATED / SENT / SIGNED / EXPIRED
  status              VARCHAR(20),             -- PENDING / ACTIVE / IN_ARREARS / COLLECTIONS / CLOSED
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- UC04: repayment schedule
CREATE TABLE repayment (
  id                  BIGSERIAL PRIMARY KEY,
  application_id      BIGINT NOT NULL REFERENCES application (id),
  instalment_no       INT NOT NULL,
  due_date            DATE NOT NULL,
  amount              NUMERIC(15,2) NOT NULL,
  status              VARCHAR(20) DEFAULT 'SCHEDULED', -- SCHEDULED / PAID / FAILED / COLLECTIONS
  attempts            INT DEFAULT 0,
  last_failure_reason VARCHAR(100),
  paid_at             TIMESTAMP
);

-- Open human tasks (Camunda user tasks picked up by the backend)
CREATE TABLE work_item (
  id                   BIGSERIAL PRIMARY KEY,
  job_key              BIGINT NOT NULL UNIQUE,
  process_instance_key BIGINT,
  bpmn_process_id      VARCHAR(100),
  element_id           VARCHAR(100),
  name                 VARCHAR(200),
  application_id       BIGINT,
  assignee             VARCHAR(100),
  candidate_group      VARCHAR(100),
  status               VARCHAR(20) DEFAULT 'OPEN',  -- OPEN / COMPLETED / CANCELED
  completed_by         VARCHAR(100),
  created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at         TIMESTAMP
);

-- In-app notifications to the customer (stands in for email/SMS)
CREATE TABLE notification (
  id             BIGSERIAL PRIMARY KEY,
  application_id BIGINT,
  username       VARCHAR(100),
  title          VARCHAR(200),
  message        VARCHAR(1000),
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit trail: every customer interaction, decision and payment event
CREATE TABLE event_log (
  id             BIGSERIAL PRIMARY KEY,
  application_id BIGINT,
  event_type     VARCHAR(50),
  description    VARCHAR(1000),
  actor          VARCHAR(100),
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
