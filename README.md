# microlending
loan origination assessment

[![CI](https://github.com/Rashee-07/microlending/actions/workflows/ci.yml/badge.svg?branch=us-2)](https://github.com/Rashee-07/microlending/actions/workflows/ci.yml)

## Releases

| Branch | Scope |
|---|---|
| `us-2` | **Release 1** – UC01 application & onboarding and UC02 credit assessment. Approved applications end *Approved in principle*. |
| `us-1` | **Full version** – UC01–UC04: adds UC03 approval, agreement & payout and UC04 repayments & collections. |

Both branches use the same local database and Zeebe. After switching branch, restart the backend and use
**Demo panel → Reset test data**.

Demo guides: `docs/DEMO-SCRIPT.md` and `backend/camunda-8-start-form/docs/DEMO-TRIGGERS-RELEASE-1.md`.

## CI

`.github/workflows/ci.yml` (GitHub Actions) runs on pushes to `us-1` / `us-2` and on pull requests:

| Job | What it does |
|---|---|
| `backend` | `./mvnw -B verify` - unit tests (BPMN/DMN vs job workers, money maths) and the executable jar |
| `frontend` | `npm test`, then `npm run build` |
| `e2e` | Starts Zeebe + Postgres, runs the backend jar and `tools/smoke-test.js` (all UC01/UC02 scenarios) |
| `publish` | Pushes only: builds and pushes `ghcr.io/rashee-07/microlending-backend` and `-frontend`, tagged with the branch and `sha-<commit>` |

Run the same checks locally:

```
cd backend/camunda-8-start-form && ./mvnw verify        # Windows: mvnw.cmd verify
cd frontend && npm test -- --watchAll=false
```

Run the published images against the local Docker stack (`camunda-local`):

```
docker run -p 8898:8898 -e ZEEBE_ADDRESS=host.docker.internal:26500 \
  -e DB_URL=jdbc:postgresql://host.docker.internal:5435/microlending \
  -e KEYCLOAK_TOKEN_URL=http://host.docker.internal:18080/auth/realms/microlending/protocol/openid-connect/token \
  ghcr.io/rashee-07/microlending-backend:us-2
docker run -p 3077:3077 ghcr.io/rashee-07/microlending-frontend:us-2
```
