# 📋 Dokploy Package.json Scripts Guide

This document explains all the available npm/pnpm scripts for managing both development and production environments.

## 🚀 Quick Commands

### Development Environment
```bash
# Start development environment (with hot reload)
pnpm run dev

# Start with rebuild
pnpm run dev:build

# View development logs
pnpm run dev:logs

# Stop development environment
pnpm run dev:stop
```

### Production Environment
```bash
# Start production environment
pnpm run prod

# Start with rebuild
pnpm run prod:build

# View production logs
pnpm run prod:logs

# Stop production environment
pnpm run prod:stop
```

## 📚 Complete Script Reference

### 🔧 Development Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `docker-compose -f docker-compose.dev.yml up -d` | Start development environment with hot reload |
| `dev:build` | `docker-compose -f docker-compose.dev.yml up -d --build` | Start dev environment and rebuild all images |
| `dev:logs` | `docker-compose -f docker-compose.dev.yml logs -f` | Show live logs for all development services |
| `dev:stop` | `docker-compose -f docker-compose.dev.yml down` | Stop development environment |
| `dev:clean` | `docker-compose -f docker-compose.dev.yml down -v --remove-orphans` | Stop and remove all dev containers, networks, and volumes |
| `dev:restart` | `pnpm run dev:stop && pnpm run dev` | Restart development environment |
| `dev:shell` | `docker-compose -f docker-compose.dev.yml exec dokploy /bin/bash` | Enter development app container shell |
| `dev:db` | `docker-compose -f docker-compose.dev.yml exec postgres psql -U dokploy -d dokploy` | Enter development PostgreSQL shell |
| `dev:redis` | `docker-compose -f docker-compose.dev.yml exec redis redis-cli` | Enter development Redis CLI |

### 🏭 Production Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `prod` | `docker-compose up -d` | Start production environment |
| `prod:build` | `docker-compose up -d --build` | Start production environment and rebuild all images |
| `prod:logs` | `docker-compose logs -f` | Show live logs for all production services |
| `prod:stop` | `docker-compose down` | Stop production environment |
| `prod:clean` | `docker-compose down -v --remove-orphans` | Stop and remove all prod containers, networks, and volumes |
| `prod:restart` | `pnpm run prod:stop && pnpm run prod` | Restart production environment |
| `prod:shell` | `docker-compose exec dokploy /bin/bash` | Enter production app container shell |
| `prod:db` | `docker-compose exec postgres psql -U dokploy -d dokploy` | Enter production PostgreSQL shell |
| `prod:redis` | `docker-compose exec redis redis-cli` | Enter production Redis CLI |

### 🛠️ Application Development Scripts (apps/dokploy)

| Script | Command | Description |
|--------|---------|-------------|
| `dokploy:dev` | `pnpm --filter=dokploy run dev` | Start Dokploy app in development mode |
| `dokploy:dev:turbopack` | `pnpm --filter=dokploy run dev-turbopack` | Start with Turbopack for faster builds |
| `dokploy:build` | `pnpm --filter=dokploy run build` | Build Dokploy app for production |
| `dokploy:start` | `pnpm --filter=dokploy run start` | Start built Dokploy app |
| `dokploy:setup` | `pnpm --filter=dokploy run setup` | Run initial setup and migrations |
| `dev:watch` | `tsx watch -r dotenv/config ./server/server.ts` | Start with file watching for auto-restart |
| `dev:debug` | `tsx --inspect -r dotenv/config ./server/server.ts` | Start with Node.js debugger |
| `dev:env` | `tsx -r dotenv/config --env-file=.env.dev ./server/server.ts` | Start with development environment file |
| `prod:env` | `tsx -r dotenv/config --env-file=.env.production ./server/server.ts` | Start with production environment file |

### 🗄️ Database Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `migration:generate` | `drizzle-kit generate --config ./server/db/drizzle.config.ts` | Generate new database migration |
| `migration:run` | `tsx -r dotenv/config migration.ts` | Run pending database migrations |
| `migration:up` | `drizzle-kit up --config ./server/db/drizzle.config.ts` | Move migrations up |
| `migration:drop` | `drizzle-kit drop --config ./server/db/drizzle.config.ts` | Drop migration |
| `db:push` | `drizzle-kit push --config ./server/db/drizzle.config.ts` | Push schema changes to database |
| `db:studio` | `drizzle-kit studio --config ./server/db/drizzle.config.ts` | Open Drizzle Studio |
| `db:seed` | `tsx -r dotenv/config ./server/db/seed.ts` | Seed database with sample data |
| `db:clean` | `tsx -r dotenv/config ./server/db/reset.ts` | Clean/reset database |
| `db:truncate` | `tsx -r dotenv/config ./server/db/reset.ts` | Truncate all database tables |

### 🧪 Testing & Quality Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `test` | `pnpm --filter=dokploy run test` | Run all tests |
| `typecheck` | `pnpm -r run typecheck` | Run TypeScript type checking |
| `check` | `biome check --write --no-errors-on-unmatched --files-ignore-unknown=true` | Run code formatting and linting |
| `format-and-lint` | `biome check .` | Check code formatting and linting |
| `format-and-lint:fix` | `biome check . --write` | Fix code formatting and linting issues |
| `format` | `biome format --write` | Format code |
| `lint` | `biome lint` | Run linting |

### 🐳 Docker Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `docker:build:canary` | `./apps/dokploy/docker/build.sh canary` | Build Docker image with canary tag |

### 🔧 Server Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `server:script` | `pnpm --filter=server run switch:dev` | Run server development script |
| `server:dev` | `pnpm --filter=server run dev` | Start server in development mode |
| `server:build` | `pnpm --filter=server run build` | Build server package |

### 🔐 Utility Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `reset-password` | `node -r dotenv/config dist/reset-password.mjs` | Reset user password |
| `reset-2fa` | `node -r dotenv/config dist/reset-2fa.mjs` | Reset 2FA for user |
| `version` | `echo $(node -p "require('./package.json').version")` | Show current version |

## 🎯 Common Workflows

### 🚀 Starting Development

```bash
# Method 1: Full Docker development environment
pnpm run dev

# Method 2: Local development with infrastructure
pnpm run dev:stop  # Stop any running dev environment
pnpm run dev       # Start fresh

# Method 3: Individual app development
pnpm run dokploy:dev  # Start just the app locally
```

### 🏭 Starting Production

```bash
# Start production environment
pnpm run prod

# Or start with fresh build
pnpm run prod:build
```

### 🗄️ Database Management

```bash
# Setup fresh database
pnpm run dokploy:setup

# Run migrations
pnpm run migration:run

# Seed with sample data
pnpm run db:seed

# Reset database
pnpm run db:clean
pnpm run migration:run
```

### 🐛 Debugging

```bash
# View logs
pnpm run dev:logs        # Development logs
pnpm run prod:logs       # Production logs

# Enter containers
pnpm run dev:shell       # Development app shell
pnpm run dev:db          # Development database shell
pnpm run dev:redis       # Development Redis CLI
```

### 🧹 Cleanup

```bash
# Clean development environment
pnpm run dev:clean

# Clean production environment
pnpm run prod:clean

# Clean everything
pnpm run dev:clean && pnpm run prod:clean
```

## 💡 Tips

### 🔄 Hot Reloading
- `pnpm run dev` - Full hot reload with Docker volumes
- `pnpm run dokploy:dev` - Local development with hot reload
- `pnpm run dev:watch` - File watching with auto-restart

### 🚀 Performance
- `pnpm run dokploy:dev:turbopack` - Use Turbopack for faster builds
- `pnpm run dev:build` - Rebuild Docker images when needed

### 🐛 Debugging
- `pnpm run dev:debug` - Start with Node.js debugger attached
- `pnpm run dev:logs` - Monitor logs in real-time

### 🌍 Environment Management
- `pnpm run dev:env` - Use `.env.dev` file
- `pnpm run prod:env` - Use `.env.production` file

## 🔧 Environment Files

Make sure you have the correct environment files:

- `.env.dev` - Development environment variables
- `.env.production` - Production environment variables
- `.env.development` - Local development variables

## 🚨 Important Notes

⚠️ **Development vs Production**
- Development environment runs on separate ports and networks
- Development uses volume mounts for hot reloading
- Production uses optimized builds and production settings

⚠️ **Database Safety**
- `dev:clean` and `prod:clean` will delete all data
- Always backup important data before cleaning
- Development and production use separate databases

⚠️ **Port Conflicts**
- Development and production environments use different ports
- Make sure ports are available before starting services

## 📚 Additional Resources

- `DEVELOPMENT.md` - Comprehensive development guide
- `DOCKER_SETUP.md` - Docker setup documentation
- `docker-dev.sh` / `docker-dev.bat` - Development management scripts
- `docker-manager.sh` / `docker-manager.bat` - Production management scripts
