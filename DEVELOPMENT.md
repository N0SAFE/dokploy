# 🚀 Dokploy Development Environment

This guide will help you set up a complete development environment for Dokploy with hot reloading, debugging capabilities, and all the modern development features you need.

## 🔥 Development Features

- **🔄 Hot Reloading** - Instant updates for all services
- **🐛 Debug Support** - Full debugging capabilities
- **📊 Live Monitoring** - Real-time service monitoring
- **🔗 Service Discovery** - Traefik routing with development domains
- **🗄️ Persistent Data** - Separate development databases
- **⚡ Fast Builds** - Optimized Docker builds with caching
- **🛠️ Development Tools** - Integrated testing, linting, and more

## 🏗️ Development Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Development Environment                   │
├─────────────────────────────────────────────────────────────┤
│  🌐 Traefik (localhost:8080/dashboard)                      │
│  ├── dokploy.localhost → Dokploy App (Hot Reload)           │
│  └── monitoring.localhost → Monitoring (Hot Reload)         │
├─────────────────────────────────────────────────────────────┤
│  📱 Dokploy App (Next.js + Node.js)                         │
│  ├── Frontend: Next.js with Fast Refresh                    │
│  ├── Backend: Node.js with tsx watch                        │
│  └── Volume: Source code mounted for live editing           │
├─────────────────────────────────────────────────────────────┤
│  📊 Monitoring Service (Go)                                 │
│  ├── Hot Reload: Air (Live reload for Go)                   │
│  └── Volume: Go source mounted for live editing             │
├─────────────────────────────────────────────────────────────┤
│  ⏰ Schedules Service (Node.js)                              │
│  ├── Hot Reload: tsx watch mode                             │
│  └── Volume: TypeScript source mounted                      │
├─────────────────────────────────────────────────────────────┤
│  🗄️ PostgreSQL (Development DB)                             │
│  └── Persistent volume for development data                 │
├─────────────────────────────────────────────────────────────┤
│  🔄 Redis (Development Cache)                                │
│  └── Persistent volume for development cache                │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Docker (20.10+)
- Docker Compose (2.0+)
- 8GB RAM (recommended)
- 20GB free disk space

### Start Development Environment

**Windows:**
```cmd
# Start full development environment
docker-dev.bat start

# Or just infrastructure for local development
docker-dev.bat start
```

**Linux/Mac:**
```bash
# Make script executable
chmod +x docker-dev.sh

# Start full development environment  
./docker-dev.sh start

# Or just infrastructure for local development
./docker-dev.sh start
```

### Access Development Services

Once started, access these URLs:

| Service | URL | Description |
|---------|-----|-------------|
| **Dokploy App** | http://dokploy.localhost | Main application with hot reload |
| **Traefik Dashboard** | http://localhost:8080/dashboard/ | Routing and service discovery |
| **Monitoring** | http://monitoring.localhost | Monitoring dashboard |
| **PostgreSQL** | localhost:5432 | Database (user: dokploy, db: dokploy) |
| **Redis** | localhost:6379 | Cache and job queue |

## 🔥 Hot Reloading Features

### Frontend (Next.js)
- **Fast Refresh** - Instant updates for React components
- **CSS Hot Reload** - Live updates for styles
- **TypeScript Watch** - Real-time type checking
- **TailwindCSS JIT** - Just-in-time CSS compilation

### Backend (Node.js)
- **tsx Watch Mode** - Instant server restarts on changes
- **API Route Updates** - Hot reload for API endpoints  
- **Database Schema Changes** - Auto-migration on schema updates
- **Environment Variable Updates** - Live config updates

### Monitoring Service (Go)
- **Air Live Reload** - Instant Go application restarts
- **Template Updates** - Hot reload for HTML templates
- **Configuration Changes** - Live config reloading

### Schedules Service (TypeScript)
- **tsx Watch Mode** - Instant TypeScript compilation and restart
- **Job Definition Updates** - Live cron job updates
- **Queue Processing** - Real-time job queue monitoring

## 🛠️ Development Commands

### Basic Commands
```bash
# Windows                    # Linux/Mac
docker-dev.bat start         ./docker-dev.sh start          # Start dev environment
docker-dev.bat stop          ./docker-dev.sh stop           # Stop dev environment  
docker-dev.bat restart       ./docker-dev.sh restart        # Restart dev environment
docker-dev.bat status        ./docker-dev.sh status         # Show service status
```

### Logging and Debugging
```bash
# View logs for all services
docker-dev.bat logs          ./docker-dev.sh logs

# View logs for specific service
docker-dev.bat logs dokploy  ./docker-dev.sh logs dokploy
docker-dev.bat logs monitoring ./docker-dev.sh logs monitoring
```

### Shell Access
```bash
# Enter application shell
docker-dev.bat shell dokploy ./docker-dev.sh shell dokploy

# Enter database shell
docker-dev.bat shell postgres ./docker-dev.sh shell postgres

# Enter Redis CLI
docker-dev.bat shell redis   ./docker-dev.sh shell redis
```

### Service Management
```bash
# Rebuild specific service
docker-dev.bat rebuild dokploy ./docker-dev.sh rebuild dokploy

# Rebuild monitoring service
docker-dev.bat rebuild monitoring ./docker-dev.sh rebuild monitoring
```

### Database Operations
```bash
# Run migrations
docker-dev.bat migrate        ./docker-dev.sh migrate

# Seed database with sample data
docker-dev.bat seed           ./docker-dev.sh seed

# Reset database (WARNING: deletes all data)
docker-dev.bat reset-db       ./docker-dev.sh reset-db
```

### Development Tools
```bash
# Run tests
docker-dev.bat test           ./docker-dev.sh test

# Install/update dependencies
docker-dev.bat install        ./docker-dev.sh install

# Clean development environment
docker-dev.bat clean          ./docker-dev.sh clean
```

## 📁 Project Structure

```
dokploy/
├── docker-compose.dev.yml     # Development compose configuration
├── Dockerfile.dev             # Development Dockerfile for main app
├── Dockerfile.monitoring.dev  # Development Dockerfile for monitoring
├── Dockerfile.schedules.dev   # Development Dockerfile for schedules
├── .env.dev                   # Development environment variables
├── docker-dev.sh              # Development manager script (Linux/Mac)
├── docker-dev.bat             # Development manager script (Windows)
│
├── apps/
│   ├── dokploy/               # Main Next.js application
│   │   ├── package.json       # App dependencies
│   │   ├── next.config.mjs    # Next.js configuration
│   │   ├── tailwind.config.ts # TailwindCSS configuration
│   │   └── ...
│   │
│   ├── monitoring/            # Go monitoring service
│   │   ├── main.go            # Main Go application
│   │   ├── go.mod             # Go dependencies
│   │   └── ...
│   │
│   └── schedules/             # TypeScript scheduling service
│       ├── src/               # TypeScript source
│       ├── package.json       # Service dependencies
│       └── ...
│
└── packages/
    └── server/                # Shared server package
        └── ...
```

## 🔧 Configuration

### Environment Variables

The development environment uses `.env.dev` for configuration:

```env
# Key development settings
NODE_ENV=development
NEXT_TELEMETRY_DISABLED=1
WATCHPACK_POLLING=true        # Enables hot reload in Docker
CHOKIDAR_USEPOLLING=true      # Enables file watching in containers
FAST_REFRESH=true             # Next.js Fast Refresh
TURBOPACK=1                   # Use Turbopack for faster builds

# Debug settings
DEBUG=dokploy:*               # Enable debug logging
LOG_LEVEL=debug               # Verbose logging
ENABLE_DEV_TOOLS=true         # Enable development tools
```

### Volume Mounts

Development containers use volume mounts for hot reloading:

```yaml
volumes:
  - .:/app                              # Source code mounted
  - node_modules:/app/node_modules      # Node modules in volume
  - dokploy_node_modules:/app/apps/dokploy/node_modules  # App modules
```

### Network Configuration

All services communicate on the `dokploy-network-dev` network:

```yaml
networks:
  dokploy-network:
    name: dokploy-network-dev    # Dedicated dev network
    driver: bridge
```

## 🐛 Debugging

### Application Debugging

1. **Frontend Debugging:**
   - Use browser DevTools
   - React DevTools extension
   - Next.js debugging: http://dokploy.localhost

2. **Backend Debugging:**
   - Node.js inspector enabled by default
   - Debug logs: `docker-dev.bat logs dokploy`
   - Database queries logged in development

3. **Go Service Debugging:**
   - Delve debugger available
   - Debug logs: `docker-dev.bat logs monitoring`

### Database Debugging

```bash
# Connect to PostgreSQL
docker-dev.bat shell postgres

# View database logs
docker-dev.bat logs postgres

# Monitor queries
docker-compose -f docker-compose.dev.yml exec postgres tail -f /var/log/postgresql/postgresql.log
```

### Redis Debugging

```bash
# Connect to Redis
docker-dev.bat shell redis

# Monitor Redis commands
docker-compose -f docker-compose.dev.yml exec redis redis-cli monitor
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
docker-dev.bat test

# Run specific test files (from app shell)
docker-dev.bat shell dokploy
pnpm test apps/dokploy/__test__/specific.test.ts
```

### Test Configuration

Tests run with development database and Redis instances, ensuring isolation from production data.

## 📊 Performance

### Development Optimizations

1. **Docker Layer Caching** - Dependencies cached between builds
2. **Named Volumes** - Fast node_modules access
3. **Polling Disabled** - Efficient file watching
4. **Parallel Builds** - Services build simultaneously
5. **Incremental Compilation** - TypeScript incremental builds

### Monitoring Performance

- **Traefik Dashboard**: Monitor request routing and response times
- **Application Logs**: Track performance metrics
- **Docker Stats**: Monitor container resource usage

```bash
# Monitor container resources
docker stats

# Monitor specific service
docker-dev.bat logs dokploy | grep "performance\|timing"
```

## 🔒 Security Notes

### Development Security

⚠️ **Warning**: Development environment uses default passwords and insecure configurations.

- Default database password: `amukds4wi9001583845717ad2`
- Default auth secret: `dev-better-auth-secret-key`
- All traffic over HTTP (not HTTPS)
- Debug endpoints enabled

### Production Migration

Before production deployment:

1. ✅ Change all default passwords
2. ✅ Generate secure secrets
3. ✅ Enable HTTPS/SSL
4. ✅ Disable debug endpoints
5. ✅ Use production environment files

## 🆘 Troubleshooting

### Common Issues

**1. Hot Reload Not Working**
```bash
# Check file watching environment variables
docker-dev.bat shell dokploy
echo $WATCHPACK_POLLING $CHOKIDAR_USEPOLLING

# Restart with clean volumes
docker-dev.bat clean
docker-dev.bat start
```

**2. Port Conflicts**
```bash
# Check what's using ports
netstat -tulpn | grep :3000
netstat -tulpn | grep :8080

# Modify ports in docker-compose.dev.yml if needed
```

**3. Database Connection Issues**
```bash
# Check database health
docker-dev.bat status

# Reset database
docker-dev.bat reset-db
```

**4. Build Failures**
```bash
# Clean rebuild
docker-dev.bat clean
docker-dev.bat start

# Check build logs
docker-dev.bat logs dokploy
```

### Getting Help

1. **Check service logs**: `docker-dev.bat logs [service]`
2. **Verify service health**: `docker-dev.bat status`
3. **Review configuration**: Check `.env.dev` and `docker-compose.dev.yml`
4. **Clean restart**: `docker-dev.bat clean && docker-dev.bat start`

## 🎯 Best Practices

### Development Workflow

1. **Start Environment**: `docker-dev.bat start`
2. **Make Changes**: Edit source code with your favorite editor
3. **Watch Changes**: Changes automatically reflected (hot reload)
4. **Test Changes**: Run tests with `docker-dev.bat test`
5. **Debug Issues**: Use `docker-dev.bat logs [service]`
6. **Commit Changes**: Standard git workflow

### Code Quality

```bash
# Run linting (from app shell)
docker-dev.bat shell dokploy
pnpm run check

# Format code
pnpm run format

# Type checking
pnpm run typecheck
```

### Database Management

```bash
# Regular migration workflow
docker-dev.bat migrate          # Run pending migrations
docker-dev.bat seed             # Add sample data (optional)

# Reset if needed
docker-dev.bat reset-db         # Clean slate
```

## 🚀 Next Steps

1. **Start Development**: Use `docker-dev.bat start` to begin
2. **Explore Services**: Visit all the URLs and explore the features
3. **Make Changes**: Edit code and see instant updates
4. **Run Tests**: Ensure your changes work
5. **Debug**: Use the comprehensive debugging tools
6. **Deploy**: Move to production when ready

---

**Happy Development! 🎉**

The development environment is now ready with full hot reloading, debugging capabilities, and modern developer experience features!
