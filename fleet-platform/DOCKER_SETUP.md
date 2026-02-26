# Docker Setup Guide - Fleet Management System

## Overview

This Docker setup provides a complete containerized environment for the Fleet Management System with:
- **Laravel API** (PHP 8.3 with PostgreSQL)
- **PostgreSQL 16** (Database)
- **Redis 7** (Cache & Queue)
- **MinIO** (S3-compatible Storage)
- **React Admin App** (web-admin)
- **React Client App** (web-client)

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- Git
- 4GB RAM minimum for containers
- 10GB disk space for images and data

### Installation

**Windows:**
- Install [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop)
- Enable WSL 2 backend

**macOS:**
- Install [Docker Desktop for Mac](https://www.docker.com/products/docker-desktop)

**Linux:**
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo apt install docker-compose-v2
```

## Quick Start

### 1. Clone and Setup

```bash
cd fleet-platform
cp .env.example .env
```

### 2. Generate Laravel Key

```bash
docker-compose exec api php artisan key:generate
```

### 3. Start Services

```bash
docker-compose up -d
```

### 4. Run Migrations & Seeding

```bash
docker-compose exec api php artisan migrate:fresh --seed
docker-compose exec api php artisan db:seed --class=RolePermissionSeeder
```

### 5. Access Services

- **API**: http://localhost:8000/api
- **Admin Portal**: http://localhost:3000
- **Client Portal**: http://localhost:3001
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379
- **MinIO Admin**: http://localhost:9001 (minioadmin/minioadmin)

## Service Details

### Laravel API (Port 8000)
```
Container: fleet-api
Image: custom (built from apps/api/Dockerfile)
Entrypoint: php artisan serve --host=0.0.0.0 --port=8000
```

**Health Check**: `GET /api/healthz`

**Environment Variables**:
- `APP_ENV=production`
- `DB_CONNECTION=pgsql`
- `DB_HOST=postgres`
- `REDIS_HOST=redis`
- `QUEUE_CONNECTION=redis`
- `CACHE_DRIVER=redis`

### PostgreSQL (Port 5432)
```
Container: fleet-postgres
Image: postgres:16-alpine
Database: fleet_management
User: fleet_user
```

**Connection String**:
```
postgresql://fleet_user:fleet_password@postgres:5432/fleet_management
```

**Persistent Data**: Stored in `postgres_data` volume

### Redis (Port 6379)
```
Container: fleet-redis
Image: redis:7-alpine
Purpose: Caching, Queue Driver, Session Storage
```

**Persistent Data**: Stored in `redis_data` volume

### MinIO (Ports 9000, 9001)
```
Container: fleet-minio
Image: minio/minio:latest
S3-compatible object storage
Console: http://localhost:9001
```

**Default Credentials**:
- Username: `minioadmin`
- Password: `minioadmin`

### React Admin App (Port 3000)
```
Container: fleet-web-admin
Image: custom (built from apps/web-admin/Dockerfile)
Purpose: Operations dashboard for ACB (service company)
```

**Features**:
- Vehicle management
- Service request handling
- Quote management
- Work order creation
- Invoice management

### React Client App (Port 3001)
```
Container: fleet-web-client
Image: custom (built from apps/web-client/Dockerfile)
Purpose: Client portal for SGS (vehicle owner)
```

**Features**:
- View assigned vehicles
- Track service requests
- Review quotes and invoices
- Approve work orders

## Using Make Commands

A `Makefile` is provided for convenient Docker operations:

```bash
# Start services
make up

# View logs
make logs
make logs-api
make logs-db

# Run commands
make migrate
make seed
make refresh        # Fresh migrate + seed
make test

# Access shell
make shell          # API shell

# Database backup/restore
make db-backup
make db-restore

# Health check
make healthcheck

# Stop services
make down

# Clean everything
make clean
```

## Configuration

### Environment Variables

Edit `.env` in the root directory:

```env
# Application
APP_NAME="Fleet Management System"
APP_ENV=production
APP_DEBUG=false

# Database
DB_DATABASE=fleet_management
DB_USERNAME=fleet_user
DB_PASSWORD=fleet_password

# Redis
REDIS_PASSWORD=null

# MinIO
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin
```

### Database Configuration

**Connection in API**:
- Host: `postgres` (internal Docker network)
- Port: `5432`
- Database: `fleet_management`
- User: `fleet_user`
- Password: `fleet_password`

**From Host Machine**:
```bash
psql -h localhost -p 5432 -U fleet_user -d fleet_management
```

## Testing

### Run Tests

```bash
docker-compose exec api php artisan test
```

### Run E2E Tests

```bash
docker-compose exec api php e2e-test.php
```

### Access Tinker (REPL)

```bash
docker-compose exec api php artisan tinker
```

## Development Workflow

### Enable Dev Services

By default, React apps are excluded. To enable them (for development):

```bash
docker-compose up -d --profile dev
```

### Hot Reload

React dev servers support hot module replacement. Edit source files:

```bash
# Watch for changes
- Admin: apps/web-admin/src/**
- Client: apps/web-client/src/**
```

Changes will automatically reload in the browser.

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
docker-compose logs -f postgres
docker-compose logs -f redis
```

### Shell Access

```bash
# Laravel API shell
docker-compose exec api sh

# Run artisan commands
docker-compose exec api php artisan migrate
docker-compose exec api php artisan db:seed

# Database shell
docker-compose exec postgres psql -U fleet_user -d fleet_management
```

## Production Deployment

### Before Deployment

1. **Update `.env`**:
   ```env
   APP_ENV=production
   APP_DEBUG=false
   APP_KEY=base64:your-secure-random-key (generate with `php artisan key:generate`)
   ```

2. **Use Strong Passwords**:
   - Change database password
   - Change MinIO credentials
   - Change Redis password if needed

3. **Use External Database** (Optional):
   ```env
   DB_HOST=external-db.aws.example.com
   DB_CONNECTION=pgsql
   DB_DATABASE=fleet_prod
   DB_USERNAME=prod_user
   DB_PASSWORD=strong_password
   ```

4. **Use External Redis** (Optional):
   ```env
   REDIS_HOST=redis-cluster.aws.example.com
   REDIS_PORT=6379
   REDIS_PASSWORD=redis_password
   ```

5. **Configure Sanctum CORS**:
   ```env
   SANCTUM_STATEFUL_DOMAINS=api.example.com,admin.example.com,client.example.com
   ```

### Deploy with Docker Compose

```bash
# Pull latest code
git pull

# Build images
docker-compose build

# Start services
docker-compose up -d

# Run migrations
docker-compose exec -T api php artisan migrate --force

# Seed initial data
docker-compose exec -T api php artisan db:seed --force
```

### Kubernetes Deployment

Convert to Kubernetes manifests:

```bash
# Install kompose
curl -L https://github.com/kubernetes/kompose/releases/download/v1.31.2/kompose-linux-amd64 -o kompose
chmod +x kompose

# Convert docker-compose.yml
./kompose convert -f docker-compose.yml -o k8s/
```

### Docker Swarm Deployment

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml fleet-mgmt
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs api

# Rebuild image
docker-compose build --no-cache api

# Check if port is in use
netstat -tulpn | grep LISTEN
```

### Database Connection Errors

```bash
# Test connection
docker-compose exec postgres psql -U fleet_user -d fleet_management -c "SELECT 1"

# Check credentials in .env
cat .env | grep DB_

# Restart database
docker-compose restart postgres
```

### Redis Connection Issues

```bash
# Test Redis
docker-compose exec redis redis-cli ping

# Check Redis logs
docker-compose logs redis
```

### Migrations Fail

```bash
# Check migration status
docker-compose exec api php artisan migrate:status

# Rollback last migration
docker-compose exec api php artisan migrate:rollback

# Fresh migration
docker-compose exec api php artisan migrate:fresh --seed
```

### API Returns 503 Service Unavailable

Usually means database isn't ready. Wait for database to be healthy:

```bash
# Watch service health
docker-compose exec api php artisan tinker
# Then run: DB::connection()->getPdo();
```

### React App Won't Load

```bash
# Check if Node dependencies installed
docker-compose exec web-admin npm install

# Check build output
docker-compose logs web-admin

# Rebuild React app
docker-compose build --no-cache web-admin
```

## Performance Tuning

### Increase PHP-FPM Workers

Edit `apps/api/docker/php-fpm.conf`:

```conf
pm.max_children = 50        # Increase from 20
pm.start_servers = 10       # Increase from 5
pm.min_spare_servers = 5    # Increase from 2
pm.max_spare_servers = 20   # Increase from 10
```

### Enable Query Caching

Edit Docker Compose environment:

```yaml
api:
  environment:
    - CACHE_DRIVER=redis
    - QUERY_CACHE_ENABLED=true
```

### Increase Redis Memory

Edit docker-compose.yml:

```yaml
redis:
  command: redis-server --maxmemory 512mb --maxmemory-policy allkeys-lru
```

## Security

### Network Isolation

Services communicate via internal `fleet-network`. To expose only API:

```yaml
services:
  api:
    ports:
      - "8000:8000"    # Keep open
  postgres:
    # Don't expose port - only accessible from api
  redis:
    # Internal only
```

### Database Security

```bash
# Change password in .env
DB_PASSWORD=complex_secure_password

# Run migration with strong password
docker-compose down
docker-compose up -d postgres
docker-compose exec postgres psql -U fleet_user -c "ALTER USER fleet_user WITH PASSWORD 'new_password';"
```

### SSL/TLS

For production, use reverse proxy (Nginx, Traefik):

```yaml
# docker-compose comes with built-in Traefik labels
api:
  labels:
    - "traefik.enable=true"
    - "traefik.http.routers.api.rule=Host(`api.example.com`)"
    - "traefik.http.routers.api.tls.certresolver=letsencrypt"
```

## Backup & Restore

### Backup Database

```bash
docker-compose exec postgres pg_dump -U fleet_user fleet_management > backup.sql

# Compressed
docker-compose exec postgres pg_dump -U fleet_user fleet_management | gzip > backup.sql.gz
```

### Restore Database

```bash
docker-compose exec -T postgres psql -U fleet_user fleet_management < backup.sql

# From compressed
gunzip < backup.sql.gz | docker-compose exec -T postgres psql -U fleet_user fleet_management
```

### Backup Volumes

```bash
# Backup PostgreSQL data
docker run --rm -v fleet-platform_postgres_data:/data -v $(pwd):/backup \
  alpine tar czf /backup/postgres-backup.tar.gz -C /data .

# Backup Redis data
docker run --rm -v fleet-platform_redis_data:/data -v $(pwd):/backup \
  alpine tar czf /backup/redis-backup.tar.gz -C /data .
```

## Monitoring

### View Container Stats

```bash
docker stats

# JSON format
docker container stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
```

### View Service Health

```bash
# All services
docker-compose ps

# Detailed health
docker-compose ps --format "table {{.Service}}\t{{.State}}\t{{.Status}}"
```

### Access Logs

```bash
# Real-time logs
docker-compose logs -f

# With timestamp
docker-compose logs -f --timestamps

# Specific service
docker-compose logs -f api --tail 100
```

## Next Steps

1. **Configure Authentication**
   - Login credentials in seeded users
   - Update JWT/Sanctum settings

2. **Set Up Monitoring**
   - Add Prometheus/Grafana for metrics
   - Configure APM (Application Performance Monitoring)

3. **Enable Logging**
   - ELK Stack (Elasticsearch, Logstash, Kibana)
   - Centralized logging for all services

4. **Implement CI/CD**
   - GitHub Actions for automated testing
   - AutoDeploy on push to main

5. **Scale Services**
   - Load balancer for API
   - Database read replicas
   - Redis cluster for cache

## Support

For issues or questions:
1. Check service logs: `docker-compose logs [service]`
2. Verify `.env` configuration
3. Ensure Docker and Docker Compose are up to date
4. Review [Docker Compose Documentation](https://docs.docker.com/compose/)

## References

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [Laravel Docker Docs](https://laravel.com/docs/deployment#server-requirements)
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)
- [Redis Docker Image](https://hub.docker.com/_/redis)
- [MinIO Docker Deployment](https://min.io/docs/minio/container/index.html)
