# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Fruster User Service is a microservice for managing users, roles, scopes, and authentication in the Fruster ecosystem. It uses NATS for message bus communication, MongoDB for persistence, and exposes both HTTP and service-based endpoints.

## Commands

### Testing
```bash
# Run all tests with coverage (requires 90% line coverage)
npm test

# Run a single test file
node spec/support/jasmine-runner.js spec/CreateUserHandler.spec.js
```

### Running
```bash
# Install dependencies
npm install

# Start the service
npm start
```

### Development
- Tests are located in `/spec` directory using Jasmine
- Coverage reports are generated with nyc (Istanbul)
- Tests are randomized by default (see spec/support/jasmine-runner.js)

## Architecture

### Layer Structure

The codebase follows a three-layer architecture:

1. **Handlers** (`lib/handlers/`): Handle incoming requests from the bus, perform validation, orchestrate managers
   - HTTP handlers (admin endpoints requiring `admin.*` scope)
   - Service handlers (internal service-to-service communication)
   - Use the pattern: `handle(req)` for service endpoints, `handleHttp(req)` for HTTP endpoints

2. **Managers** (`lib/managers/`): Business logic and coordination
   - `UserManager`: User data validation and error handling
   - `PasswordManager`: Password hashing, validation, and verification
   - `RoleManager`: Role and scope management
   - `ProfileManager`: Profile/user data splitting logic
   - `EmailManager`: Email verification functionality

3. **Repos** (`lib/repos/`): Data access layer
   - `UserRepo`: User CRUD operations
   - `ProfileRepo`: Profile CRUD operations (when user/profile splitting is enabled)
   - `RoleScopesDbRepo` / `RoleScopesConfigRepo`: Role/scope data (database or config-based)

### Request Flow

1. Request arrives via NATS bus (fruster-bus)
2. Handler receives request, validates schema
3. Handler calls managers for business logic
4. Managers call repos for data access
5. Response returned through bus

### Key Concepts

**User/Profile Splitting**: The service can split user data into two collections (users and profiles) based on configuration (`config.userFields` and `config.profileFields`). By default, all fields are in the user collection.

**Roles & Scopes**: Two modes:
- Config-based: Roles and scopes defined in `ROLE_SCOPES` environment variable
- Database-based: Dynamic roles/scopes managed via system endpoints (when `useDbRolesAndScopes` is enabled)

**Email Verification**: Optional or required email verification flow with token generation and verification endpoints. Configured via `REQUIRE_EMAIL_VERIFICATION` or `OPTIONAL_EMAIL_VERIFICATION`.

**Password Security**: Passwords are hashed using user's unique salt + pepper containing user ID. Validation follows configurable regex pattern.

### Bus Communication

The service uses `fruster-bus` (NATS wrapper) for communication:
- Subscribes to subjects defined in `lib/constants.js`
- Endpoints follow pattern: `http.{method}.{resource}` or `user-service.{action}`
- See `lib/docs.js` for full API documentation
- Request/response schemas defined in `schemas/` directory

### Important Files

- `fruster-user-service.js`: Main service bootstrap, handler registration
- `app.js`: Entry point
- `config.js`: Configuration with environment variable defaults
- `lib/constants.js`: Service constants, endpoints, collection names
- `lib/docs.js`: API documentation for all endpoints
- `lib/errors.js` & `lib/deprecatedErrors.js`: Error definitions

### Configuration

Key environment variables (see config.js for full list):
- `BUS`: NATS connection string
- `MONGO_URL`: MongoDB connection URL
- `ROLE_SCOPES`: Role to scope mappings (format: `role1:scope1,scope2;role2:scope3`)
- `EMAIL_VALIDATION_REGEX`, `PASSWORD_VALIDATION_REGEX`: Validation patterns
- `REQUIRE_EMAIL_VERIFICATION`, `OPTIONAL_EMAIL_VERIFICATION`: Email verification modes
- `REQUIRE_PASSWORD`: Whether password is required for user creation
- `LOWER_CASE_NAME`: Lowercase names during create/update
- `UNIQUE_INDEXES`: Additional unique indexes (use `profile.` prefix for profile indexes)

### Testing Patterns

- Each handler/manager has a corresponding `.spec.js` file
- Use `fruster-test-utils` for mocking and test utilities
- Mocks are in `spec/support/mocks.js`
- Configuration-specific tests use separate files (e.g., `CreateUserHandler.config.spec.js`)
- Tests verify both success and error cases, schema validation, and business logic

### Common Development Workflows

**Adding a new handler:**
1. Create handler in `lib/handlers/`
2. Add endpoint constant in `lib/constants.js`
3. Add documentation in `lib/docs.js`
4. Register handler in `fruster-user-service.js`
5. Add schema in `schemas/` if needed
6. Create corresponding test in `spec/`

**Modifying user fields:**
- Consider whether field should be in user or profile collection
- Update `ProfileManager.splitUserFields()` if adding profile fields
- Add appropriate validation in `UserManager` or handlers

**Adding new roles/scopes:**
- If using config: Update `ROLE_SCOPES` environment variable
- If using DB: Use system role endpoints (requires `useDbRolesAndScopes=true`)
