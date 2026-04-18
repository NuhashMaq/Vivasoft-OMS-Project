# Office Management Backend

A RESTful API backend for Office Management system built with Go, Gin framework, and PostgreSQL.

## Prerequisites

- **Go 1.21+**
- **PostgreSQL 12+**
- **Git**

## Project Structure

```
Office-Management-Backend/
├── cmd/
│   └── server/              # Application entry point
│       └── main.go
├── internal/
│   ├── config/              # Configuration management & database setup
│   │   ├── config.go
│   │   └── database.go
│   ├── dto/                 # Data Transfer Objects
│   │   └── user_dto.go
│   ├── handler/             # HTTP request handlers
│   │   └── user_handler.go
│   ├── middleware/          # Middleware functions
│   │   └── auth_middleware.go
│   ├── model/               # Data models
│   │   └── user.go
│   ├── repository/          # Data access layer
│   │   └── user_repository.go
│   └── service/             # Business logic layer
│       └── user_service.go
├── .env.example             # Environment variables template
├── go.mod                   # Go module definition
├── go.sum                   # Go module checksums
└── README.md                # This file
```

## Technology Stack

- **Framework**: Gin Web Framework
- **Database**: PostgreSQL with GORM ORM
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcrypt
- **Environment**: godotenv

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/FahadHossainBabor/Office-Management.git
cd Office-Management-Backend
```

### 2. Install Dependencies

```bash
go mod download
go mod tidy
```

### 3. Setup Environment Variables

Copy `.env.example` to `.env` and update with your configuration:

```bash
cp .env.example .env
```

Configure your PostgreSQL connection in `.env`:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password_here
DB_NAME=office_management
DB_SSLMODE=disable

# Server Configuration
SERVER_HOST=localhost
SERVER_PORT=8080

# JWT Configuration
JWT_SECRET_KEY=your-super-secret-key-change-this-in-production
JWT_EXPIRY_HOURS=24
```

### 4. Create PostgreSQL Database

```sql
CREATE DATABASE office_management;
```

## Running the Application

### Development Mode

```bash
go run cmd/server/main.go
```

The server will start on `http://localhost:8080`

### Build for Production

```bash
go build -o office-management-api cmd/server/main.go
./office-management-api
```

## API Endpoints

### Health Check
- **GET** `/health` - Check API health status

### User Management (Public)
- **POST** `/api/v1/users` - Create a new user
- **GET** `/api/v1/users` - List all users (with pagination)
- **GET** `/api/v1/users/:id` - Get user by ID

### User Management (Protected - Requires JWT)
- **PUT** `/api/v1/users/:id` - Update user information
- **DELETE** `/api/v1/users/:id` - Delete user

## API Examples

### Create User

```bash
curl -X POST http://localhost:8080/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "password": "securepassword123"
  }'
```

### Get All Users

```bash
curl http://localhost:8080/api/v1/users?page=1&page_size=10
```

### Get User by ID

```bash
curl http://localhost:8080/api/v1/users/1
```

### Update User (Requires Auth)

```bash
curl -X PUT http://localhost:8080/api/v1/users/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Jane",
    "last_name": "Doe",
    "email": "jane@example.com"
  }'
```

### Delete User (Requires Auth)

```bash
curl -X DELETE http://localhost:8080/api/v1/users/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Features

- ✅ User Management (Create, Read, Update, Delete)
- ✅ Password Hashing with bcrypt
- ✅ JWT-based Authentication
- ✅ PostgreSQL Database Integration
- ✅ GORM ORM for database operations
- ✅ Pagination support
- ✅ Error handling and validation
- ✅ Environment-based configuration
- ✅ Clean Architecture (Handler → Service → Repository → Model)

## Error Handling

The API returns standardized JSON error responses:

```json
{
  "error": "Error message describing what went wrong"
}
```

Common HTTP Status Codes:
- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error

## Development

### Project Architecture

The project follows a clean architecture pattern:

1. **Handlers** - Handle HTTP requests/responses
2. **Services** - Contain business logic
3. **Repositories** - Handle database operations
4. **Models** - Define data structures

### Adding New Features

To add a new feature (e.g., Projects):

1. Create model: `internal/model/project.go`
2. Create repository: `internal/repository/project_repository.go`
3. Create service: `internal/service/project_service.go`
4. Create handler: `internal/handler/project_handler.go`
5. Add routes in `cmd/server/main.go`

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@example.com or open an issue in the repository.
