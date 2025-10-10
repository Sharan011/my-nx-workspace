# Task Management System - Enterprise NX Monorepo

A full-stack task management system built with NestJS, Angular, PostgreSQL, and NX monorepo architecture, featuring role-based access control (RBAC), multi-tenant organization support, and comprehensive audit logging.

---

### Architecture Overview

### Monorepo Structure

```
my-nx-workspace/
├── apps/
│   ├── api/                    # NestJS Backend
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── auth/      # Authentication module
│   │   │   │   ├── tasks/     # Task management module
│   │   │   │   ├── users/     # User management module
│   │   │   │   └── organizations/ # Organization module
│   │   │   └── main.ts
│   │   └── project.json
│   └── dashboard/              # Angular Frontend
│       ├── src/
│       │   └── app/
│       │       ├── components/
│       │       ├── services/
│       │       └── guards/
│       └── project.json
├── libs/
│   ├── data/                   # Shared TypeScript interfaces
│   │   └── src/
│   │       └── lib/
│   │           ├── user.interface.ts
│   │           ├── task.interface.ts
│   │           └── organization.interface.ts
│   └── auth/                   # Reusable RBAC logic
│       └── src/
│           └── lib/
│               ├── roles.enum.ts
│               └── permissions.decorator.ts
├── docker-compose.yml          # PostgreSQL container
└── README.md
```

### Why NX Monorepo?

**1. Code Sharing:**
- Shared TypeScript interfaces between frontend and backend
- Consistent type safety across the entire stack
- Reusable authentication logic

**2. Dependency Graph:**
- Clear visualization of project dependencies
- Prevents circular dependencies
- Optimized build caching

**3. Task Orchestration:**
- Run multiple apps simultaneously
- Affected command runs only changed projects
- Parallel execution for faster builds

**4. Scalability:**
- Easy to add new applications (mobile app, admin panel)
- Shared libraries reduce code duplication
- Consistent tooling across projects

---

### Data Model & Schema

### Entity Relationship Diagram

```
┌─────────────────────┐
│   Organizations     │
│─────────────────────│
│ id (PK)            │
│ name               │
│ createdAt          │
└─────────────────────┘
          │
          │ 1:N
          ▼
┌─────────────────────┐         ┌─────────────────────┐
│       Users         │         │       Tasks         │
│─────────────────────│         │─────────────────────│
│ id (PK)            │◄────────│ id (PK)            │
│ email              │  1:N    │ title              │
│ password (hashed)  │         │ description        │
│ firstName          │         │ status             │
│ lastName           │         │ priority           │
│ role (enum)        │         │ createdById (FK)   │
│ organizationId(FK) │         │ assignedToId (FK)  │
│ createdAt          │         │ organizationId(FK) │
│ updatedAt          │         │ createdAt          │
└────────────────────┘         │ updatedAt          │
                               └─────────────────────┘
```

### Database Schema Details

### Users Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Unique user identifier |
| `email` | VARCHAR(255) UNIQUE | User email (login) |
| `password` | VARCHAR(255) | bcrypt hashed password |
| `firstName` | VARCHAR(100) | User's first name |
| `lastName` | VARCHAR(100) | User's last name |
| `role` | ENUM | `super_admin`, `org_admin`, `manager`, `member` |
| `organizationId` | UUID (FK) | References Organizations.id |
| `createdAt` | TIMESTAMP | Auto-generated creation time |
| `updatedAt` | TIMESTAMP | Auto-updated modification time |

**Indexes:**
- Primary: `id`
- Unique: `email`
- Foreign Key: `organizationId`

---

#### Organizations Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Unique organization identifier |
| `name` | VARCHAR(255) | Organization name |
| `createdAt` | TIMESTAMP | Auto-generated creation time |

**Indexes:**
- Primary: `id`

---

#### Tasks Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Unique task identifier |
| `title` | VARCHAR(255) | Task title |
| `description` | TEXT | Detailed task description |
| `status` | ENUM | `todo`, `in_progress`, `done` |
| `priority` | ENUM | `low`, `medium`, `high` |
| `createdById` | UUID (FK) | User who created the task |
| `assignedToId` | UUID (FK, nullable) | User assigned to task |
| `organizationId` | UUID (FK) | Task belongs to organization |
| `createdAt` | TIMESTAMP | Auto-generated creation time |
| `updatedAt` | TIMESTAMP | Auto-updated modification time |

**Indexes:**
- Primary: `id`
- Foreign Keys: `createdById`, `assignedToId`, `organizationId`
- Composite: `(organizationId, status)` for filtering

---

### Access Control Implementation

### Role Hierarchy


super_admin (System-wide access, i.e owner)
    │
    ├─── org_admin (Organization-wide access, i.e admin)
    │       │
    │       ├─── manager (Team management -> (new role))
    │       │       │
    │       │       └─── member (Task execution, i.e viewer)


### Role Permissions Matrix

| Action | super_admin | org_admin | manager | member |
|--------|-------------|-----------|---------|--------|
| Create Organization | ✅ | ❌ | ❌ | ❌ |
| Manage Any User | ✅ | ✅ (own org) | ❌ | ❌ |
| Create Task | ✅ | ✅ | ✅ | ✅ |
| View All Tasks | ✅ | ✅ (own org) | ✅ (own org) | ✅ (own org) |
| Update Any Task | ✅ | ✅ (own org) | ✅ (own org) | ❌ |
| Update Own Task | ✅ | ✅ | ✅ | ✅ |
| Delete Task | ✅ | ✅ (own org) | ❌ | ❌ |
| Assign Task | ✅ | ✅ | ✅ | ❌ |


----


### RBAC Implementation

### Role-Based Decorators

```typescript
// libs/auth/src/lib/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';

export enum Role {
  SUPER_ADMIN = 'super_admin',
  ORG_ADMIN = 'org_admin',
  MANAGER = 'manager',
  MEMBER = 'member'
}

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
```

### JWT Authentication Flow

1. User Login
   ├─ POST /api/auth/login
   ├─ Validate credentials (bcrypt compare)
   ├─ Generate JWT token (includes: userId, email, role, organizationId)
   └─ Return { access_token, user }

2. Protected Request
   ├─ Client sends: Authorization: Bearer <token>
   ├─ AuthGuard validates JWT signature
   ├─ Extracts user payload from token
   ├─ Attaches user to request object
   └─ RolesGuard checks required permissions

3. Role Check
   ├─ @Roles('org_admin', 'manager') decorator on controller
   ├─ RolesGuard reads required roles from metadata
   ├─ Compares with user.role from JWT payload
   └─ Allow/Deny access


### Organization-Level Isolation

```typescript
// Automatic organization filtering in TaskService
async findAll(user: User): Promise<Task[]> {
  return this.taskRepository.find({
    where: { organizationId: user.organizationId },
    relations: ['createdBy', 'assignedTo']
  });
}
```

**Key Security Features:**
-  JWT tokens expire after 24 hours
-  Passwords hashed with bcrypt (10 rounds)
-  Organization ID validated in every request
-  Cross-organization access prevented at database level
-  Role hierarchy enforced by guards


---


###  Setup Instructions

### Prerequisites

- Node.js v20.19+ or v22.12+
- Docker & Docker Compose
- PostgreSQL (via Docker)
- npm or yarn

### 1. Clone Repository

```bash
git clone <repository-url>
cd my-nx-workspace
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create `.env` file in root:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=taskdb

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
JWT_EXPIRES_IN=24h

# Application
PORT=3333
NODE_ENV=development
```

** IMPORTANT:** Change `JWT_SECRET` in production! Use a strong random string.

### 4. Start PostgreSQL

```bash
docker-compose up -d
```

Verify database is running:
```bash
docker ps
```

### 5. Run Backend API

```bash
npx nx serve api
```

Backend runs at: `http://localhost:3333/api`

### 6. Run Frontend (Angular)

```bash
npx nx serve dashboard
```

Frontend runs at: `http://localhost:4200`

### 7. Database Auto-Setup

The database schema is created automatically via TypeORM `synchronize: true`.

** Production:** Set `synchronize: false` and use migrations!



---



###  API Documentation

### Base URL
```
http://localhost:3333/api
```


---



### Authentication Endpoints

#### 1. Register User + Create Organization

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "admin@company.com",
  "password": "secure123",
  "firstName": "John",
  "lastName": "Doe",
  "organizationName": "Acme Corp",
  "role": "super_admin"
}
```

**Response (201 Created):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "admin@company.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "super_admin",
  "organization": {
    "id": "987e6543-e21b-34c5-a678-426614174111",
    "name": "Acme Corp"
  }
}
```

---

#### 2. Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@company.com",
  "password": "secure123"
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "admin@company.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "super_admin",
    "organizationId": "987e6543-e21b-34c5-a678-426614174111"
  }
}
```

---

### Task Endpoints

#### 3. Get All Tasks

```http
GET /api/tasks
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
[
  {
    "id": "task-uuid-1",
    "title": "Fix login bug",
    "description": "Users can't login with special characters",
    "status": "in_progress",
    "priority": "high",
    "createdBy": {
      "id": "user-uuid",
      "firstName": "John",
      "lastName": "Doe"
    },
    "assignedTo": {
      "id": "assignee-uuid",
      "firstName": "Jane",
      "lastName": "Smith"
    },
    "createdAt": "2025-10-09T10:30:00.000Z",
    "updatedAt": "2025-10-09T14:20:00.000Z"
  }
]
```

---

#### 4. Create Task

```http
POST /api/tasks
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "title": "Implement dark mode",
  "description": "Add dark theme toggle to settings",
  "status": "todo",
  "priority": "medium",
  "assignedToId": "assignee-user-uuid"
}
```

**Response (201 Created):**
```json
{
  "id": "new-task-uuid",
  "title": "Implement dark mode",
  "description": "Add dark theme toggle to settings",
  "status": "todo",
  "priority": "medium",
  "createdById": "current-user-uuid",
  "assignedToId": "assignee-user-uuid",
  "organizationId": "org-uuid",
  "createdAt": "2025-10-09T15:45:00.000Z",
  "updatedAt": "2025-10-09T15:45:00.000Z"
}
```

---

#### 5. Update Task

```http
PATCH /api/tasks/:id
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "status": "done",
  "priority": "low"
}
```

**Response (200 OK):**
```json
{
  "id": "task-uuid",
  "title": "Implement dark mode",
  "status": "done",
  "priority": "low",
  "updatedAt": "2025-10-09T16:00:00.000Z"
}
```

---

#### 6. Delete Task

```http
DELETE /api/tasks/:id
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "message": "Task deleted successfully"
}
```

**Access Control:** Only `super_admin` and `org_admin` can delete tasks.



---



### Error Responses

#### Unauthorized (401)
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

#### Forbidden (403)
```json
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Insufficient permissions"
}
```

#### Validation Error (400)
```json
{
  "statusCode": 400,
  "message": ["email must be an email"],
  "error": "Bad Request"
}
```



---



## Testing the API

### Using cURL

**1. Register:**
```bash
curl -X POST http://localhost:3333/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "admin123",
    "firstName": "Admin",
    "lastName": "User",
    "organizationName": "Test Org",
    "role": "super_admin"
  }'
```

**2. Login:**
```bash
curl -X POST http://localhost:3333/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "admin123"
  }'
```

**3. Create Task (replace TOKEN):**
```bash
curl -X POST http://localhost:3333/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "title": "Test Task",
    "description": "This is a test",
    "status": "todo",
    "priority": "high"
  }'
```



---




## Tech Stack

### Backend
- **NestJS** - Progressive Node.js framework
- **TypeORM** - ORM for TypeScript
- **PostgreSQL** - Relational database
- **JWT** - Authentication tokens
- **bcrypt** - Password hashing
- **class-validator** - Request validation

### Frontend
- **Angular 19** - Frontend framework
- **RxJS** - Reactive programming
- **TypeScript** - Type safety

### DevOps
- **NX** - Monorepo management
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration



---



## Project Structure Details

### Shared Libraries

#### `libs/data`
Contains TypeScript interfaces shared between frontend and backend:
- `user.interface.ts` - User type definitions
- `task.interface.ts` - Task type definitions
- `organization.interface.ts` - Organization types

**Benefits:**
- Single source of truth for types
- Compile-time type checking across apps
- Automatic refactoring support

#### `libs/auth`
Reusable authentication logic:
- `roles.enum.ts` - Role definitions
- `permissions.decorator.ts` - Authorization decorators



---



## Development Workflow

### Running Multiple Apps

```bash
# Run backend and frontend concurrently
npx nx run-many --target=serve --projects=api,dashboard
```

### Building for Production

```bash
# Build both apps
npx nx run-many --target=build --projects=api,dashboard --configuration=production
```

### Running Tests

```bash
# Run all tests
npx nx run-many --target=test --all
```



---



## 🎯 Future Enhancements

-  Implement task comments and attachments
-  Add email notifications for task assignments
-  Real-time updates using WebSockets
-  Task templates and recurring tasks
-  Advanced filtering and search
-  Activity timeline and audit logs UI
-  Export tasks to CSV/PDF
-  Mobile app (React Native)




---




## 👨‍💻 Developer Notes

This project demonstrates:
- ✅ Clean architecture with separation of concerns
- ✅ Type-safe full-stack development
- ✅ Secure authentication and authorization
- ✅ Scalable monorepo structure
- ✅ Database design best practices
- ✅ RESTful API design
- ✅ Modern development tooling


**Built with dedication and attention to detail!** 



###  Important Note

**Backend is fully functional and tested.**

** Frontend Angular build encountered Node.js compatibility issues during development (Angular CLI v19 requires Node v22.12+, system had v22.11).**

**To test the working backend:**

1. Start PostgreSQL: `docker-compose up -d`
2. Start API: `npx nx serve api`
3. Use the cURL examples below to test all endpoints

All core functionality (Authentication, RBAC, Task Management, Multi-tenancy) is implemented and working in the backend.