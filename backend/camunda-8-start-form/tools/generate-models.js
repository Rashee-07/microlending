// Generates the MicroLending BPMN model into src/main/resources/model.
// Run from the backend folder:   node tools/generate-models.js
//
// Release 1 (branch us-2): UC01 onboarding -> UC02 credit assessment, each an expanded sub-process.
// The full life cycle with UC03 approval & disbursement and UC04 repayments lives on branch us-1.
// After UC01 and UC02 one simple rule decides: if nothing set a closeReason we continue, otherwise the application
// is closed and the customer notified ("close-application"). Approved applications end "approved in principle".
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

const p = new ProcessModel('microlending-loan', 'MicroLending - loan application (UC01-UC02)');
// Camunda forms of the user tasks (src/main/resources/forms/<task id>.form), embedded into the BPMN.
// The MicroLending app renders its own screens; these forms show the same fields in Modeler / Tasklist.
p.formsDir = path.join(__dirname, '..', 'src', 'main', 'resources', 'forms');

p.add({ id: 'start', type: 'start', name: 'Customer registered (email / mobile)', c: 0, r: B1 + 1, tone: 'good' });

// ---------------------------------------------------------------------------
// UC01 - Digital loan application and customer onboarding
// ---------------------------------------------------------------------------
p.sub('uc01', 'Loan application & onboarding', {}, (s) => {
  const r = B1 + 1;
  s.add({ id: 'uc01-start', type: 'start', c: 1, r });
  s.add({ id: 'capture-details', type: 'user', form: 'capture-details', name: 'Enter personal, address & employment details', c: 2, r, ...CUSTOMER });
  s.add({ id: 'upload-identity', type: 'user', form: 'upload-identity', name: 'Upload identity document', c: 3, r, ...CUSTOMER });
  s.add({ id: 'verify-identity', type: 'service', job: 'verify-identity', name: 'Verify identity & document', c: 4, r });
  s.add({ id: 'gw-identity', type: 'xgw', name: 'Identity verified?', c: 5, r, labelSide: 'topLeft' });
  s.add({ id: 'uc01-end-identity', type: 'end', name: 'Identity not verified', c: 5, r: r - 1, tone: 'bad' });
  s.add({ id: 'check-duplicate', type: 'service', job: 'check-duplicate', name: 'Check for duplicate customer', c: 6, r });
  s.add({ id: 'gw-duplicate', type: 'xgw', name: 'Duplicate?', c: 7, r });
  s.add({ id: 'uc01-end-duplicate', type: 'end', name: 'Duplicate application', c: 7, r: r - 1, tone: 'bad' });
  s.add({ id: 'capture-financials', type: 'user', form: 'capture-financials', name: 'Enter income, expenses, debts & loan purpose', c: 8, r, ...CUSTOMER });
  s.add({ id: 'validate-application', type: 'service', job: 'validate-application', name: 'Validate mandatory information', c: 9, r });
  s.add({ id: 'gw-complete', type: 'xgw', name: 'Information complete?', c: 10, r });
  s.add({ id: 'upload-income-docs', type: 'user', form: 'upload-income-docs', name: 'Upload missing income documents', c: 10, r: r + 1.1, ...CUSTOMER });
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
  s.add({ id: 'fraud-investigation', type: 'user', form: 'fraud-investigation', group: 'fraud-team', name: 'Fraud investigation', c: 9, r: r - 1 });
  s.add({ id: 'manual-assessment', type: 'user', form: 'manual-assessment', group: 'credit-officer', name: 'Manual assessment (credit officer)', c: 9, r: r + 1 });
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

// Release 1 ends here: approved applications are approved in principle (UC03 approval & payout and
// UC04 repayments come in a later release - see branch us-1 for the full life cycle).
p.add({ id: 'approve-in-principle', type: 'service', job: 'approve-in-principle', name: 'Approved in principle - notify customer', c: 12, r: B2 + 3.4, tone: 'good' });
p.add({ id: 'end-approved', type: 'end', name: 'Approved in principle', c: 13, r: B2 + 3.4, tone: 'good' });
p.flow('gw-approved', 'approve-in-principle', { name: 'Yes', cond: CONTINUE });
p.flow('approve-in-principle', 'end-approved');

const out = path.join(__dirname, '..', 'src', 'main', 'resources', 'model', p.id + '.bpmn');
fs.writeFileSync(out, p.toXml());
console.log('wrote', path.relative(process.cwd(), out));
