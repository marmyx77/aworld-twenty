# =============================================================================
# Twenty CRM — Local Development & Railway Shortcuts
# =============================================================================
# Usage:  make <target>
# Requires: Docker, docker compose, Node 24.5+, yarn 4+
# =============================================================================

COMPOSE_FILE  := packages/twenty-docker/docker-compose.yml
COMPOSE       := docker compose -f $(COMPOSE_FILE)
SERVER_PKG    := packages/twenty-server

# ---------------------------------------------------------------------------
# Local development (Docker Compose)
# ---------------------------------------------------------------------------

.PHONY: dev\:up dev\:down dev\:logs dev\:ps dev\:migrate dev\:seed dev\:reset

## Start the full local stack (app + worker + postgres + redis)
dev\:up:
	cp -n packages/twenty-docker/.env.example packages/twenty-docker/.env 2>/dev/null || true
	$(COMPOSE) up -d
	@echo "✔ Stack running — app at http://localhost:3000"

## Stop the local stack
dev\:down:
	$(COMPOSE) down

## Show logs (follow mode)
dev\:logs:
	$(COMPOSE) logs -f

## Show running containers
dev\:ps:
	$(COMPOSE) ps

## Run database migrations (against local Postgres)
dev\:migrate:
	$(COMPOSE) exec server yarn database:migrate:prod

## Seed the database (init + migrate + upgrade)
dev\:seed:
	$(COMPOSE) exec server sh -c "\
		NODE_OPTIONS='--max-old-space-size=1500' tsx ./scripts/setup-db.ts && \
		yarn database:migrate:prod && \
		yarn command:prod upgrade"

## Full reset: destroy volumes and recreate everything
dev\:reset:
	$(COMPOSE) down -v
	$(MAKE) dev:up
	@echo "⏳ Waiting for Postgres to be ready..."
	@sleep 10
	$(MAKE) dev:seed

# ---------------------------------------------------------------------------
# Native development (no Docker, local Node)
# ---------------------------------------------------------------------------

.PHONY: install start start\:front start\:server start\:worker build lint test typecheck

## Install all dependencies
install:
	yarn

## Start frontend + backend + worker concurrently
start:
	yarn start

## Start frontend only
start\:front:
	npx nx start twenty-front

## Start backend only
start\:server:
	npx nx start twenty-server

## Start worker only
start\:worker:
	npx nx run twenty-server:worker

## Build all packages
build:
	npx nx run-many -t build -p twenty-shared twenty-front twenty-server

## Lint changed files
lint:
	npx nx lint:diff-with-main twenty-front
	npx nx lint:diff-with-main twenty-server

## Run unit tests
test:
	npx nx test twenty-front
	npx nx test twenty-server

## Type check
typecheck:
	npx nx typecheck twenty-front
	npx nx typecheck twenty-server

# ---------------------------------------------------------------------------
# Railway helpers
# ---------------------------------------------------------------------------

.PHONY: railway\:link\:dev railway\:link\:prod railway\:deploy\:dev railway\:deploy\:prod

## Link current dir to Railway dev project
railway\:link\:dev:
	railway link --project twenty-dev

## Link current dir to Railway prod project
railway\:link\:prod:
	railway link --project twenty-prod

## Manual deploy to dev (app)
railway\:deploy\:dev:
	railway up --service twenty-app-dev --environment dev

## Manual deploy to prod (app)
railway\:deploy\:prod:
	railway up --service twenty-app-prod --environment production

# ---------------------------------------------------------------------------
# Help
# ---------------------------------------------------------------------------

.PHONY: help
help:
	@echo ""
	@echo "  Twenty CRM — Available targets"
	@echo "  ────────────────────────────────────────"
	@echo "  dev:up        Start local Docker stack"
	@echo "  dev:down      Stop local Docker stack"
	@echo "  dev:logs      Tail container logs"
	@echo "  dev:migrate   Run DB migrations (Docker)"
	@echo "  dev:seed      Init + migrate + upgrade DB"
	@echo "  dev:reset     Destroy volumes & rebuild"
	@echo ""
	@echo "  install       yarn install"
	@echo "  start         Start all (native Node)"
	@echo "  build         Build shared + front + server"
	@echo "  lint          Lint changed files"
	@echo "  test          Run unit tests"
	@echo "  typecheck     Type check front + server"
	@echo ""
	@echo "  railway:link:dev    Link to Railway dev"
	@echo "  railway:link:prod   Link to Railway prod"
	@echo "  railway:deploy:dev  Manual deploy to dev"
	@echo "  railway:deploy:prod Manual deploy to prod"
	@echo ""

.DEFAULT_GOAL := help
