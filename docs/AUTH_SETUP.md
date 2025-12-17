# Backend JWT Authentication Setup

## Overview

The backend now has full JWT authentication protecting all admin API endpoints.

## Admin Credentials

**Username:** `admin`
**Password:** `admin123`

## API Endpoints

### Public Endpoints

#### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Create User (Temporary - Remove in Production)
```http
POST /api/v1/auth/create-user
Content-Type: application/json

{
  "username": "newuser",
  "password": "password",
  "email": "user@example.com"
}
```

### Protected Endpoints

All the following endpoints require JWT authentication via the `Authorization` header:

```http
Authorization: Bearer <your-jwt-token>
```

- `GET /api/v1/photos` - List all photos
- `POST /api/v1/photos` - Create new photo
- `GET /api/v1/photos/:id` - Get photo by ID
- `PUT /api/v1/photos/:id` - Update photo
- `DELETE /api/v1/photos/:id` - Delete photo
- `POST /api/v1/photos/reorder` - Batch update display order
- `POST /api/v1/storage/upload-token` - Generate MinIO upload token

## Implementation Details

### Files Created

1. **[api/internal/model/user.go](api/internal/model/user.go)** - User model with bcrypt password hashing
2. **[api/internal/auth/jwt.go](api/internal/auth/jwt.go)** - JWT token generation and validation
3. **[api/internal/service/auth_service.go](api/internal/service/auth_service.go)** - Authentication service layer
4. **[api/internal/handler/auth.go](api/internal/handler/auth.go)** - Login HTTP handler
5. **[api/internal/handler/user.go](api/internal/handler/user.go)** - Create user HTTP handler
6. **[api/internal/middleware/auth.go](api/internal/middleware/auth.go)** - JWT authentication middleware

### Database

The `users` table has been auto-migrated with the following fields:
- `id` - Primary key
- `username` - Unique username
- `password` - Bcrypt hashed password
- `email` - User email (optional)
- `role` - User role (default: "admin")
- `created_at` - Timestamp
- `updated_at` - Timestamp

### Security Features

- Passwords are hashed using bcrypt
- JWT tokens expire after 24 hours
- JWT secret key is configurable via `JWT_SECRET` environment variable
- All admin endpoints are protected by JWT middleware
- CORS is configured to allow requests from localhost:3000

## Testing the Frontend

The frontend has already been updated to:
1. Show login page at `/admin/login`
2. Store JWT token in localStorage
3. Send Authorization header with all API requests
4. Redirect to login if not authenticated
5. Provide Sign Out functionality

Access the admin panel at: http://localhost:3000/admin/login

## Security Notes

⚠️ **Important:** The `/api/v1/auth/create-user` endpoint should be removed in production. It's only available for initial setup.

To remove it, edit [api/internal/server/server.go](api/internal/server/server.go:96) and delete line 96:
```go
auth.POST("/create-user", authHandler.CreateUser)  // Remove this line
```

## Environment Variables

Make sure your `.env` file has:
```env
JWT_SECRET=your-secret-key-change-in-production
```

Change this to a strong random string in production!