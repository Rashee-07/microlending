# Running MicroLending locally – step by step

How to start the whole application on a Windows laptop, from a cold start (laptop just switched on) to logging
in, with every command and what it does. Commands are for **PowerShell**. Paths assume the repo is cloned at
`C:\Users\<you>\Documents\LoanOrigination_US2\microlending`, so change that part if yours is elsewhere.

## What runs where

| # | Part | How it runs | Port | URL |
|---|---|---|---|---|
| 1 | Zeebe (workflow engine) | Docker | 26500 (gRPC), 9600 (health) | – |
| 2 | Elasticsearch (Camunda history) | Docker | 9200 | – |
| 3 | Keycloak (logins) | Docker | 18080 | http://localhost:18080/auth |
| 4 | Identity, postgres (Camunda's own) | Docker | 8084 | – |
| 5 | Operate (see process instances) | Docker | 8081 | http://localhost:8081 |
| 6 | Tasklist (Camunda task inbox) | Docker | 8082 | http://localhost:8082 |
| 7 | microlending-db (the app's Postgres) | Docker | 5435 | – |
| 8 | **Backend** (Spring Boot + job workers) | `java -jar` | 8898 | http://localhost:8898/api |
| 9 | **Frontend** (React build) | `node` | 3077 | **http://localhost:3077** |

Start order matters: **Docker first → wait for Zeebe → backend → frontend.** The backend deploys the BPMN/DMN to
Zeebe on startup and stops if Zeebe isn't ready.

---

## A. One-time setup (new laptop or fresh clone)

```powershell
# 1. Tools you need installed: Docker Desktop, Java 17 or newer, Node 20 or newer, Git.
#    Maven is NOT needed – the repo has the Maven wrapper (mvnw.cmd).
java -version          # must print 17 or higher
node -v                # must print v20 or higher
docker version         # must show both Client and Server (Docker Desktop running)

# 2. Get the code on the release 1 branch
git clone https://github.com/Rashee-07/microlending.git
cd microlending
git checkout us-2

# 3. Create the Docker stack (downloads the images the first time, takes a while)
cd camunda-local
docker compose up -d
docker stop optimize connectors         # not used by the app, they only use memory

# 4. Create the "microlending" Keycloak realm and demo users (only once; wait until Keycloak is up, ~1–2 min)
powershell -File keycloak\setup-keycloak.ps1

# 5. Install frontend packages
cd ..\frontend
npm ci
```

`camunda-local\.env` holds the Docker versions and the `MICROLENDING_CLIENT_ID / SECRET` that the backend reads.
It must exist before you start the backend.

---

## B. Every day – start everything

Open **PowerShell** and run these in order.

### Step 1 – Start Docker

```powershell
# 1.1  Start Docker Desktop (or open it from the Start menu)
Start-Process "$env:LOCALAPPDATA\Programs\DockerDesktop\Docker Desktop.exe"

# 1.2  Wait until the engine answers (repeat until it prints the version)
docker version --format "{{.Server.Version}}"
```

Most containers start by themselves with Docker Desktop (they have a restart policy). Check:

```powershell
# 1.3  List all containers and their state
docker ps -a --format "table {{.Names}}\t{{.Status}}"
```

You want `zeebe`, `elasticsearch`, `keycloak`, `identity`, `postgres` and `microlending-db` showing **Up**.
If they don't exist at all, run `docker compose up -d` in `camunda-local` (step A.3).

### Step 2 – Wait for Zeebe, then start Operate and Tasklist

```powershell
# 2.1  Wait until zeebe, elasticsearch and keycloak say "(healthy)" – usually 30–60 seconds
docker ps --format "table {{.Names}}\t{{.Status}}"

# 2.2  Operate and Tasklist usually crash at boot (Elasticsearch wasn't ready yet) – start them now
docker start operate tasklist

# 2.3  Check Zeebe answers (expect: 204)
curl.exe -s -o NUL -w "%{http_code}`n" http://localhost:9600/ready
```

> **Wait about one more minute after Zeebe says healthy.** Zeebe reports "healthy" before it has finished
> recovering its data. If the backend starts too early it fails with `DEADLINE_EXCEEDED ... 26500` – just start it
> again (step 3.3).

### Step 3 – Start the backend

```powershell
# 3.1  Go to the backend folder (it must run from here: it reads ..\..\camunda-local\.env)
cd C:\Users\<you>\Documents\LoanOrigination_US2\microlending\backend\camunda-8-start-form

# 3.2  Build the jar – only needed when the code changed (after git pull / your own edits). Takes ~1 min.
.\mvnw.cmd -B -DskipTests package

# 3.3  Start it – leave this window open
java -jar target\camunda-8-start-form-0.0.1-SNAPSHOT.jar
```

It's ready when you see:

```
Deployed: <Definitions_credit_decision:1>,<LoanApplication:1>,<microlending-loan:N>
Started MicroLendingApplication in 12 seconds
```

Alternative to 3.2 + 3.3 in one go: `.\mvnw.cmd spring-boot:run`.

```powershell
# 3.4  Check it from a second PowerShell window (expect: 200)
curl.exe -s -o NUL -w "%{http_code}`n" "http://localhost:8898/api/notifications?username=test"
```

### Step 4 – Start the frontend

Open a **second** PowerShell window:

```powershell
# 4.1  Go to the frontend folder
cd C:\Users\<you>\Documents\LoanOrigination_US2\microlending\frontend

# 4.2  Build – only needed when the frontend code changed. Takes ~1 min.
npm run build

# 4.3  Serve the build on port 3077 – leave this window open
npm run serve
```

Open **http://localhost:3077**.

(For frontend development with live reload use `npm start` instead. It runs on http://localhost:3000.)

### Step 5 – Log in and reset the data

| User | Password | Role | What they see |
|---|---|---|---|
| `priya` | `priya123` | Customer | Apply for a loan, upload documents |
| `rahul` | `rahul123` | Customer | – |
| `anita` | `anita123` | Customer | – |
| `kiran` | `kiran123` | Credit officer / fraud (REVIEWER) | Review queue for UC02 exceptions |
| `suresh` | `suresh123` | Manager | – |
| `demo` | `demo` | Camunda admin | Operate (8081) and Tasklist (8082) only |

1. Log in as anyone → **Demo panel** → **↺ Reset test data** → confirm. That gives you a clean start.
2. Always **Log out** before logging in as someone else.

Same reset from the command line:

```powershell
curl.exe -X POST http://localhost:8898/api/demo/reset
```

---

## C. Check that everything works (optional, 1 minute)

Runs all UC01/UC02 scenarios through the API (needs the backend running):

```powershell
cd C:\Users\<you>\Documents\LoanOrigination_US2\microlending\backend\camunda-8-start-form
node tools\smoke-test.js          # all scenarios, expect "All scenarios passed"
node tools\smoke-test.js uc01     # only the UC01 ones
```

It creates test applications, so do **Reset test data** afterwards if you are going to demo.

Unit tests (same as CI):

```powershell
cd backend\camunda-8-start-form ; .\mvnw.cmd verify
cd frontend ; npm test -- --watchAll=false
```

---

## D. Stop everything

```powershell
# Backend and frontend: press Ctrl+C in their windows.
# Docker: stop the containers (data is kept in Docker volumes)
cd C:\Users\<you>\Documents\LoanOrigination_US2\microlending\camunda-local
docker compose stop
```

Don't use `docker compose down -v`: the `-v` **deletes all data**, including the Keycloak users.

---

## E. When something goes wrong

| What you see | Why | Fix |
|---|---|---|
| `failed to connect to the docker API ... dockerDesktopLinuxEngine` | Docker Desktop isn't running | Step 1.1, wait 1 minute |
| Backend: `DEADLINE_EXCEEDED: deadline exceeded ... localhost:26500` | Zeebe not ready yet (or stuck) | Wait 1 minute and start the backend again. Still failing: `docker restart zeebe`, wait 1–2 min, retry |
| Backend: `Port 8898 was already in use` | Another backend is running (maybe from another checkout/branch) | `Get-NetTCPConnection -LocalPort 8898 -State Listen` → `Stop-Process -Id <OwningProcess>` |
| Frontend: `EADDRINUSE 3077` | Another frontend is running | Same as above with port 3077 |
| Operate / Tasklist page doesn't open | Containers exited at boot | `docker start operate tasklist` |
| Login fails for priya/kiran | Keycloak realm missing (fresh Docker volumes) | `powershell -File camunda-local\keycloak\setup-keycloak.ps1` |
| Backend: database connection refused on 5435 | `microlending-db` container not running | `docker start microlending-db` |
| Approved application stops at "Credit officer approval" | The full-version process (branch `us-1`) was deployed last | Restart the backend on `us-2`, then **Reset test data** |
| Laptop very slow | Docker stack uses ~3 GB | `docker stop optimize connectors`, close other IDEs/servers |

Logs:

- Backend: in its PowerShell window.
- Zeebe: `docker logs --tail 50 zeebe`.
- Any container: `docker logs --tail 50 <name>`.

---

## F. Quick reference (copy-paste, after one-time setup)

```powershell
# Window 1 – Docker + backend
docker ps -a --format "table {{.Names}}\t{{.Status}}"     # wait for zeebe (healthy)
docker start operate tasklist
cd C:\Users\<you>\Documents\LoanOrigination_US2\microlending\backend\camunda-8-start-form
.\mvnw.cmd -B -DskipTests package                          # only if code changed
java -jar target\camunda-8-start-form-0.0.1-SNAPSHOT.jar   # wait for "Started MicroLendingApplication"

# Window 2 – frontend
cd C:\Users\<you>\Documents\LoanOrigination_US2\microlending\frontend
npm run build                                              # only if code changed
npm run serve                                              # http://localhost:3077
```
