# Twenty CRM — Railway Setup Guide

Setup completo "Railway first" con doppio ambiente (dev/prod), CI/CD via GitHub Actions e comandi CLI.

---

## Indice

1. [Requisiti](#1-requisiti)
2. [Architettura ambienti](#2-architettura-ambienti)
3. [Struttura servizi Railway](#3-struttura-servizi-railway)
4. [Env vars per servizio](#4-env-vars-per-servizio)
5. [Sviluppo locale](#5-sviluppo-locale)
6. [Quickstart CLI — Railway](#6-quickstart-cli--railway)
7. [Quickstart CLI — GitHub](#7-quickstart-cli--github)
8. [CI/CD — GitHub Actions](#8-cicd--github-actions)
9. [Migrazioni DB (dev & prod)](#9-migrazioni-db-dev--prod)
10. [Rollback](#10-rollback)
11. [Workflow operativo quotidiano](#11-workflow-operativo-quotidiano)
12. [Checklist operativa (15 step)](#12-checklist-operativa-15-step)

---

## 1. Requisiti

| Tool            | Versione minima | Installazione                          |
|-----------------|-----------------|----------------------------------------|
| Node.js         | 24.5.0          | `nvm install` (usa `.nvmrc`)           |
| Yarn            | 4.9+            | Incluso via `corepack enable`          |
| Docker          | 24+             | https://docs.docker.com/get-docker/    |
| Docker Compose  | v2+             | Incluso in Docker Desktop              |
| Railway CLI     | latest          | `npm install -g @railway/cli`          |
| GitHub CLI (gh) | 2.x+            | `brew install gh` o https://cli.github.com |

---

## 2. Architettura ambienti

```
                    ┌─────────────┐
                    │   GitHub    │
                    │  aworld-twenty
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │ push develop            │ merge PR → main
              ▼                         ▼
     ┌─────────────────┐      ┌─────────────────┐
     │  Railway: DEV   │      │  Railway: PROD  │
     │  (twenty-dev)   │      │  (twenty-prod)  │
     ├─────────────────┤      ├─────────────────┤
     │ twenty-app-dev  │      │ twenty-app-prod │
     │ twenty-worker-dev│     │ twenty-worker-prod│
     │ Postgres (dev)  │      │ Postgres (prod) │
     │ Redis (dev)     │      │ Redis (prod)    │
     └─────────────────┘      └─────────────────┘
```

| Aspetto         | DEV                       | PROD                        |
|-----------------|---------------------------|-----------------------------|
| Branch          | `develop`                 | `main`                      |
| Progetto Railway| `twenty-dev`              | `twenty-prod`               |
| Deploy trigger  | Push su `develop`         | Merge PR in `main`          |
| DB              | Postgres isolato (dev)    | Postgres isolato (prod)     |
| URL             | `*.up.railway.app`        | Custom domain consigliato   |

---

## 3. Struttura servizi Railway

Per **ogni** ambiente (dev / prod) crea questi 4 servizi:

### twenty-app-{env}
- **Tipo**: Web service (HTTP pubblico)
- **Porta**: 3000
- **Dockerfile**: `packages/twenty-docker/twenty/Dockerfile`
- **Start command**: (default dal Dockerfile: `node dist/main`)
- **Health check**: `GET /healthz`

### twenty-worker-{env}
- **Tipo**: Worker (no HTTP pubblico)
- **Dockerfile**: stesso di sopra
- **Start command override**: `yarn worker:prod`
- **Env extra**: `DISABLE_DB_MIGRATIONS=true`, `DISABLE_CRON_JOBS_REGISTRATION=true`

### twenty-postgres-{env}
- **Tipo**: Railway Postgres plugin
- **Versione**: PostgreSQL 16
- **Espone**: `DATABASE_URL` automaticamente

### twenty-redis-{env}
- **Tipo**: Railway Redis plugin
- **Espone**: `REDIS_URL` automaticamente

---

## 4. Env vars per servizio

Riferimento completo: vedi [`.env.railway.example`](../.env.railway.example) nella root del repo.

### Variabili COMUNI (app + worker)

| Variabile         | Descrizione                          | Esempio                                  |
|-------------------|--------------------------------------|------------------------------------------|
| `NODE_ENV`        | Ambiente Node                        | `production`                             |
| `PG_DATABASE_URL` | Connection string Postgres           | `${{Postgres.DATABASE_URL}}`             |
| `REDIS_URL`       | Connection string Redis              | `${{Redis.REDIS_URL}}`                   |
| `APP_SECRET`      | JWT signing secret                   | `openssl rand -base64 32`               |
| `SERVER_URL`      | URL pubblica del server              | `https://twenty-app-dev.up.railway.app`  |
| `FRONTEND_URL`    | URL del frontend                     | Stessa di `SERVER_URL` (unified image)   |
| `STORAGE_TYPE`    | `local` o `s3`                       | `local`                                  |

### Solo APP (twenty-app-*)

| Variabile                       | Valore |
|---------------------------------|--------|
| `DISABLE_DB_MIGRATIONS`         | `false` (lascia che esegua le migrazioni all'avvio) |
| `DISABLE_CRON_JOBS_REGISTRATION`| `false` |

### Solo WORKER (twenty-worker-*)

| Variabile                       | Valore  |
|---------------------------------|---------|
| `DISABLE_DB_MIGRATIONS`         | `true`  |
| `DISABLE_CRON_JOBS_REGISTRATION`| `true`  |

> **Tip Railway**: Usa le reference variables `${{Postgres.DATABASE_URL}}` e `${{Redis.REDIS_URL}}` per iniettare automaticamente le connection string dai plugin.

---

## 5. Sviluppo locale

Twenty include un `docker-compose.yml` in `packages/twenty-docker/` pronto all'uso. I comandi sono esposti nel `Makefile` alla root.

### Comandi rapidi

```bash
# Avvia lo stack locale (app + worker + postgres + redis)
make dev:up

# Ferma lo stack
make dev:down

# Vedi i log in tempo reale
make dev:logs

# Esegui migrazioni DB
make dev:migrate

# Seed: init DB + migrazioni + upgrade
make dev:seed

# Reset completo: distrugge volumi e ricrea tutto
make dev:reset
```

### Cosa succede con `make dev:up`

1. Copia `.env.example` → `.env` nella cartella Docker (se non esiste)
2. Avvia 4 container: `server` (porta 3000), `worker`, `db` (Postgres 16), `redis`
3. Il server esegue automaticamente le migrazioni al primo boot (via `entrypoint.sh`)
4. App disponibile su **http://localhost:3000**

### Sviluppo nativo (senza Docker)

Se preferisci eseguire Node direttamente (per hot reload, debug, ecc.):

```bash
# Prerequisiti: Postgres e Redis in esecuzione localmente
# Copia e personalizza: packages/twenty-server/.env.example → .env

make install        # yarn install
make start          # avvia front + server + worker concurrentemente
make start:front    # solo frontend (porta 3001)
make start:server   # solo backend (porta 3000)
make start:worker   # solo worker
```

---

## 6. Quickstart CLI — Railway

### Login e setup iniziale

```bash
# 1. Installa Railway CLI
npm install -g @railway/cli

# 2. Login (apre il browser)
railway login

# 3. Crea il progetto DEV
railway init --name twenty-dev
# Annota il Project ID che viene mostrato

# 4. Crea il progetto PROD (in un altra sessione o dopo aver scollegato)
railway init --name twenty-prod
```

### Creare i servizi (via UI Railway — consigliato)

La creazione servizi è più semplice dalla UI di Railway:

1. Vai su https://railway.com/dashboard
2. Apri il progetto `twenty-dev`
3. Clicca **+ New** → **Service** → **Docker Image** → imposta:
   - Nome: `twenty-app-dev`
   - Source: connetti al repo GitHub `aworld-twenty`
   - Branch: `develop`
   - Dockerfile path: `packages/twenty-docker/twenty/Dockerfile`
4. Ripeti per `twenty-worker-dev` con start command override: `yarn worker:prod`
5. **+ New** → **Database** → **PostgreSQL** → rinomina `twenty-postgres-dev`
6. **+ New** → **Database** → **Redis** → rinomina `twenty-redis-dev`
7. Configura le env vars come da [sezione 4](#4-env-vars-per-servizio)

Ripeti l'intero processo per il progetto `twenty-prod` con branch `main`.

### Link e deploy manuali

```bash
# Collegati al progetto dev
railway link --project twenty-dev

# Deploy manuale dell'app
railway up --service twenty-app-dev --detach

# Deploy manuale del worker
railway up --service twenty-worker-dev --detach

# Vedi i log
railway logs --service twenty-app-dev

# Apri nel browser
railway open --service twenty-app-dev
```

### Ottenere project/service ID (per GitHub Actions)

```bash
# Dopo aver linkato un progetto
railway status
# Mostra Project ID e Environment

# Per ottenere i service ID, usa l'API:
railway service list
```

---

## 7. Quickstart CLI — GitHub

### Setup del repo

```bash
# Clona il repo (se non l'hai già fatto)
gh repo clone YOUR_USERNAME/aworld-twenty
cd aworld-twenty

# Crea il branch develop
git checkout -b develop
git push -u origin develop
```

### Configurare i secrets per CI/CD

```bash
# Token Railway (lo ottieni da https://railway.com/account/tokens)
gh secret set RAILWAY_TOKEN -b"your-railway-api-token-here"

# Variables per i project ID (opzionali ma consigliati)
gh variable set RAILWAY_DEV_PROJECT_ID -b"xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
gh variable set RAILWAY_PROD_PROJECT_ID -b"xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"

# Variables per i service ID (opzionali)
gh variable set RAILWAY_DEV_APP_SERVICE -b"service-id-here"
gh variable set RAILWAY_DEV_WORKER_SERVICE -b"service-id-here"
gh variable set RAILWAY_PROD_APP_SERVICE -b"service-id-here"
gh variable set RAILWAY_PROD_WORKER_SERVICE -b"service-id-here"
```

### Proteggere il branch main

```bash
# Richiedi PR per pushare su main (via GitHub CLI)
gh api repos/{owner}/{repo}/branches/main/protection \
  --method PUT \
  --field required_pull_request_reviews='{"required_approving_review_count":1}' \
  --field enforce_admins=true \
  --field required_status_checks='{"strict":true,"contexts":["Lint & Type Check","Unit Tests"]}'
```

Oppure dalla UI: **Settings → Branches → Add rule** per `main`:
- Require pull request reviews (1 approval)
- Require status checks (quality + test)
- No direct push

---

## 8. CI/CD — GitHub Actions

### Workflow files

| File                                    | Trigger             | Target          |
|-----------------------------------------|---------------------|-----------------|
| `.github/workflows/deploy-dev.yml`      | Push su `develop`   | Railway DEV     |
| `.github/workflows/deploy-prod.yml`     | Push su `main`      | Railway PROD    |

### Cosa fanno

Entrambi i workflow seguono lo stesso schema:

1. **Quality gate**: lint + typecheck (twenty-front + twenty-server)
2. **Test**: unit tests (twenty-front + twenty-server)
3. **Deploy app**: `railway up --service twenty-app-{env}` via CLI
4. **Deploy worker**: `railway up --service twenty-worker-{env}` via CLI

### Secrets richiesti

| Secret/Variable             | Dove impostarlo       | Descrizione                         |
|-----------------------------|-----------------------|-------------------------------------|
| `RAILWAY_TOKEN`             | GitHub Secrets        | Token API Railway                   |
| `RAILWAY_DEV_PROJECT_ID`    | GitHub Variables      | Project ID per twenty-dev           |
| `RAILWAY_PROD_PROJECT_ID`   | GitHub Variables      | Project ID per twenty-prod          |
| `RAILWAY_DEV_APP_SERVICE`   | GitHub Variables      | Service ID app dev (opzionale)      |
| `RAILWAY_DEV_WORKER_SERVICE`| GitHub Variables      | Service ID worker dev (opzionale)   |
| `RAILWAY_PROD_APP_SERVICE`  | GitHub Variables      | Service ID app prod (opzionale)     |
| `RAILWAY_PROD_WORKER_SERVICE`| GitHub Variables     | Service ID worker prod (opzionale)  |

> Se non imposti i service ID, i workflow usano il nome del servizio (`twenty-app-dev`, ecc.). Funziona se i nomi corrispondono esattamente in Railway.

---

## 9. Migrazioni DB (dev & prod)

### Come funzionano le migrazioni in Twenty

Twenty usa TypeORM con un `entrypoint.sh` che:
1. Controlla se lo schema `core` esiste in Postgres
2. Se non esiste → esegue `setup-db.ts` + `database:migrate:prod` (prima installazione)
3. Poi esegue `command:prod upgrade` (aggiornamenti incrementali)
4. Registra i cron jobs

Questo accade **ad ogni avvio del container** (a meno che `DISABLE_DB_MIGRATIONS=true`).

### DEV — Migrazioni

- **Automatiche**: il container `twenty-app-dev` esegue le migrazioni all'avvio
- **Manuali** (se servono):
  ```bash
  # Via Docker Compose locale
  make dev:migrate

  # Via Railway CLI
  railway run --service twenty-app-dev -- yarn database:migrate:prod
  ```

### PROD — Migrazioni

- **Automatiche all'avvio** (default): le migrazioni girano quando il container si avvia
- **CI-driven** (opzionale, più sicuro): decommentare il job `migrate` in `deploy-prod.yml` e impostare `DISABLE_DB_MIGRATIONS=true` sul servizio app

### Generare nuove migrazioni

Quando modifichi le entity TypeORM:

```bash
# Genera il file di migrazione
npx nx run twenty-server:typeorm migration:generate \
  src/database/typeorm/core/migrations/common/nome-migrazione \
  -d src/database/typeorm/core/core.datasource.ts

# Verifica che contenga sia "up" che "down"
# Committa il file di migrazione
```

---

## 10. Rollback

### Rollback via Railway UI

1. Vai al servizio (es. `twenty-app-prod`) nella dashboard Railway
2. Clicca su **Deployments**
3. Trova il deploy precedente funzionante
4. Clicca **Redeploy** (lancia una nuova build dalla stessa commit)

### Rollback via Git

```bash
# Opzione A: Revert della commit problematica (mantiene storia pulita)
git revert <commit-sha>
git push origin main    # Triggera il workflow deploy-prod

# Opzione B: Deploy di una commit specifica (via Railway CLI)
git checkout <commit-sha-buona>
railway up --service twenty-app-prod --detach
git checkout main       # Torna su main
```

### Rollback del database

> Le migrazioni TypeORM di Twenty hanno il metodo `down()`. Per rollback:

```bash
# Rollback dell'ultima migrazione
railway run --service twenty-app-prod -- \
  npx typeorm migration:revert -d dist/database/typeorm/core/core.datasource

# Poi fai il redeploy della versione precedente del codice
```

**Attenzione**: testa sempre i rollback in DEV prima di applicarli in PROD.

---

## 11. Workflow operativo quotidiano

### Sviluppo

```bash
# 1. Avvia lo stack locale
make dev:up

# 2. Lavora sul codice con Claude Code (UI, API, ecc.)

# 3. Se hai cambiato il modello DB:
make dev:migrate

# 4. Verifica che tutto funzioni su http://localhost:3000
```

### Deploy in DEV

```bash
# 1. Committa e pusha su develop
git add .
git commit -m "feat: descrizione della modifica"
git push origin develop

# 2. Il workflow deploy-dev.yml parte automaticamente
# 3. Controlla su GitHub Actions che sia verde
# 4. Testa su: https://twenty-app-dev.up.railway.app (o il tuo URL)
```

### Deploy in PROD

```bash
# 1. Crea una PR da develop → main
gh pr create --base main --head develop --title "Release: descrizione"

# 2. Review + merge dalla UI GitHub (o da CLI)
gh pr merge --squash

# 3. Il workflow deploy-prod.yml parte automaticamente
# 4. Verifica su: https://twenty-app-prod.up.railway.app (o custom domain)
```

---

## 12. Checklist operativa (15 step)

Dal fork di Twenty al primo deploy in dev e prod.

- [ ] **1.** Fork `twentyhq/twenty` → `YOUR_USERNAME/aworld-twenty` su GitHub
- [ ] **2.** Clona in locale: `gh repo clone aworld-twenty && cd aworld-twenty`
- [ ] **3.** Installa i tool: Node 24.5 (`nvm install`), Docker, Railway CLI, GitHub CLI
- [ ] **4.** Crea il branch `develop`: `git checkout -b develop && git push -u origin develop`
- [ ] **5.** Testa in locale: `make dev:up` → verifica http://localhost:3000
- [ ] **6.** Crea progetto Railway DEV: `railway init --name twenty-dev`
- [ ] **7.** Aggiungi servizi in Railway DEV: app, worker, Postgres, Redis (via UI)
- [ ] **8.** Configura env vars su Railway DEV (vedi [sezione 4](#4-env-vars-per-servizio))
- [ ] **9.** Crea progetto Railway PROD: `railway init --name twenty-prod`
- [ ] **10.** Aggiungi servizi in Railway PROD: app, worker, Postgres, Redis (via UI)
- [ ] **11.** Configura env vars su Railway PROD
- [ ] **12.** Imposta secrets GitHub: `gh secret set RAILWAY_TOKEN` + variables project/service ID
- [ ] **13.** Primo deploy DEV: `git push origin develop` → verifica workflow verde
- [ ] **14.** Proteggi `main`: richiedi PR + status checks
- [ ] **15.** Primo deploy PROD: `gh pr create --base main --head develop` → merge → verifica

> Fatto! Da qui in poi il flusso e: develop → push → deploy DEV → PR → merge → deploy PROD.
