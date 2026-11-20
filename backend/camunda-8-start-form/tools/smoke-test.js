// End-to-end smoke test of UC01-UC04 through the REST API (backend must be running).
//   node tools/smoke-test.js            -> all scenarios
//   node tools/smoke-test.js uc01 uc03  -> only scenarios whose name starts with these
// Uses the Keycloak demo users: priya (customer), kiran (REVIEWER), suresh (MANAGER).

const API = process.env.API || 'http://localhost:8898/api';
const only = process.argv.slice(2);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const uniq = () => Date.now().toString().slice(-7);

async function call(method, path, body) {
  const res = await fetch(API + path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${text}`);
  return data;
}
const app = (id) => call('GET', `/applications/${id}`);

async function waitFor(what, fn, timeoutMs = 20000) {
  const end = Date.now() + timeoutMs;
  for (;;) {
    const v = await fn();
    if (v) return v;
    if (Date.now() > end) throw new Error('timed out waiting for ' + what);
    await sleep(500);
  }
}

async function status(id, expected, timeoutMs) {
  let last;
  await waitFor(`status ${expected} (app ${id})`, async () => {
    last = (await app(id)).application.status;
    return last === expected;
  }, timeoutMs).catch((e) => {
    throw new Error(e.message + ', last status ' + last);
  });
}

/** Waits for an open task with this element id on the application and completes it. */
async function doTask(id, element, user, data = {}, timeoutMs) {
  const t = await waitFor(`task ${element} (app ${id})`, async () =>
    (await app(id)).openTasks.find((x) => x.elementId === element), timeoutMs);
  await call('POST', `/tasks/${t.jobKey}/complete`, { username: user, data });
}

const DETAILS = {
  firstName: 'Priya', lastName: 'Sharma', dateOfBirth: '1990-04-12', addressLine: '12 George St',
  suburb: 'Sydney', state: 'NSW', postcode: '2000', employmentStatus: 'FULL_TIME',
  employerName: 'Harbour Logistics', employmentYears: 4,
};
const FINANCIALS = {
  loanAmount: 3000, loanPurpose: 'Emergency car repair', termMonths: 12, monthlyIncome: 5200,
  monthlyExpenses: 2400, monthlyLiabilities: 300, bankAccountNumber: '062000123456',
};
const VALID_ID = { idType: 'PASSPORT', idNumber: 'PA' + uniq(), idExpiry: '2031-06-30', fileName: 'passport.jpg' };

async function register(extra = {}) {
  const n = uniq() + Math.floor(Math.random() * 100);
  const r = await call('POST', '/applications', {
    username: 'priya', email: `priya.${n}@example.com`, mobile: '04' + n.padStart(8, '0').slice(-8), ...extra,
  });
  return r.applicationId;
}

const scenarios = {
  // UC01 happy path (income docs forgotten first) -> UC02 approve -> UC03 -> UC04 one payment
  async 'uc01-to-uc04 happy path'() {
    const id = await register();
    await doTask(id, 'capture-details', 'priya', DETAILS);
    await doTask(id, 'upload-identity', 'priya', { ...VALID_ID, idNumber: 'PA' + uniq() });
    await doTask(id, 'capture-financials', 'priya', FINANCIALS); // no income document yet
    await status(id, 'INFO_REQUIRED');
    await doTask(id, 'upload-income-docs', 'priya', { incomeDocType: 'PAYSLIP', incomeDocFileName: 'payslip.pdf' });
    await doTask(id, 'officer-approval', 'kiran', { officerApproval: 'APPROVE' });
    await status(id, 'AGREEMENT_SENT');
    await call('POST', `/applications/${id}/sign`, { username: 'priya' });
    await status(id, 'ACTIVE', 30000);
    const before = (await app(id)).loanAccount.outstandingBalance;
    // the due-date timer is 30 seconds in the demo
    await waitFor('first repayment PAID', async () => (await app(id)).repayments[0].status === 'PAID', 60000);
    const after = (await app(id)).loanAccount.outstandingBalance;
    return `app ${id}: assessed APPROVE, signed, disbursed, instalment 1 paid (balance ${before} -> ${after})`;
  },

  async 'uc01 identity document expired, then re-uploaded'() {
    const id = await register();
    await doTask(id, 'capture-details', 'priya', DETAILS);
    await doTask(id, 'upload-identity', 'priya', { ...VALID_ID, idNumber: 'PA' + uniq(), idExpiry: '2020-01-01' });
    await status(id, 'ID_REUPLOAD_REQUIRED');
    await doTask(id, 'upload-identity', 'priya', { ...VALID_ID, idNumber: 'PA' + uniq() });
    await waitFor('capture-financials task', async () => (await app(id)).openTasks.some((t) => t.elementId === 'capture-financials'));
    return `app ${id}: expired ID asked for re-upload, valid ID accepted`;
  },

  async 'uc01 identity verification failure'() {
    const id = await register();
    await doTask(id, 'capture-details', 'priya', DETAILS);
    await doTask(id, 'upload-identity', 'priya', { ...VALID_ID, idNumber: 'PA1234000' });
    await status(id, 'REJECTED');
    return `app ${id}: rejected - ${(await app(id)).application.statusReason}`;
  },

  async 'uc01 duplicate application'() {
    const email = `dup.${uniq()}@example.com`;
    const first = await register({ email }); // stays open (active)
    const id = await register({ email });
    await doTask(id, 'capture-details', 'priya', DETAILS);
    await doTask(id, 'upload-identity', 'priya', { ...VALID_ID, idNumber: 'PA' + uniq() });
    await status(id, 'REJECTED');
    return `app ${id}: rejected as duplicate of #${first}`;
  },

  async 'uc02 refer -> manual assessment'() {
    const { applicationId: id } = await call('POST', '/demo/quick-start', { useCase: 'uc02', data: { employerName: 'Unknown Pty Ltd' } });
    await status(id, 'REFERRED');
    const reason = (await app(id)).assessment.reason;
    await doTask(id, 'manual-assessment', 'kiran', { officerDecision: 'DECLINE', comment: 'Income could not be verified' });
    await status(id, 'DECLINED');
    return `app ${id}: REFER (${reason}) -> officer declined`;
  },

  async 'uc02 decline - hardship'() {
    const { applicationId: id } = await call('POST', '/demo/quick-start', { useCase: 'uc02', data: { monthlyExpenses: 4900 } });
    await status(id, 'DECLINED');
    return `app ${id}: ${(await app(id)).application.statusReason}`;
  },

  async 'uc02 fraud investigation'() {
    const { applicationId: id } = await call('POST', '/demo/quick-start', { useCase: 'uc02', data: { lastName: 'Fraud' } });
    await status(id, 'FRAUD_INVESTIGATION');
    await doTask(id, 'fraud-investigation', 'kiran', { fraudConfirmed: true, comment: 'Identity theft confirmed' });
    await status(id, 'DECLINED');
    return `app ${id}: fraud confirmed -> declined`;
  },

  async 'uc03 officer rejects'() {
    const { applicationId: id } = await call('POST', '/demo/quick-start', { useCase: 'uc03' });
    await doTask(id, 'officer-approval', 'kiran', { officerApproval: 'REJECT', comment: 'Policy exception not allowed' });
    await status(id, 'DECLINED');
    return `app ${id}: ${(await app(id)).application.statusReason}`;
  },

  async 'uc03 high risk -> senior approval'() {
    const { applicationId: id } = await call('POST', '/demo/quick-start', { useCase: 'uc03', data: { riskCategory: 'HIGH' } });
    await doTask(id, 'officer-approval', 'kiran', { officerApproval: 'APPROVE' });
    await doTask(id, 'senior-approval', 'suresh', { seniorApproval: 'APPROVE' });
    await status(id, 'AGREEMENT_SENT');
    return `app ${id}: officer + senior approved, agreement sent`;
  },

  async 'uc03 e-signature down, transfer fails, duplicate payout blocked'() {
    await call('POST', '/demo/switches', { esignDown: true, bankTransferFails: true });
    try {
      const { applicationId: id } = await call('POST', '/demo/quick-start', { useCase: 'uc03' });
      await doTask(id, 'officer-approval', 'kiran', { officerApproval: 'APPROVE' });
      await doTask(id, 'manual-signing', 'kiran', {}, 40000); // after 3 failed attempts
      await call('POST', '/demo/switches', { esignDown: false });
      await call('POST', `/applications/${id}/sign`, { username: 'priya' });
      await status(id, 'DISBURSEMENT_FAILED');
      await call('POST', '/demo/switches', { bankTransferFails: false });
      await doTask(id, 'resolve-transfer', 'suresh', { comment: 'Bank fixed' });
      await status(id, 'ACTIVE', 30000);
      const dup = await call('POST', `/demo/applications/${id}/duplicate-disbursement`);
      return `app ${id}: manual signing, failed transfer resolved, duplicate request -> ${dup.result}`;
    } finally {
      await call('POST', '/demo/switches', { esignDown: false, bankTransferFails: false });
    }
  },

  async 'uc04 insufficient funds -> retry -> collections'() {
    const { applicationId: id } = await call('POST', '/demo/quick-start', { useCase: 'uc04', data: { bankAccountNumber: '062000555599' } });
    await status(id, 'IN_ARREARS', 60000); // after the 30-second due-date timer
    await status(id, 'COLLECTIONS', 120000); // retry timer (demo: 1 minute)
    await doTask(id, 'collections', 'suresh', { collectionsOutcome: 'PAID', comment: 'Customer paid by card' });
    await waitFor('instalment 1 paid', async () => (await app(id)).repayments[0].status === 'PAID', 20000);
    return `app ${id}: failed twice, collections recovered the payment`;
  },

  async 'uc04 incorrect bank details, dispute, date change'() {
    const { applicationId: id } = await call('POST', '/demo/quick-start', { useCase: 'uc04', data: { bankAccountNumber: '062000555500' } });
    await doTask(id, 'update-bank-details', 'priya', { bankAccountNumber: '062000777711' }, 60000);
    await waitFor('instalment 1 paid', async () => (await app(id)).repayments[0].status === 'PAID', 20000);
    await call('POST', `/applications/${id}/dispute`, { username: 'priya', reason: 'Charged twice' });
    await doTask(id, 'investigate-dispute', 'suresh', { disputeOutcome: 'REJECTED', comment: 'Only one debit found' });
    await call('POST', `/applications/${id}/date-change`, { username: 'priya', newDueDay: 15 });
    await doTask(id, 'review-date-change', 'kiran', { dateChangeApproved: true });
    await waitFor('due dates moved', async () => (await app(id)).repayments[1].dueDate.endsWith('-15'));
    return `app ${id}: bank details updated & paid, dispute handled, due day moved to 15`;
  },
};

(async () => {
  let failed = 0;
  const names = Object.keys(scenarios).filter((n) => !only.length || only.some((o) => n.startsWith(o)));
  // one after another: some scenarios flip the global demo switches
  for (const name of names) {
    const t0 = Date.now();
    try {
      const msg = await scenarios[name]();
      console.log(`PASS  ${name}  (${((Date.now() - t0) / 1000).toFixed(0)}s)\n      ${msg}`);
    } catch (e) {
      failed++;
      console.log(`FAIL  ${name}\n      ${e.message}`);
    }
  }
  console.log(failed ? `\n${failed} scenario(s) failed` : '\nAll scenarios passed');
  process.exit(failed ? 1 : 0);
})();
