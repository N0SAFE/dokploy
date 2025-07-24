# Multi-Service Preview Deployment Enhancement

## Database Schema Extensions

### New Table: Project Preview Deployments

```sql
CREATE TABLE project_preview_deployments (
  projectPreviewId TEXT PRIMARY KEY,
  projectId TEXT NOT NULL REFERENCES projects(projectId),
  pullRequestId TEXT NOT NULL,
  pullRequestNumber TEXT NOT NULL,
  pullRequestURL TEXT NOT NULL,
  pullRequestTitle TEXT NOT NULL,
  branch TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, deploying, ready, error
  previewUrl TEXT, -- Main preview URL
  createdAt TEXT NOT NULL,
  expiresAt TEXT,
  FOREIGN KEY (projectId) REFERENCES projects(projectId) ON DELETE CASCADE
);
```

### Modified Preview Deployments Table

```sql
-- Add optional reference to project preview
ALTER TABLE preview_deployments ADD COLUMN projectPreviewId TEXT REFERENCES project_preview_deployments(projectPreviewId);
```

### Service Preview Mapping Table

```sql
CREATE TABLE service_preview_deployments (
  servicePreviewId TEXT PRIMARY KEY,
  projectPreviewId TEXT NOT NULL REFERENCES project_preview_deployments(projectPreviewId),
  serviceId TEXT NOT NULL, -- Can be applicationId, composeId, or database service ID
  serviceType TEXT NOT NULL, -- 'application', 'compose', 'postgres', 'redis', etc.
  previewAppName TEXT NOT NULL, -- Generated name for this service in preview
  previewUrl TEXT, -- Service-specific preview URL
  status TEXT NOT NULL DEFAULT 'pending',
  deploymentOrder INTEGER DEFAULT 0, -- For dependency ordering
  createdAt TEXT NOT NULL
);
```

## Implementation Plan

### Phase 1: Core Infrastructure

1. **Project Preview Controller**
   - Create new TRPC router for project-level previews
   - Handle GitHub webhooks at project level
   - Coordinate deployment of multiple services

2. **Service Discovery System**
   - Generate preview-specific network names
   - Create environment variables for inter-service communication
   - Update DNS/routing for preview environments

3. **Dependency Management**
   - Analyze service dependencies within a project
   - Deploy services in correct order (databases first, then apps)
   - Handle rollback scenarios

### Phase 2: Service Coordination

1. **Enhanced Environment Variables**
   - Generate preview-specific service URLs
   - Create cross-service reference variables
   - Maintain isolation between preview environments

2. **Network Isolation**
   - Create preview-specific Docker networks
   - Ensure services can communicate within preview
   - Prevent cross-contamination between previews

3. **Domain Management**
   - Generate consistent subdomain patterns
   - Handle multiple service endpoints
   - Configure Traefik routing for all services

### Phase 3: UI and Management

1. **Dashboard Updates**
   - Project-level preview management interface
   - Service dependency visualization
   - Bulk operations for preview environments

2. **Configuration Options**
   - Per-project preview settings
   - Service inclusion/exclusion rules
   - Custom deployment ordering

## Example Usage

### Project Configuration

```yaml
# In project settings
previewDeployments:
  enabled: true
  services:
    - type: "postgres"
      id: "postgres_123"
      required: true
      order: 1
    - type: "redis" 
      id: "redis_456"
      required: true
      order: 2
    - type: "application"
      id: "api_789"
      required: true
      order: 3
      depends_on: ["postgres_123", "redis_456"]
    - type: "application"
      id: "frontend_101"
      required: true
      order: 4
      depends_on: ["api_789"]
```

### Generated Environment Variables

When a PR is created, each service gets:

```bash
# Database service gets:
SERVICE_POSTGRES_HOST=postgres-preview-pr123.dokploy-network
SERVICE_POSTGRES_URL=postgresql://user:pass@postgres-preview-pr123:5432/mydb
PROJECT_PREVIEW_ID=preview-pr123
PROJECT_PREVIEW_URL=https://preview-pr123.example.com

# API service gets:
DATABASE_URL=${SERVICE_POSTGRES_URL}
REDIS_URL=${SERVICE_REDIS_URL} 
API_URL=https://api-preview-pr123.example.com
PROJECT_PREVIEW_ID=preview-pr123

# Frontend service gets:
NEXT_PUBLIC_API_URL=${API_URL}
FRONTEND_URL=https://preview-pr123.example.com
PROJECT_PREVIEW_ID=preview-pr123
```

### Deployment Flow

1. **PR Created** → Webhook triggers project preview
2. **Dependency Analysis** → Determine deployment order
3. **Service Deployment** → Deploy in dependency order:
   - Deploy postgres (order 1)
   - Deploy redis (order 2) 
   - Deploy API (order 3, wait for DB services)
   - Deploy frontend (order 4, wait for API)
4. **Network Configuration** → Set up inter-service routing
5. **Status Update** → Comment on PR with all service URLs

## Benefits

✅ **Complete Environment Previews**: Test entire application stack
✅ **Service Dependencies**: Automatically handle service startup order
✅ **Cross-Service Communication**: Services can discover each other
✅ **Isolated Networks**: Each preview has its own network namespace
✅ **Comprehensive Testing**: Test full user flows across services
✅ **Render-like Experience**: Match Render's preview deployment capabilities

## Migration Strategy

1. **Backward Compatibility**: Existing single-app previews continue to work
2. **Opt-in Feature**: Projects must explicitly enable multi-service previews
3. **Gradual Migration**: Convert existing projects one by one
4. **Legacy Support**: Maintain existing preview deployment API

## Technical Considerations

### Resource Management
- Preview environments consume significant resources
- Need resource limits and cleanup policies
- Consider preview environment expiration

### Security
- Isolated networks prevent cross-preview access
- Environment variable isolation
- Proper cleanup of sensitive data

### Performance
- Parallel deployment where possible
- Efficient dependency resolution
- Quick cleanup when PR closes

### Monitoring
- Health checks for all preview services
- Deployment progress tracking
- Error aggregation across services
