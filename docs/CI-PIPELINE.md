# MicroLending – CI pipeline notes

**Branch:** `us-2` · **Platform:** GitHub Actions · **Workflow:** `.github/workflows/ci.yml`
**Commits:** `79540f8` (pipeline, tests, Docker), `bec8500` (Maven download fix)
**First green run:** https://github.com/Rashee-07/microlending/actions/runs/45371510543

---

## 1. What the pipeline does

```
push to us-1/us-2, or PR into main/us-1/us-2
        │
        ├── backend   (build + unit tests, ~40s) ──┐
        │                                          ├── e2e (smoke test, ~45s) ──┐
        └── frontend  (tests + build, ~30s) ───────┼────────────────────────────┤
                                                   │                            ▼
                                                   └──────────────► publish (push only, ~90s)
                                                                    backend + frontend images → GHCR
```

| Job | Runs | What it checks |
|---|---|---|
| `backend` | always | `./mvnw -B verify`: compiles, runs unit tests, builds the executable jar |
| `frontend` | always | `npm test` (Jest) and `npm run build` |
| `e2e` | after `backend` | Starts Zeebe + Postgres, runs the jar, runs `tools/smoke-test.js` (8 UC01/UC02 scenarios) |
| `publish` | pushes only, after all three | Builds and pushes `ghcr.io/rashee-07/microlending-backend` and `-frontend` |

Images are tagged with the branch (`us-2`) and the commit (`sha-bec8500`).
Pull requests run the tests but never publish.

---

## 2. Files added or changed

| File | Change |
|---|---|
| `.github/workflows/ci.yml` | **New.** The pipeline |
| `backend/camunda-8-start-form/mvnw`, `mvnw.cmd`, `.mvn/wrapper/` | **New.** Maven wrapper (no Maven install needed) |
| `backend/camunda-8-start-form/.mvn/settings.xml`, `.mvn/maven.config` | **New.** Send every Maven download to Maven Central |
| `backend/camunda-8-start-form/pom.xml` | Test dependency, Surefire version, `repackage` goal |
| `backend/camunda-8-start-form/src/main/resources/application.properties` | Connection settings overridable by env vars |
| `backend/camunda-8-start-form/src/test/.../ProcessModelTest.java` | **New.** BPMN/DMN vs Java test |
| `backend/camunda-8-start-form/src/test/.../MoneyUtilsTest.java` | **New.** Repayment maths test |
| `backend/camunda-8-start-form/Dockerfile`, `.dockerignore` | **New.** Backend image |
| `frontend/Dockerfile`, `.dockerignore` | **New.** Frontend image |
| `frontend/src/App.test.js` | Replaced the broken default CRA test |
| `frontend/package.json` | Jest mapping for axios |
| `.gitignore` | **New.** Ignores `backend/.metadata/` (Eclipse workspace, removed from the repo) |
| `README.md` | CI badge and CI section |

---

## 3. Backend changes

### 3.1 Settings from environment variables (`application.properties`)

The local defaults are unchanged; CI and Docker override them.

```properties
zeebe.client.broker.gateway-address=${ZEEBE_ADDRESS:localhost:26500}
spring.datasource.url=${DB_URL:jdbc:postgresql://localhost:5435/microlending}
spring.datasource.username=${DB_USER:microlending}
spring.datasource.password=${DB_PASSWORD:microlending}
camunda.tasklist.url=${TASKLIST_URL:http://localhost:8082}
camunda.keycloak.url=${KEYCLOAK_URL:http://localhost:18080}
camunda.tasklist.client-id=${MICROLENDING_CLIENT_ID:microlending}
camunda.tasklist.client-secret=${MICROLENDING_CLIENT_SECRET:}
login.keycloak.token-url=${KEYCLOAK_TOKEN_URL:http://localhost:18080/auth/realms/microlending/protocol/openid-connect/token}
```

The client id and secret need defaults: they used to come only from `camunda-local/.env`, which doesn't exist
in CI or in a container, so the app would not start without them.

### 3.2 `pom.xml`

```xml
<!-- Test libraries (JUnit 5, AssertJ) -->
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-test</artifactId>
  <version>${spring-boot.version}</version>
  <scope>test</scope>
</dependency>

<!-- Fixed test-runner version (the pom has no Spring Boot parent to pin it) -->
<plugin>
  <groupId>org.apache.maven.plugins</groupId>
  <artifactId>maven-surefire-plugin</artifactId>
  <version>3.1.2</version>
</plugin>

<!-- "mvn package" now builds a runnable jar (java -jar) -->
<plugin>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-maven-plugin</artifactId>
  <version>${spring-boot.version}</version>
  <configuration>
    <mainClass>com.aaseya.microlending.MicroLendingApplication</mainClass>
  </configuration>
  <executions>
    <execution><goals><goal>repackage</goal></goals></execution>
  </executions>
</plugin>
```

Without `repackage` the jar was 160 KB with no dependencies and could not run. It is now 48 MB and runs on its own.

### 3.3 Maven downloads from Maven Central only (`.mvn/settings.xml`)

```xml
<mirrors>
  <mirror>
    <id>central-only</id>
    <mirrorOf>*</mirrorOf>
    <url>https://repo.maven.apache.org/maven2</url>
  </mirror>
</mirrors>
```

`.mvn/maven.config` contains `--settings=.mvn/settings.xml`, so `mvnw`, `mvn` and the Docker build all use it.

**Why:** Camunda dependencies list extra repositories (`artifacts.camunda.com`, `repository.jboss.org`,
`repo.spring.io/plugins-release`). Maven tried each one for every library, and `repo.spring.io` now needs a
login, so a clean build took 15+ minutes. Every library this project needs is on Maven Central. A clean CI build
now takes about 40 seconds.

### 3.4 Unit tests

**`ProcessModelTest`** checks that the process models and the Java code agree, so a renamed job type fails the
build instead of leaving process instances stuck in Zeebe:

```java
@Test
void everyServiceTaskHasAJobWorker() {
  Set<String> bpmnTypes = loanProcess().getModelElementsByType(ZeebeTaskDefinition.class).stream()
      .map(ZeebeTaskDefinition::getType).collect(Collectors.toSet());

  Set<String> workerTypes = Arrays.stream(WORKERS)          // the 4 classes in worker/
      .flatMap(c -> Arrays.stream(c.getDeclaredMethods()))
      .map(m -> m.getAnnotation(JobWorker.class))
      .filter(a -> a != null)
      .map(JobWorker::type)
      .collect(Collectors.toSet());

  assertThat(workerTypes).containsAll(bpmnTypes);
}
```

It also checks that:
- the process id is `ProcessConstants.PROCESS_ID`;
- the decision called by the BPMN (`credit-decision`) exists in `credit-decision.dmn`.

**`MoneyUtilsTest`** covers the repayment formula used in the affordability calculation:

```java
// 3000 over 12 months at 12% p.a. (1% per month) = 266.55
assertThat(MoneyUtils.monthlyRepayment(3000, 12.0, 12)).isEqualTo(266.55);
assertThat(MoneyUtils.monthlyRepayment(1200, 0, 12)).isEqualTo(100.0);      // zero interest
```

It also covers half-up rounding, a null `BigDecimal`, and the 12-month fallback when no term is given.

Neither test needs Zeebe or a database, so they run in seconds.

---

## 4. Frontend changes

### 4.1 `App.test.js`

The default test looked for a "learn react" link and rendered `App` without a router, so it always failed.
The new tests:

```js
const renderApp = (route = "/") =>
  render(<MemoryRouter initialEntries={[route]}><App /></MemoryRouter>);

beforeEach(() => localStorage.clear());

test("shows the login screen when nobody is logged in", () => {
  renderApp();
  expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
});

test("a logged-in customer sees the sidebar with their name", () => {
  localStorage.setItem("username", "priya");
  localStorage.setItem("role", "USER");
  localStorage.setItem("name", "Priya Sharma");
  renderApp("/demo");
  expect(screen.getByText("Priya Sharma")).toBeInTheDocument();
});
```

### 4.2 `package.json`

```json
"jest": {
  "moduleNameMapper": { "^axios$": "axios/dist/node/axios.cjs" }
}
```

axios 1.x ships as an ES module, which the Jest setup in Create React App can't load
("Cannot use import statement outside a module"). This points Jest at axios's CommonJS build.

---

## 5. Docker images

### Backend (`backend/camunda-8-start-form/Dockerfile`)

```dockerfile
FROM maven:3.9.9-eclipse-temurin-17 AS build
WORKDIR /src
COPY pom.xml .
COPY .mvn/settings.xml .mvn/maven.config ./.mvn/
RUN mvn -B -q dependency:go-offline        # cached until pom.xml changes
COPY src ./src
RUN mvn -B -q -DskipTests package          # tests already ran in the CI job

FROM eclipse-temurin:17-jre
WORKDIR /app
RUN useradd --system --uid 10001 app
COPY --from=build /src/target/camunda-8-start-form-*.jar app.jar
USER app
EXPOSE 8898
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "/app/app.jar"]
```

### Frontend (`frontend/Dockerfile`)

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY public ./public
COPY src ./src
ARG REACT_APP_API_URL=http://localhost:8898
ENV REACT_APP_API_URL=$REACT_APP_API_URL
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY scripts ./scripts
COPY --from=build /app/build ./build
USER node
EXPOSE 3077
CMD ["node", "scripts/serve-build.js", "build", "3077"]
```

This reuses the project's own `scripts/serve-build.js`, so no nginx is needed.
**Note:** Create React App fixes the backend URL at build time, so each environment needs its own frontend
image, built with `--build-arg REACT_APP_API_URL=...`.

---

## 6. The workflow (`.github/workflows/ci.yml`), key parts

**Triggers, cancellation of old runs, and read-only by default:**

```yaml
on:
  push:         { branches: [us-1, us-2] }
  pull_request: { branches: [main, us-1, us-2] }
  workflow_dispatch:

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true     # a newer push cancels the older run on the same branch

permissions:
  contents: read
```

**End-to-end job.** Zeebe and Postgres run as service containers. Elasticsearch, Keycloak and Operate are not
needed because the smoke test never calls `/login`.

```yaml
services:
  postgres:
    image: postgres:14.5-alpine
    env: { POSTGRES_DB: microlending, POSTGRES_USER: microlending, POSTGRES_PASSWORD: microlending }
    ports: ["5432:5432"]
  zeebe:
    image: camunda/zeebe:8.3.12
    ports: ["26500:26500", "9600:9600"]
steps:
  - name: Wait for Zeebe
    run: until curl -sf http://localhost:9600/ready; do sleep 3; done   # (with a 3-minute limit)
  - name: Start backend
    env:
      ZEEBE_ADDRESS: localhost:26500
      DB_URL: jdbc:postgresql://localhost:5432/microlending
    run: nohup java -jar jar/camunda-8-start-form-*.jar > backend.log 2>&1 &
  - name: Smoke test
    run: node backend/camunda-8-start-form/tools/smoke-test.js
```

When this job fails, `backend.log` is uploaded as a run artifact.

**Publish job.** It uses the built-in `GITHUB_TOKEN`, so no secrets need to be set up.

```yaml
publish:
  needs: [backend, frontend, e2e]
  if: github.event_name == 'push'
  permissions: { contents: read, packages: write }
  strategy:
    matrix:
      include:
        - { name: backend,  context: backend/camunda-8-start-form }
        - { name: frontend, context: frontend }
  steps:
    - run: echo "IMAGE=ghcr.io/${GITHUB_REPOSITORY_OWNER,,}/microlending-${{ matrix.name }}" >> "$GITHUB_ENV"
    - uses: docker/login-action@v3
      with: { registry: ghcr.io, username: ${{ github.actor }}, password: ${{ secrets.GITHUB_TOKEN }} }
    - uses: docker/metadata-action@v5      # tags: branch name + sha-<commit>
    - uses: docker/build-push-action@v6    # with GitHub Actions layer cache
```

`${GITHUB_REPOSITORY_OWNER,,}` lowercases `Rashee-07`, because GHCR image names must be lowercase.

---

## 7. Running the same checks locally

```bash
# backend (Windows: mvnw.cmd verify)
cd backend/camunda-8-start-form && ./mvnw verify

# frontend
cd frontend && npm test -- --watchAll=false && npm run build

# end-to-end (needs the camunda-local Docker stack and a running backend)
node backend/camunda-8-start-form/tools/smoke-test.js
```

Run a published image against the local Docker stack:

```bash
docker run -p 8898:8898 \
  -e ZEEBE_ADDRESS=host.docker.internal:26500 \
  -e DB_URL=jdbc:postgresql://host.docker.internal:5435/microlending \
  -e KEYCLOAK_TOKEN_URL=http://host.docker.internal:18080/auth/realms/microlending/protocol/openid-connect/token \
  ghcr.io/rashee-07/microlending-backend:us-2
```

---

## 8. Things that came up

| What happened | Why | What was done |
|---|---|---|
| The first run was **cancelled** | A teammate pushed to `us-2` 6 minutes later; `concurrency` cancels the older run on purpose | Nothing needed; the next run tested both commits |
| The backend job ran for **15+ minutes** | Maven tried slow or login-only repositories for every library | Maven Central mirror (section 3.3); now about 40 seconds |
| A browser profile was found in `backend/.metadata` | The Eclipse workspace was committed, including its embedded browser's `Login Data` / `Web Data` files | Removed from the repo and added to `.gitignore`. **The files are still in git history:** anyone who used Eclipse's built-in browser should change their passwords |

---

## 9. Open items

| Item | Who |
|---|---|
| Make the two GHCR packages public if others need `docker pull` without logging in | Repo admin (Rashee-07) |
| Branch protection: require `backend`, `frontend` and `e2e` to pass before merging | Repo admin |
| Deployment (CD): add a `deploy` job after `publish` once a server or cloud environment is chosen | Team decision |
| `us-1` does not have the pipeline (decided to leave it) | — |
| Not covered yet: login and Keycloak in the end-to-end test, frontend screens beyond the login/sidebar | Later |
