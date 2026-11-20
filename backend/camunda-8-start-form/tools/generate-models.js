// Generates the MicroLending BPMN model into src/main/resources/model.
// Run from the backend folder:   node tools/generate-models.js
//
// ONE process for the whole loan life cycle. Each use case is an expanded sub-process, stacked top to bottom:
//   UC01 onboarding -> UC02 credit assessment -> UC03 approval & disbursement -> UC04 repayments.
// After UC01-UC03 one simple rule decides: if nothing set a closeReason we continue, otherwise the application
// is closed and the customer notified ("close-application").
// Gateway conditions are always mutually exclusive: Zeebe does not guarantee the order in which it checks them.

const fs = require('fs');
const path = require('path');
const { ProcessModel } = require('./bpmn-builder');

const cx = ProcessModel.cx;
const cy = ProcessModel.cy;
const CUSTOMER = { assignee: '=customerUsername', group: 'customer' };
const CONTINUE = '=closeReason = ""';

// top row of each use-case band
const B1 = 0;
const B2 = 6;
const B3 = 11;
const B4 = 16.6;

const p = new ProcessModel('microlending-loan', 'MicroLending - loan life cycle (UC01-UC04)');

p.add({ id: 'start', type: 'start', name: 'Customer registered (email / mobile)', c: 0, r: B1 + 1, tone: 'good' });

// ---------------------------------------------------------------------------
// UC01 - Digital loan application and customer onboarding
// ---------------------------------------------------------------------------
p.sub('uc01', 'UC01 - Loan application & onboarding', {}, (s) => {
  const r = B1 + 1;
  s.add({ id: 'uc01-start', type: 'start', c: 1, r });
  s.add({ id: 'capture-details', type: 'user', name: 'Enter personal, address & employment details', c: 2, r, ...CUSTOMER });
  s.add({ id: 'upload-identity', type: 'user', name: 'Upload identity document', c: 3, r, ...CUSTOMER });
  s.add({ id: 'verify-identity', type: 'service', job: 'verify-identity', name: 'Verify identity & document', c: 4, r });
  s.add({ id: 'gw-identity', type: 'xgw', name: 'Identity verified?', c: 5, r, labelSide: 'topLeft' });
  s.add({ id: 'uc01-end-identity', type: 'end', name: 'Identity not verified', c: 5, r: r - 1, tone: 'bad' });
  s.add({ id: 'check-duplicate', type: 'service', job: 'check-duplicate', name: 'Check for duplicate customer', c: 6, r });
  s.add({ id: 'gw-duplicate', type: 'xgw', name: 'Duplicate?', c: 7, r });
  s.add({ id: 'uc01-end-duplicate', type: 'end', name: 'Duplicate application', c: 7, r: r - 1, tone: 'bad' });
  s.add({ id: 'capture-financials', type: 'user', name: 'Enter income, expenses, debts & loan purpose', c: 8, r, ...CUSTOMER });
  s.add({ id: 'validate-application', type: 'service', job: 'validate-application', name: 'Validate mandatory information', c: 9, r });
  s.add({ id: 'gw-complete', type: 'xgw', name: 'Information complete?', c: 10, r });
  s.add({ id: 'upload-income-docs', type: 'user', name: 'Upload missing income documents', c: 10, r: r + 1.1, ...CUSTOMER });
  s.add({ id: 'uc01-end', type: 'end', name: 'Application complete', c: 11, r });
});
p.flow('uc01-start', 'capture-details');
p.flow('capture-details', 'upload-identity');
p.flow('upload-identity', 'verify-identity');
p.flow('verify-identity', 'gw-identity');
p.flow('gw-identity', 'check-duplicate', { name: 'Yes', cond: '=idStatus = "VERIFIED"' });
p.flow('gw-identity', 'upload-identity', {
  name: 'Expired / invalid - upload again', cond: '=idStatus = "EXPIRED"',
  wp: [[cx(5), cy(B1 + 1.75)], [cx(3), cy(B1 + 1.75)]],
});
p.flow('gw-identity', 'uc01-end-identity', { name: 'Failed', def: true });
p.flow('check-duplicate', 'gw-duplicate');
p.flow('gw-duplicate', 'uc01-end-duplicate', { name: 'Yes', cond: '=duplicateFound = true' });
p.flow('gw-duplicate', 'capture-financials', { name: 'No', def: true });
p.flow('capture-financials', 'validate-application');
p.flow('validate-application', 'gw-complete');
p.flow('gw-complete', 'uc01-end', { name: 'Yes', cond: '=validationStatus = "COMPLETE"' });
p.flow('gw-complete', 'upload-income-docs', { name: 'No', def: true });
p.flow('upload-income-docs', 'validate-application');

// abandon & resume
p.add({
  id: 'inactive-reminder', type: 'boundary', event: 'timer', interrupting: false, duration: '=resumeReminderAfter',
  name: 'Customer inactive', attachedTo: 'uc01', atC: 3, tone: 'warn',
});
p.add({
  id: 'send-resume-reminder', type: 'service', job: 'notify', name: 'Remind customer to resume', c: 3, r: B1 + 3.6, tone: 'warn',
  headers: { title: 'Finish your loan application', message: 'Your application is saved. Log in to continue where you left off.' },
});
p.add({ id: 'end-reminder', type: 'end', name: 'Reminder sent', c: 4, r: B1 + 3.6 });
p.add({
  id: 'abandoned', type: 'boundary', event: 'timer', duration: '=abandonAfter',
  name: 'Application abandoned', attachedTo: 'uc01', atC: 6, tone: 'warn',
});
p.add({ id: 'expire-application', type: 'service', job: 'expire-application', name: 'Expire application & notify customer', c: 6, r: B1 + 3.6, tone: 'warn' });
p.add({ id: 'end-expired', type: 'end', name: 'Application expired', c: 7, r: B1 + 3.6, tone: 'bad' });
p.flow('inactive-reminder', 'send-resume-reminder');
p.flow('send-resume-reminder', 'end-reminder');
p.flow('abandoned', 'expire-application');
p.flow('expire-application', 'end-expired');

// gate 1
p.add({ id: 'gw-accepted', type: 'xgw', name: 'Application accepted?', c: 12, r: B1 + 1 });
p.add({ id: 'close-uc01', type: 'service', job: 'close-application', name: 'Reject application & notify customer', c: 13, r: B1 + 1, tone: 'warn' });
p.add({ id: 'end-rejected', type: 'end', name: 'Application rejected', c: 14, r: B1 + 1, tone: 'bad' });
p.flow('start', 'uc01');
p.flow('uc01', 'gw-accepted');
p.flow('gw-accepted', 'close-uc01', { name: 'No', def: true });
p.flow('close-uc01', 'end-rejected');

// ---------------------------------------------------------------------------
// UC02 - Automated credit assessment and loan decisioning
// ---------------------------------------------------------------------------
p.sub('uc02', 'UC02 - Automated credit assessment', {}, (s) => {
  const r = B2 + 1;
  s.add({ id: 'uc02-start', type: 'start', c: 1, r });
  s.add({ id: 'retrieve-customer', type: 'service', job: 'retrieve-customer', name: 'Retrieve customer & verify employment / income', c: 2, r });
  s.add({ id: 'credit-bureau', type: 'service', job: 'retrieve-credit-report', name: 'Retrieve credit bureau report', c: 3, r });
  s.add({ id: 'bank-statements', type: 'service', job: 'analyse-bank-statements', name: 'Analyse bank statements', c: 4, r });
  s.add({ id: 'affordability', type: 'service', job: 'calculate-affordability', name: 'Calculate disposable income, DTI & affordability', c: 5, r });
  s.add({ id: 'credit-decision', type: 'rule', decision: 'credit-decision', result: 'creditDecision', name: 'Credit decision (DMN)', c: 6, r });
  s.add({ id: 'record-assessment', type: 'service', job: 'record-assessment', name: 'Record decision', c: 7, r });
  s.add({ id: 'gw-decision', type: 'xgw', name: 'Outcome?', c: 8, r });
  s.add({ id: 'fraud-investigation', type: 'user', group: 'fraud-team', name: 'Fraud investigation', c: 9, r: r - 1 });
  s.add({ id: 'manual-assessment', type: 'user', group: 'credit-officer', name: 'Manual assessment (credit officer)', c: 9, r: r + 1 });
  s.add({ id: 'uc02-end', type: 'end', name: 'Assessment complete', c: 10, r });
});
p.flow('uc02-start', 'retrieve-customer');
p.flow('retrieve-customer', 'credit-bureau');
p.flow('credit-bureau', 'bank-statements');
p.flow('bank-statements', 'affordability');
p.flow('affordability', 'credit-decision');
p.flow('credit-decision', 'record-assessment');
p.flow('record-assessment', 'gw-decision');
p.flow('gw-decision', 'fraud-investigation', { name: 'Fraud', cond: '=creditDecision.outcome = "FRAUD"' });
p.flow('gw-decision', 'manual-assessment', { name: 'Refer', cond: '=creditDecision.outcome = "REFER"' });
p.flow('gw-decision', 'uc02-end', { name: 'Approve / Decline', def: true });
p.flow('fraud-investigation', 'uc02-end');
p.flow('manual-assessment', 'uc02-end');

// gate 2
p.add({ id: 'gw-approved', type: 'xgw', name: 'Credit approved?', c: 12, r: B2 + 1 });
p.add({ id: 'close-uc02', type: 'service', job: 'close-application', name: 'Decline & notify customer (with reason)', c: 13, r: B2 + 1, tone: 'warn' });
p.add({ id: 'end-declined', type: 'end', name: 'Application declined', c: 14, r: B2 + 1, tone: 'bad' });
p.flow('gw-accepted', 'uc02', {
  name: 'Yes', cond: CONTINUE,
  wp: [[cx(12), cy(B1 + 4.6)], [cx(0), cy(B1 + 4.6)], [cx(0), cy(B2 + 1)]],
});
p.flow('uc02', 'gw-approved');
p.flow('gw-approved', 'close-uc02', { name: 'No', def: true });
p.flow('close-uc02', 'end-declined');

// ---------------------------------------------------------------------------
// UC03 - Loan approval, contract generation and disbursement
// ---------------------------------------------------------------------------
p.sub('uc03', 'UC03 - Loan approval, agreement & disbursement', {}, (s) => {
  const r = B3 + 1;
  s.add({ id: 'uc03-start', type: 'start', c: 1, r });
  s.add({ id: 'approval-level', type: 'rule', decision: 'approval-level', result: 'approvalLevel', name: 'Check approval level (DMN)', c: 2, r });
  s.add({ id: 'officer-approval', type: 'user', group: 'credit-officer', name: 'Credit officer approval', c: 3, r });
  s.add({ id: 'gw-officer', type: 'xgw', name: 'Officer decision?', c: 4, r });
  s.add({ id: 'uc03-end-rejected', type: 'end', name: 'Rejected', c: 4, r: r + 1.2, tone: 'bad' });
  s.add({ id: 'senior-approval', type: 'user', group: 'senior-approver', name: 'Senior approval', c: 5, r: r - 1 });
  s.add({ id: 'gw-senior', type: 'xgw', name: 'Senior decision?', c: 6, r: r - 1 });
  s.add({ id: 'uc03-end-senior-rejected', type: 'end', name: 'Rejected', c: 7, r: r - 1, tone: 'bad' });
  s.add({ id: 'generate-agreement', type: 'service', job: 'generate-agreement', name: 'Generate loan offer & agreement', c: 7, r });
  s.add({ id: 'send-esignature', type: 'service', job: 'send-for-esignature', name: 'Send agreement for e-signature', c: 8, r, retries: 3 });
  s.add({ id: 'manual-signing', type: 'user', group: 'credit-officer', name: 'Arrange manual signing', c: 8, r: r - 1 });
  s.add({ id: 'wait-signature', type: 'receive', message: 'agreement-signed', name: 'Wait for customer signature', c: 9, r });
  s.add({ id: 'withdraw-offer', type: 'service', job: 'withdraw-offer', name: 'Withdraw offer', c: 9, r: r + 1.4, tone: 'warn' });
  s.add({ id: 'uc03-end-expired', type: 'end', name: 'Not signed in time', c: 9, r: r + 2.4, tone: 'bad' });
  s.add({ id: 'gw-disburse', type: 'xgw', c: 10, r });
  s.add({ id: 'disburse', type: 'service', job: 'disburse-funds', name: 'Pay out loan (bank transfer)', c: 11, r });
  s.add({ id: 'resolve-transfer', type: 'user', group: 'operations', name: 'Resolve failed bank transfer', c: 11, r: r + 1.4 });
  s.add({ id: 'wait-payment', type: 'receive', message: 'disbursement-confirmed', name: 'Receive payment confirmation', c: 12, r });
  s.add({ id: 'activate-loan', type: 'service', job: 'activate-loan-account', name: 'Activate loan account & notify customer', c: 13, r });
  s.add({ id: 'uc03-end', type: 'end', name: 'Loan disbursed', c: 14, r });
});
p.add({
  id: 'esign-down', type: 'boundary', event: 'error', errorCode: 'ESIGN_UNAVAILABLE',
  name: 'E-signature unavailable', attachedTo: 'send-esignature', side: 'top', atC: 8, tone: 'warn',
});
p.add({
  id: 'sign-deadline', type: 'boundary', event: 'timer', duration: '=signDeadline',
  name: 'Signing deadline', attachedTo: 'wait-signature', atC: 9, tone: 'warn',
});
p.add({
  id: 'transfer-failed', type: 'boundary', event: 'error', errorCode: 'TRANSFER_FAILED',
  name: 'Transfer failed', attachedTo: 'disburse', atC: 11, tone: 'warn',
});
p.flow('uc03-start', 'approval-level');
p.flow('approval-level', 'officer-approval');
p.flow('officer-approval', 'gw-officer');
p.flow('gw-officer', 'senior-approval', {
  name: 'Approve - senior needed', cond: '=officerApproval = "APPROVE" and approvalLevel = "SENIOR"',
});
p.flow('gw-officer', 'generate-agreement', {
  name: 'Approve', cond: '=officerApproval = "APPROVE" and approvalLevel != "SENIOR"',
});
p.flow('gw-officer', 'uc03-end-rejected', { name: 'Reject', def: true });
p.flow('senior-approval', 'gw-senior');
p.flow('gw-senior', 'generate-agreement', { name: 'Approve', cond: '=seniorApproval = "APPROVE"' });
p.flow('gw-senior', 'uc03-end-senior-rejected', { name: 'Reject', def: true });
p.flow('generate-agreement', 'send-esignature');
p.flow('send-esignature', 'wait-signature');
p.flow('esign-down', 'manual-signing');
p.flow('manual-signing', 'wait-signature');
p.flow('wait-signature', 'gw-disburse');
p.flow('sign-deadline', 'withdraw-offer');
p.flow('withdraw-offer', 'uc03-end-expired');
p.flow('gw-disburse', 'disburse');
p.flow('disburse', 'wait-payment');
p.flow('transfer-failed', 'resolve-transfer');
p.flow('resolve-transfer', 'gw-disburse', { name: 'Retry' });
p.flow('wait-payment', 'activate-loan');
p.flow('activate-loan', 'uc03-end');

// gate 3
p.add({ id: 'gw-disbursed', type: 'xgw', name: 'Loan disbursed?', c: 16, r: B3 + 1 });
p.add({ id: 'close-uc03', type: 'service', job: 'close-application', name: 'Close application & notify customer', c: 17, r: B3 + 1, tone: 'warn' });
p.add({ id: 'end-closed', type: 'end', name: 'Application closed', c: 18, r: B3 + 1, tone: 'bad' });
p.flow('gw-approved', 'uc03', {
  name: 'Yes', cond: CONTINUE,
  wp: [[cx(12), cy(B2 + 3.4)], [cx(0), cy(B2 + 3.4)], [cx(0), cy(B3 + 1)]],
});
p.flow('uc03', 'gw-disbursed');
p.flow('gw-disbursed', 'close-uc03', { name: 'No', def: true });
p.flow('close-uc03', 'end-closed');

// ---------------------------------------------------------------------------
// UC04 - Repayment management and delinquency handling
// ---------------------------------------------------------------------------
p.sub('uc04', 'UC04 - Repayments & collections', {}, (s) => {
  const r = B4 + 1;
  s.add({ id: 'uc04-start', type: 'start', c: 1, r });
  s.add({ id: 'next-repayment', type: 'service', job: 'get-next-repayment', name: 'Get next repayment from schedule', c: 2, r });
  s.add({ id: 'gw-due', type: 'xgw', name: 'Repayment due?', c: 3, r });
  s.add({ id: 'close-loan', type: 'service', job: 'close-loan-account', name: 'Close loan account', c: 4, r: r - 1 });
  s.add({ id: 'uc04-end-repaid', type: 'end', name: 'Loan fully repaid', c: 5, r: r - 1, tone: 'good' });
  s.add({ id: 'send-reminder', type: 'service', job: 'send-repayment-reminder', name: 'Send repayment reminder', c: 4, r });
  s.add({ id: 'due-date', type: 'timer', duration: '=dueDateWait', name: 'Due date', c: 5, r });
  s.add({ id: 'gw-collect', type: 'xgw', c: 6, r });
  s.add({ id: 'direct-debit', type: 'service', job: 'initiate-direct-debit', name: 'Collect by direct debit', c: 7, r });
  s.add({ id: 'wait-result', type: 'receive', message: 'payment-result', name: 'Receive payment result', c: 8, r });
  s.add({ id: 'gw-paid', type: 'xgw', name: 'Paid?', c: 9, r });
  s.add({ id: 'update-balance', type: 'service', job: 'update-outstanding-balance', name: 'Update loan balance', c: 10, r });
  s.add({ id: 'notify-failed', type: 'service', job: 'notify-payment-failed', name: 'Notify customer: payment failed', c: 9, r: r + 1, tone: 'warn' });
  s.add({ id: 'gw-failure', type: 'xgw', name: 'Why did it fail?', c: 9, r: r + 2 });
  s.add({ id: 'update-bank-details', type: 'user', name: 'Customer updates bank details', c: 8, r: r + 2, ...CUSTOMER });
  s.add({ id: 'retry-wait', type: 'timer', duration: '=paymentRetryDelay', name: 'Wait, then retry', c: 9, r: r + 3, tone: 'warn' });
  s.add({ id: 'collections', type: 'user', group: 'collections', name: 'Collections follow-up', c: 10, r: r + 2 });
  s.add({ id: 'gw-recovered', type: 'xgw', name: 'Recovered?', c: 11, r: r + 2 });
  s.add({ id: 'uc04-end-defaulted', type: 'end', name: 'Loan defaulted', c: 12, r: r + 2, tone: 'bad' });

  // customer requests that can arrive at any time while the loan runs
  s.sub('dispute', 'Customer disputes a repayment', { eventSub: true }, (e) => {
    e.add({ id: 'dispute-start', type: 'start', message: 'repayment-disputed', interrupting: false, name: 'Dispute raised', c: 1, r: r + 4.6 });
    e.add({ id: 'investigate-dispute', type: 'user', group: 'collections', name: 'Investigate dispute', c: 2, r: r + 4.6 });
    e.add({ id: 'record-dispute', type: 'service', job: 'record-dispute-outcome', name: 'Record outcome & notify customer', c: 3, r: r + 4.6 });
    e.add({ id: 'dispute-end', type: 'end', name: 'Dispute closed', c: 4, r: r + 4.6 });
  });
  s.sub('date-change', 'Customer asks for a new repayment date', { eventSub: true }, (e) => {
    e.add({ id: 'date-change-start', type: 'start', message: 'repayment-date-change', interrupting: false, name: 'New date requested', c: 6, r: r + 4.6 });
    e.add({ id: 'review-date-change', type: 'user', group: 'credit-officer', name: 'Review date change', c: 7, r: r + 4.6 });
    e.add({ id: 'update-schedule', type: 'service', job: 'update-repayment-schedule', name: 'Update schedule & notify customer', c: 8, r: r + 4.6 });
    e.add({ id: 'date-change-end', type: 'end', name: 'Request handled', c: 9, r: r + 4.6 });
  });
});
p.flow('uc04-start', 'next-repayment');
p.flow('next-repayment', 'gw-due');
p.flow('gw-due', 'send-reminder', { name: 'Yes', cond: '=hasNextRepayment = true' });
p.flow('gw-due', 'close-loan', { name: 'No', def: true });
p.flow('close-loan', 'uc04-end-repaid');
p.flow('send-reminder', 'due-date');
p.flow('due-date', 'gw-collect');
p.flow('gw-collect', 'direct-debit');
p.flow('direct-debit', 'wait-result');
p.flow('wait-result', 'gw-paid');
p.flow('gw-paid', 'update-balance', { name: 'Yes', cond: '=paymentStatus = "SUCCESS"' });
p.flow('gw-paid', 'notify-failed', { name: 'No', def: true });
p.flow('update-balance', 'next-repayment', { name: 'Next instalment', wp: [[cx(10), cy(B4 - 0.55)], [cx(2), cy(B4 - 0.55)]] });
p.flow('notify-failed', 'gw-failure');
p.flow('gw-failure', 'update-bank-details', { name: 'Wrong bank details', cond: '=failureReason = "INCORRECT_ACCOUNT"' });
p.flow('gw-failure', 'retry-wait', {
  name: 'No funds - retry', cond: '=failureReason != "INCORRECT_ACCOUNT" and attempts < maxPaymentAttempts',
});
p.flow('gw-failure', 'collections', { name: 'Failed again', def: true });
p.flow('update-bank-details', 'gw-collect');
p.flow('retry-wait', 'gw-collect');
p.flow('collections', 'gw-recovered');
p.flow('gw-recovered', 'update-balance', { name: 'Yes', cond: '=collectionsOutcome = "PAID"' });
p.flow('gw-recovered', 'uc04-end-defaulted', { name: 'No', def: true });
p.flow('dispute-start', 'investigate-dispute');
p.flow('investigate-dispute', 'record-dispute');
p.flow('record-dispute', 'dispute-end');
p.flow('date-change-start', 'review-date-change');
p.flow('review-date-change', 'update-schedule');
p.flow('update-schedule', 'date-change-end');

p.add({ id: 'end-loan-closed', type: 'end', name: 'Loan closed', c: 15, r: B4 + 1, tone: 'good' });
p.flow('gw-disbursed', 'uc04', {
  name: 'Yes', cond: CONTINUE,
  wp: [[cx(16), cy(B3 + 4.3)], [cx(0), cy(B3 + 4.3)], [cx(0), cy(B4 + 1)]],
});
p.flow('uc04', 'end-loan-closed');

const out = path.join(__dirname, '..', 'src', 'main', 'resources', 'model', p.id + '.bpmn');
fs.writeFileSync(out, p.toXml());
console.log('wrote', path.relative(process.cwd(), out));
