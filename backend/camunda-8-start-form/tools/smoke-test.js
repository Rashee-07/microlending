// End-to-end smoke test of release 1 (UC01-UC02) through the REST API (backend must be running).
//   node tools/smoke-test.js            -> all scenarios
//   node tools/smoke-test.js uc01       -> only scenarios whose name starts with these
// Uses the Keycloak demo users: priya (customer), kiran (REVIEWER).

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
  // UC01 happy path (income docs forgotten first) -> UC02 approve -> approved in principle
  async 'uc01-to-uc02 happy path'() {
    const id = await register();
    await doTask(id, 'capture-details', 'priya', DETAILS);
    await doTask(id, 'upload-identity', 'priya', { ...VALID_ID, idNumber: 'PA' + uniq() });
    await doTask(id, 'capture-financials', 'priya', FINANCIALS); // no income document yet
    await status(id, 'INFO_REQUIRED');
    await doTask(id, 'upload-income-docs', 'priya', { incomeDocType: 'PAYSLIP', incomeDocFileName: 'payslip.pdf' });
    await status(id, 'APPROVED_IN_PRINCIPLE');
    return `app ${id}: missing payslip uploaded, assessed ${(await app(id)).assessment.outcome} -> approved in principle`;
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

  async 'uc02 refer -> officer approves -> approved in principle'() {
    const { applicationId: id } = await call('POST', '/demo/quick-start', { useCase: 'uc02', data: { lastName: 'Risky' } });
    await status(id, 'REFERRED');
    await doTask(id, 'manual-assessment', 'kiran', { officerDecision: 'APPROVE' });
    await status(id, 'APPROVED_IN_PRINCIPLE');
    return `app ${id}: low credit score referred -> officer approved -> approved in principle`;
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
};

(async () => {
  let failed = 0;
  const names = Object.keys(scenarios).filter((n) => !only.length || only.some((o) => n.startsWith(o)));
  // one after another, so the output stays readable
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
