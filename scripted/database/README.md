# SQLite Database Integration

This project uses SQLite for local data persistence with better-sqlite3 for authentication, project management, and collaboration features.

## Database Structure

The database is stored in `database/app.db` and includes the following tables:

### Tables

#### 1. **users**
Stores user account information.
```sql
- id: INTEGER PRIMARY KEY (auto-increment)
- username: TEXT UNIQUE NOT NULL
- password: TEXT NOT NULL (SHA-256 hashed)
- email: TEXT (optional)
- created_at: DATETIME (auto-generated)
```

#### 2. **projects**
Stores project information.
```sql
- id: INTEGER PRIMARY KEY (auto-increment)
- name: TEXT NOT NULL
- description: TEXT (optional)
- owner_id: INTEGER (foreign key to users)
- created_at: DATETIME (auto-generated)
- updated_at: DATETIME (auto-updated)
```

#### 3. **project_collaborators**
Manages project collaboration and permissions.
```sql
- id: INTEGER PRIMARY KEY (auto-increment)
- project_id: INTEGER (foreign key to projects)
- user_id: INTEGER (foreign key to users)
- role: TEXT (admin/editor/viewer)
- added_at: DATETIME (auto-generated)
```

#### 4. **project_shares**
Handles public sharing links for projects.
```sql
- id: INTEGER PRIMARY KEY (auto-increment)
- project_id: INTEGER (foreign key to projects)
- share_token: TEXT UNIQUE
- permissions: TEXT (view/edit)
- created_at: DATETIME (auto-generated)
- expires_at: DATETIME (optional)
```

#### 5. **sessions**
Manages user authentication sessions.
```sql
- id: INTEGER PRIMARY KEY (auto-increment)
- user_id: INTEGER (foreign key to users)
- token: TEXT UNIQUE
- created_at: DATETIME (auto-generated)
- expires_at: DATETIME (7 days from creation)
```

## API Endpoints

### Authentication

#### POST `/api/auth/signup`
Create a new user account.
```json
Request:
{
  "username": "johndoe",
  "password": "password123",
  "email": "john@example.com" // optional
}

Response (201):
{
  "success": true,
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com"
  }
}
```

#### POST `/api/auth/login`
Authenticate user and create session.
```json
Request:
{
  "username": "johndoe",
  "password": "password123"
}

Response (200):
{
  "success": true,
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com"
  }
}
// Sets session cookie: session_token
```

#### POST `/api/auth/logout`
End user session.
```json
Response (200):
{
  "success": true
}
// Clears session cookie
```

#### GET `/api/auth/session`
Validate current session.
```json
Response (200):
{
  "authenticated": true,
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com"
  }
}
```

### Projects

#### GET `/api/projects`
Get all projects for authenticated user (owned or collaborated).
```json
Response (200):
{
  "projects": [
    {
      "id": 1,
      "name": "My Project",
      "description": "Project description",
      "owner_id": 1,
      "owner_username": "johndoe",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### POST `/api/projects`
Create a new project.
```json
Request:
{
  "name": "New Project",
  "description": "Optional description"
}

Response (201):
{
  "success": true,
  "project": {
    "id": 2,
    "name": "New Project",
    "description": "Optional description",
    "owner_id": 1,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

#### GET `/api/projects/[id]`
Get project details by ID.
```json
Response (200):
{
  "project": {
    "id": 1,
    "name": "My Project",
    "description": "Project description",
    "owner_id": 1,
    "owner_username": "johndoe",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

#### PUT `/api/projects/[id]`
Update project (owner only).
```json
Request:
{
  "name": "Updated Name",
  "description": "Updated description"
}

Response (200):
{
  "success": true,
  "project": { /* updated project */ }
}
```

#### DELETE `/api/projects/[id]`
Delete project (owner only).
```json
Response (200):
{
  "success": true
}
```

### Collaboration

#### GET `/api/projects/[id]/collaborators`
Get all collaborators for a project.
```json
Response (200):
{
  "collaborators": [
    {
      "id": 1,
      "project_id": 1,
      "user_id": 2,
      "username": "collaborator1",
      "role": "editor",
      "added_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### POST `/api/projects/[id]/collaborators`
Add collaborator to project (owner only).
```json
Request:
{
  "username": "collaborator1",
  "role": "editor" // admin/editor/viewer (default: viewer)
}

Response (201):
{
  "success": true
}
```

#### PATCH `/api/projects/[id]/collaborators`
Update collaborator role (owner only).
```json
Request:
{
  "userId": 2,
  "role": "admin"
}

Response (200):
{
  "success": true
}
```

#### DELETE `/api/projects/[id]/collaborators`
Remove collaborator (owner only).
```json
Request:
{
  "userId": 2
}

Response (200):
{
  "success": true
}
```

### Sharing

#### GET `/api/projects/[id]/shares`
Get all share links for a project.
```json
Response (200):
{
  "shareLinks": [
    {
      "id": 1,
      "project_id": 1,
      "share_token": "abc123def456",
      "permissions": "view",
      "created_at": "2024-01-01T00:00:00.000Z",
      "expires_at": "2024-01-08T00:00:00.000Z"
    }
  ]
}
```

#### POST `/api/projects/[id]/shares`
Create share link (owner only).
```json
Request:
{
  "permissions": "view", // view/edit (default: view)
  "expiresInDays": 7 // optional
}

Response (201):
{
  "success": true,
  "shareLink": {
    "id": 2,
    "project_id": 1,
    "share_token": "xyz789ghi012",
    "permissions": "view",
    "created_at": "2024-01-01T00:00:00.000Z",
    "expires_at": "2024-01-08T00:00:00.000Z"
  }
}
```

#### DELETE `/api/projects/[id]/shares`
Delete share link (owner only).
```json
Request:
{
  "shareId": 2
}

Response (200):
{
  "success": true
}
```

## Database Operations

All database operations are located in the `database/` folder:

- **`db.ts`** - Database connection and initialization
- **`users.ts`** - User management functions
- **`projects.ts`** - Project CRUD operations
- **`collaboration.ts`** - Collaboration and sharing functions
- **`index.ts`** - Exports all database functions

### Example Usage

```typescript
import { createUser, authenticateUser, createSession } from '@/database';

// Create user
const user = createUser('username', 'password', 'email@example.com');

// Authenticate
const authUser = authenticateUser('username', 'password');

// Create session
if (authUser) {
  const token = createSession(authUser.id);
}
```

## Security Notes

⚠️ **Important**: This is a development implementation. For production use:

1. Replace SHA-256 password hashing with bcrypt or argon2
2. Add rate limiting to API endpoints
3. Implement CSRF protection
4. Add input validation and sanitization
5. Use environment variables for sensitive configuration
6. Implement proper error handling and logging
7. Add database migrations for schema changes
8. Consider using an ORM like Prisma for better type safety

## Database Location

The SQLite database file is stored at:
```
scripted/database/app.db
```

This file is automatically created on first run and persists across sessions.

## Migration from localStorage

The application has been updated to use the SQLite database instead of localStorage for:
- ✅ User authentication
- ✅ Session management
- ✅ Project storage
- ✅ Collaboration features
- ✅ Sharing functionality

Users created in localStorage will need to re-register in the new database system.
