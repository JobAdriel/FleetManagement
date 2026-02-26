.PHONY: help up down build logs shell migrate seed test clean

help:
	@echo "Fleet Management Docker Commands"
	@echo "=================================="
	@echo "make up              - Start all services"
	@echo "make down            - Stop all services"
	@echo "make build           - Build all images"
	@echo "make rebuild         - Rebuild without cache"
	@echo "make logs            - View service logs"
	@echo "make shell           - Access API shell"
	@echo "make migrate         - Run database migrations"
	@echo "make seed            - Seed database"
	@echo "make refresh         - Fresh migrate + seed"
	@echo "make test            - Run tests"
	@echo "make tinker          - Access Laravel tinker (REPL)"
	@echo "make ps              - Show running containers"
	@echo "make clean           - Remove all containers and volumes"
	@echo "make install         - Install dependencies"

up:
	docker-compose up -d
	@echo "Services started. Access at:"
	@echo "  API: http://localhost:8000"
	@echo "  Admin: http://localhost:3000"
	@echo "  Client: http://localhost:3001"
	@echo "  PostgreSQL: localhost:5432"
	@echo "  Redis: localhost:6379"
	@echo "  MinIO: http://localhost:9001 (minioadmin/minioadmin)"

down:
	docker-compose down

build:
	docker-compose build

rebuild:
	docker-compose build --no-cache

logs:
	docker-compose logs -f

logs-api:
	docker-compose logs -f api

logs-db:
	docker-compose logs -f postgres

shell:
	docker-compose exec api sh

migrate:
	docker-compose exec api php artisan migrate

seed:
	docker-compose exec api php artisan db:seed

refresh:
	docker-compose exec api php artisan migrate:fresh --seed

test:
	docker-compose exec api php artisan test

tinker:
	docker-compose exec api php artisan tinker

install:
	docker-compose exec api composer install
	docker-compose exec api npm install

ps:
	docker-compose ps

clean:
	docker-compose down -v
	docker volume prune -f
	@echo "All containers and volumes removed"

# Health check
healthcheck:
	@echo "Checking service health..."
	@curl -s http://localhost:8000/api/healthz && echo "✓ API healthy" || echo "✗ API down"
	@curl -s http://localhost:3000 > /dev/null && echo "✓ Admin app healthy" || echo "✗ Admin app down"
	@curl -s http://localhost:5432 > /dev/null 2>&1 && echo "✓ Database healthy" || echo "✗ Database down"

# Database utilities
db-backup:
	docker-compose exec postgres pg_dump -U fleet_user fleet_management > backup-$$(date +%Y%m%d-%H%M%S).sql

db-restore:
	@read -p "Enter backup file: " file; \
	docker-compose exec -T postgres psql -U fleet_user fleet_management < $$file

# Reset everything
reset: clean up migrate seed
	@echo "Environment reset complete"

.DEFAULT_GOAL := help
