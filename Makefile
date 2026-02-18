.PHONY: help up down restart logs status migrate app app-stop lint typecheck build clean

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

# --- Supabase ---

sb-up: ## Start Supabase stack
	@docker network create traefik 2>/dev/null || true
	cd supabase/docker && ./run.sh up -d

sb-down: ## Stop Supabase stack
	cd supabase/docker && ./run.sh down

sb-restart: ## Restart Supabase stack
	cd supabase/docker && ./run.sh down && ./run.sh up -d

sb-logs: ## Tail Supabase logs (usage: make logs or make logs s=auth)
	cd supabase/docker && ./run.sh logs -f $(if $(s),$(s),)

sb-status: ## Show status of all containers
	@docker ps --filter "name=supabase-" --format "table {{.Names}}\t{{.Status}}" | sort
	@docker ps --filter "name=realtime-dev" --format "table {{.Names}}\t{{.Status}}"

# --- Database ---

sb-migrate: ## Apply all SQL migrations to local Supabase
	@for f in $$(ls supabase/migrations/*.sql | sort); do \
		echo "Applying: $$f"; \
		docker exec -i supabase-db psql -U postgres -d postgres < "$$f"; \
	done
	@echo "Done."

# --- App ---

app-up: ## Start Next.js dev server
	cd app && npm run dev

app-stop: ## Kill Next.js dev server
	@pkill -f "next dev" 2>/dev/null && echo "Stopped." || echo "Not running."

# --- Quality ---

app-lint: ## Run ESLint
	cd app && npx eslint src/

app-typecheck: ## Run TypeScript check
	cd app && npx tsc --noEmit

app-check: app-lint app-typecheck ## Run lint + typecheck

# --- Build ---

app-build: ## Build Next.js for production
	cd app && npm run build

app-clean: ## Remove build artifacts and node_modules
	rm -rf app/.next app/node_modules
	cd supabase/docker && rm -f .env.runtime
