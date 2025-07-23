# Dokploy Docker Setup

This repository contains Docker Compose configurations to run the Dokploy application with all its dependencies.

## Services

The Docker Compose setup includes the following services:

- **PostgreSQL** - Database for storing application data
- **Redis** - Cache and job queue management
- **Traefik** - Reverse proxy and load balancer
- **Dokploy** - Main application (Next.js + Node.js)
- **Monitoring** - Go-based monitoring service
- **Schedules** - Node.js scheduling service

## Prerequisites

- Docker (version 20.10 or later)
- Docker Compose (version 2.0 or later)
- At least 4GB of available RAM
- At least 10GB of available disk space

## Quick Start

### Production Setup

1. Clone the repository and navigate to the project directory:
```bash
git clone <repository-url>
cd dokploy
```

2. Start all services:
```bash
docker-compose up -d
```

3. Wait for all services to be healthy:
```bash
docker-compose ps
```

4. Access the applications:
   - **Dokploy Dashboard**: http://dokploy.localhost
   - **Traefik Dashboard**: http://traefik.localhost:8080
   - **Monitoring**: http://monitoring.localhost

### Development Setup

For development, use the development compose file which only starts the infrastructure services:

```bash
docker-compose -f docker-compose.dev.yml up -d
```

Then run the application locally:
```bash
# Install dependencies
pnpm install

# Setup the database
pnpm run dokploy:setup

# Start development server
pnpm run dokploy:dev
```

## Configuration

### Environment Variables

Copy and modify the environment files as needed:

For production:
```bash
cp .env.production.example .env.production
```

For development:
```bash
cp .env.development.example .env.development
```

### Important Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_HOST` - Redis host (default: dokploy-redis for containers, 127.0.0.1 for local)
- `PORT` - Application port (default: 3000)
- `NODE_ENV` - Environment mode (development/production)

### Custom Domains

To use custom domains instead of `.localhost`, update the Traefik labels in `docker-compose.yml`:

```yaml
labels:
  - "traefik.http.routers.dokploy.rule=Host(`your-domain.com`)"
```

## Accessing Services

### Internal Network Access

All services are connected to the `dokploy-network` and can communicate using their container names:

- PostgreSQL: `dokploy-postgres:5432`
- Redis: `dokploy-redis:6379`
- Dokploy: `dokploy-app:3000`
- Monitoring: `dokploy-monitoring:3001`

### External Access

Services are exposed through Traefik on the following URLs:

- **Dokploy**: http://dokploy.localhost
- **Traefik Dashboard**: http://traefik.localhost:8080
- **Monitoring**: http://monitoring.localhost

## Data Persistence

The following volumes are created for data persistence:

- `postgres_data` - PostgreSQL database files
- `redis_data` - Redis data files
- `traefik_data` - Traefik certificates and configuration
- `dokploy_data` - Application data files

## Commands

### Start all services
```bash
docker-compose up -d
```

### Stop all services
```bash
docker-compose down
```

### View logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f dokploy
```

### Rebuild services
```bash
# Rebuild all
docker-compose up -d --build

# Rebuild specific service
docker-compose up -d --build dokploy
```

### Database management
```bash
# Access PostgreSQL
docker-compose exec postgres psql -U dokploy -d dokploy

# Backup database
docker-compose exec postgres pg_dump -U dokploy dokploy > backup.sql

# Restore database
docker-compose exec -T postgres psql -U dokploy -d dokploy < backup.sql
```

### Redis management
```bash
# Access Redis CLI
docker-compose exec redis redis-cli

# View Redis info
docker-compose exec redis redis-cli info
```

## Troubleshooting

### Service Health Checks

Check if all services are healthy:
```bash
docker-compose ps
```

### Common Issues

1. **Port conflicts**: If ports 80, 443, 3000, 5432, or 6379 are already in use, modify the port mappings in `docker-compose.yml`

2. **Domain resolution**: Add entries to your hosts file for `.localhost` domains:
   ```
   127.0.0.1 dokploy.localhost
   127.0.0.1 traefik.localhost
   127.0.0.1 monitoring.localhost
   ```

3. **Docker socket permission**: On Linux, ensure your user is in the docker group:
   ```bash
   sudo usermod -aG docker $USER
   ```

4. **Memory issues**: Increase Docker's memory limit if services fail to start

### Logs and Debugging

View detailed logs for troubleshooting:
```bash
# Application logs
docker-compose logs -f dokploy

# Database logs
docker-compose logs -f postgres

# Redis logs
docker-compose logs -f redis

# Traefik logs
docker-compose logs -f traefik
```

## Security Considerations

1. **Change default passwords**: Update the PostgreSQL password in the environment files and compose file
2. **Use HTTPS**: Configure SSL certificates in Traefik for production use
3. **Secure secrets**: Use Docker secrets or external secret management for sensitive data
4. **Network isolation**: Consider using internal networks for production deployments

## Scaling

To scale services horizontally:
```bash
# Scale the main application
docker-compose up -d --scale dokploy=3

# Scale monitoring
docker-compose up -d --scale monitoring=2
```

## Maintenance

### Updates

To update to the latest versions:

1. Pull latest images:
```bash
docker-compose pull
```

2. Restart services:
```bash
docker-compose up -d
```

### Cleanup

Remove unused resources:
```bash
# Remove stopped containers
docker-compose down --remove-orphans

# Remove unused volumes (caution: this will delete data)
docker-compose down -v

# Remove unused images
docker image prune -a
```

## Support

For issues and questions:
- Check the application logs first
- Verify all services are healthy
- Ensure environment variables are correctly set
- Check the official Dokploy documentation
