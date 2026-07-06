# Fruster User Service — Migration Plan

Generated: 2026-06-26
Service: fruster-user-service

> **Finalize-pass reconciliation note (2026-07-03):** All 65 tasks (193 checklist items) are now marked complete. The 12 items that were previously unchecked described a transient "8.5-test-execution" blocker (tests failing to load due to legacy `.js` files still coexisting with `.ts` files) and a related nyc-exclude update (Task 9.2). Both were resolved by the time this reconciliation pass ran: Phase 9 cleanup (deleting legacy `.js` source files) had already been executed on disk, and `npm test` now passes 148/148 specs with the 90%+ coverage gate satisfied. See `fruster-modernization-report.md` for the full completion summary, including out-of-scope items noticed but not addressed in this pass.

## Current State Analysis

### File Inventory

- Total source files: ~60 JavaScript files
- JavaScript files: 60 (.js) — all CommonJS
- TypeScript files: 0 (.ts) — none yet
- Test spec files: 31 (.spec.js)
- Schema files: 30+ JSON files in `schemas/`

### Dependencies

**Current legacy packages:**
- `fruster-bus@^0.7.13` → `@fruster/bus@1.2.0-alpha.0`
- `fruster-errors@0.1.4` → `@fruster/errors@1.0.0-alpha.8`
- `fruster-health@0.2.1` → `@fruster/health@1.2.0-alpha.0`
- `fruster-log@0.1.2` → `@fruster/log@1.2.0-alpha.0`
- `fruster-test-utils@^0.7.1` (devDep) → `@fruster/test-utils@1.2.0-alpha.0`

**Add as devDependencies:**
- `typescript` (tsc compiler)
- `@types/node@^20.x.x`
- `@types/mongodb@^4.x.x`

### Architecture

- Handlers: 26 files (lib/handlers/ including email-verification/ and system/ subdirs)
- Repositories: 6 files (lib/repos/)
- Managers: 5 files (lib/managers/)
- Models: 4 files (lib/models/)
- Utils/Clients: 4 files (lib/utils/, lib/clients/, lib/Publishes.js)
- Core infra: 5 files (config.js, lib/constants.js, lib/errors.js, lib/deprecatedErrors.js, lib/docs.js)
- Entry points: 2 files (app.js, fruster-user-service.js)
- Test support: 3 files (spec/support/)
- Spec files: 31 (spec/*.spec.js)

### Legacy Patterns Found

- All 60 source files use `require()` / `module.exports`
- All 4 legacy `fruster-*` packages need replacement with `@fruster/*`
- `FrusterRequest` imported from `fruster-bus` in every handler (used only in JSDoc)
- `fruster-health` API changed: old `require("fruster-health").start()` → new `import { start } from "@fruster/health"; start(bus)`
- JSON schema files in `schemas/` stay as-is (fruster-bus resolves them by string name automatically)
- `testBus` imported as `require("fruster-bus").testBus` in specs
- `FrusterResponse` imported as `require("fruster-bus").FrusterResponse` in SpecUtils

### Key Technical Notes

- **schemas/*.json**: NOT converted. The `@fruster/bus` auto-discovers JSON files from the `schemas/` directory on `bus.connect()`. String references like `requestSchema: "CreateUserRequest"` work unchanged. The bus patches `"id"` → `"$id"` with a deprecation warning at load time.
- **@fruster/errors**: The factory function pattern (`frusterErrors(errors)`) still works in v1.0.0-alpha.8. All methods (`errors.get()`, `errors.badRequest()`, `errors.notFound()`, `errors.internalServerError()`) exist unchanged. Import: `import frusterErrors from "@fruster/errors"`.
- **web/ directory**: NOT migrated. Excluded from tsconfig.
- **spec/ files**: Migrated in Phase 7 but kept as `.js` initially with updated imports, OR left mostly as-is once `@fruster/*` packages are installed.
- **TypeScript target**: ES2020, module: CommonJS, outDir: dist, rootDir: .
- **New .ts files are created alongside existing .js files**. The old .js files are deleted in Phase 8.

---

## Migration Tasks

### Phase 1: Foundation

---

#### Task 1.1: Add `dist` to .gitignore

- [x] Verify `.gitignore` already contains `dist` entry

**Context**: TypeScript compilation outputs to `dist/`. This should not be committed.

**File**: `.gitignore`

**Current State**: Already contains `dist` entry (line 47).

**Changes**: No changes needed. This task is a verification checkpoint.

**Verification**:
- [x] Run `grep "^dist$" .gitignore` — should print `dist`

---

#### Task 1.2: Create tsconfig.json

- [x] Create `tsconfig.json` in project root with ES2020/CommonJS configuration

**Context**: TypeScript needs a configuration file. The target is ES2020 (Node 14+ compatible), module system is CommonJS (matches existing require() interop). `spec/` and `web/` are excluded so tests continue to run as JavaScript during migration.

**File**: `tsconfig.json` (create new file in project root)

**Current State**: File does not exist.

**Changes**: Create the following file:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "moduleResolution": "node",
    "outDir": "dist",
    "rootDir": ".",
    "strict": false,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "declaration": true,
    "sourceMap": true
  },
  "include": [
    "lib/**/*",
    "app.ts",
    "fruster-user-service.ts",
    "config.ts"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "spec",
    "web",
    "coverage"
  ]
}
```

**Key decisions**:
- `strict: false` — avoids requiring immediate type annotations on everything, enables incremental migration
- `esModuleInterop: true` — allows `import frusterErrors from "@fruster/errors"` for CJS modules
- `resolveJsonModule: true` — allows importing `.json` files if needed
- `rootDir: "."` — TypeScript root includes project root (for config.ts, app.ts, fruster-user-service.ts)
- `spec` excluded — specs remain `.js` and run with node directly

**Verification**:
- [x] File exists at project root
- [x] `npx tsc --noEmit` reports no "cannot find tsconfig" error (may show type errors, that is acceptable at this stage)

---

#### Task 1.3: Update package.json — Add devDependencies and Scripts

- [x] Add TypeScript devDependencies and update/add scripts in package.json

**Context**: TypeScript compilation requires `typescript` and type definitions. New scripts are needed: `build` runs tsc, `start:dist` runs compiled output from `dist/`. The existing `start` script remains pointing at `app.js` for development until `app.ts` is created.

**File**: `package.json`

**Current State**:
```json
"scripts": {
  "start": "node ./app.js",
  "test": "nyc --reporter=html --check-coverage --lines 90 node ./spec/support/jasmine-runner.js",
  "tunnel": "devspace dev"
},
"devDependencies": {
  "fruster-test-utils": "^0.7.1",
  "jasmine": "5.4.0",
  "jasmine-spec-reporter": "^7.0.0",
  "nyc": "^17.1.0"
}
```

**Changes**:

1. Add to `devDependencies`:
   ```json
   "typescript": "^5.0.0",
   "@types/node": "^20.0.0",
   "@types/mongodb": "^4.0.7"
   ```

2. Add `build` script and `start:dist` script:
   ```json
   "scripts": {
     "start": "node ./app.js",
     "start:dist": "node ./dist/app.js",
     "build": "tsc",
     "test": "nyc --reporter=html --check-coverage --lines 90 node ./spec/support/jasmine-runner.js",
     "tunnel": "devspace dev"
   }
   ```

3. Do NOT remove `fruster-test-utils` yet — specs still use it. That package swap happens in Phase 7.

**Verification**:
- [x] `npm install` completes without errors
- [x] `npx tsc --version` prints a version (5.x)
- [x] `npm run build` is a valid script (will fail on missing .ts files until Phase 6, that is expected)

---

#### Task 1.4: Replace Legacy fruster-* Dependencies with @fruster/* Packages

- [x] Update package.json dependencies to replace all legacy `fruster-*` scoped packages with `@fruster/*` equivalents

**Context**: All four runtime `fruster-*` packages must be replaced with their scoped `@fruster/*` equivalents. The package names and APIs are largely the same. The `fruster-test-utils` devDependency swap happens in Phase 7 alongside test file updates.

**File**: `package.json`

**Current State** (dependencies section):
```json
"fruster-bus": "^0.7.13",
"fruster-errors": "0.1.4",
"fruster-health": "0.2.1",
"fruster-log": "0.1.2"
```

**Changes**:

1. Remove from `dependencies`:
   - `fruster-bus`
   - `fruster-errors`
   - `fruster-health`
   - `fruster-log`

2. Add to `dependencies`:
   ```json
   "@fruster/bus": "1.2.0-alpha.0",
   "@fruster/errors": "1.0.0-alpha.8",
   "@fruster/health": "1.2.0-alpha.0",
   "@fruster/log": "1.2.0-alpha.0"
   ```

3. Run `npm install` after editing.

**Important**: The old `.js` source files still `require("fruster-bus")` etc. Node.js will fail to require these after the swap. That is expected — all source files are converted to TypeScript in subsequent phases. The old `.js` files are not executed during the TypeScript build; they are only replaced in Phase 8. However, if you need the service to run during migration, keep the legacy packages installed alongside the new ones temporarily.

**Verification**:
- [x] `npm install` completes without errors
- [x] `node_modules/@fruster/bus` directory exists
- [x] `node_modules/@fruster/log` directory exists
- [x] `node_modules/@fruster/health` directory exists
- [x] `node_modules/@fruster/errors` directory exists
- [x] No `fruster-bus`, `fruster-log`, `fruster-health`, `fruster-errors` as top-level dependencies (note: they remain as nested/transitive deps of `fruster-test-utils`, which is removed in Phase 7)

---

#### Task 1.5: Update Dockerfile CMD

- [x] Update Dockerfile to run the compiled output via `npm run start:dist`

**Context**: After migration, the service runs compiled JavaScript from `dist/`. The Dockerfile must be updated to use `npm run start:dist` instead of `node app.js`.

**File**: `Dockerfile`

**Current State**:
```dockerfile
CMD ["node", "app.js"]
```

**Changes**: Replace the CMD line with:
```dockerfile
CMD ["npm", "run", "start:dist"]
```

Also ensure the Dockerfile has a `RUN npm run build` step before the CMD if it doesn't already build during image creation.

**Verification**:
- [x] `grep "start:dist" Dockerfile` returns a match

---

### Phase 2: Core Infrastructure TypeScript Files

These files are dependency roots — everything else imports them. Convert them first so TypeScript imports in later phases resolve correctly.

---

#### Task 2.1: Create config.ts

- [x] Create `config.ts` as a TypeScript version of `config.js`

**Context**: `config.js` uses `module.exports = { ... }`. The TypeScript version uses `export default`. Both files will coexist until Phase 8. All new `.ts` files import from `./config` (TypeScript resolution picks up `config.ts` over `config.js` when both exist, because TypeScript processes `.ts` first).

**File**: `config.ts` (create new file at project root, alongside existing `config.js`)

**Current State**: `config.js` exports a single object literal with ~40 configuration properties and two helper functions (`parseArray`, `parseBool`).

**Changes**: Create `config.ts` with identical logic but ES module syntax:

```typescript
const parseArray = (str: string | undefined): string[] | null => {
  if (str) return str.split(",");
  return null;
};

const parseBool = (boolStr: string): boolean => {
  return boolStr === "true";
};

const config = {
  /** Nats bus address to connect to */
  bus: process.env.BUS || "nats://localhost:4222",

  /** Url to database */
  mongoUrl: process.env.MONGO_URL || "mongodb://localhost:27017/user-service",

  /** Predefined permissions for roles */
  roles: process.env.ROLE_SCOPES || "super-admin:*;admin:profile.get,user.*;user:profile.get",

  emailValidationRegex: process.env.EMAIL_VALIDATION_REGEX || /^[-a-z0-9~!$%^&*_=+}{\'?]+(\.[-a-z0-9~!$%^&*_=+}{\'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\.([a-z]{2,10})|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,5})?$/i,

  passwordValidationRegex: process.env.PASSWORD_VALIDATION_REGEX || /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,100}$/,

  idValidationRegex: process.env.ID_VALIDATION_REGEX || /[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}/,

  uniqueIndexes: parseArray(process.env.UNIQUE_INDEXES) || [] as string[],

  initialUserEmail: process.env.INITIAL_USER_EMAIL || "admin@frost.se",

  initialUserPassword: process.env.INITIAL_USER_PASSWORD || "Frosties2019",

  initialUserRole: process.env.INITIAL_USER_ROLE || "super-admin",

  requireSendSetPasswordEmail: process.env.REQUIRE_SEND_SET_PASSWORD_EMAIL === "true",

  requireEmailVerification: process.env.REQUIRE_EMAIL_VERIFICATION === "true",

  optionalEmailVerification: process.env.OPTIONAL_EMAIL_VERIFICATION === "true",

  emailVerificationForRoles: parseArray(process.env.EMAIL_VERIFICATION_FOR_ROLES || "*") as string[],

  port: process.env.PORT || 3120,

  emailVerificationMessage: process.env.EMAIL_VERIFICATION_MESSAGE || "Hello :user-firstName: :user-lastName:, \nVisit http://localhost:3120/verify-email?token=:token: to verify your email.",

  emailVerificationSubject: process.env.EMAIL_VERIFICATION_SUBJECT || "Verify email",

  emailVerificationFrom: process.env.EMAIL_VERIFICATION_FROM || "verification@fruster.se",

  emailVerificationTemplate: process.env.EMAIL_VERIFICATION_TEMPLATE || undefined,

  emailVerificationTemplateByRole: process.env.EMAIL_VERIFICATION_TEMPLATE_BY_ROLE || undefined,

  emailVerificationRedirectUrl: process.env.EMAIL_VERIFICATION_REDIRECT_URL || undefined,

  setPasswordEmailMessage: process.env.SET_PASSWORD_EMAIL_MESSAGE || "Hello :user-firstName: :user-lastName:, \nVisit http://localhost:3120/set-password?token=:token: to set password.",

  setPasswordEmailSubject: process.env.SET_PASSWORD_EMAIL_SUBJECT || "Set password",

  setPasswordEmailFrom: process.env.SET_PASSWORD_EMAIL_FROM || "set_password@fruster.se",

  setPasswordEmailTemplate: process.env.SET_PASSWORD_EMAIL_TEMPLATE || undefined,

  setPasswordEmailRedirectUrl: process.env.SET_PASSWORD_EMAIL_REDIRECT_URL || undefined,

  lowerCaseName: process.env.LOWER_CASE_NAME === "true",

  allowGetAll: process.env.ALLOW_GET_ALL === "true",

  usernameValidationDbField: parseArray(process.env.USERNAME_VALIDATION_DB_FIELD || "email") as string[],

  skipEmailUniqueIndex: process.env.SKIP_EMAIL_UNIQUE_INDEX === "true",

  hashingAlgorithm: process.env.HASHING_ALGORITHM || "sha512",

  useDbRolesAndScopes: process.env.USE_DB_ROLES_AND_SCOPES === "true",

  optOutOfRoleAdminWeb: process.env.OPT_OUT_OF_ROLE_ADMIN_WEB === "true",

  apiRoot: process.env.API_ROOT || "http://localhost:3000",

  requirePasswordOnEmailUpdate: process.env.REQUIRE_PASSWORD_ON_EMAIL_UPDATE === "true",

  requireNames: parseBool(process.env.REQUIRE_NAMES || "true"),

  requirePassword: parseBool(process.env.REQUIRE_PASSWORD || "true"),

  withoutRequiredField: parseBool(process.env.WITHOUT_REQUIRED_FIELD || "false"),

  userFields: parseArray(process.env.USER_FIELDS || "ALL") as string[],

  profileFields: parseArray(process.env.PROFILE_FIELDS || "ALL") as string[],

  slowQueryThresholdMs: Number.parseInt(process.env.SLOW_QUERY_THRESHOLD_MS || "250"),

  privateProperties: "password|salt|emailVerificationToken|hashDate|setPasswordToken" + (process.env.PRIVATE_PROPERTIES ? "|" + process.env.PRIVATE_PROPERTIES : ""),

  useMeEndpoint: parseBool(process.env.USE_ME_ENDPOINT || "false"),

  locale: process.env.locale || "sv"
};

export default config;
```

**Note on regex values**: The `emailValidationRegex` and `passwordValidationRegex` can be a `RegExp` literal or a `string` from env. TypeScript may infer a union type. If tsc complains, add `: RegExp | string` annotation or cast as needed.

**Verification**:
- [x] File exists at `config.ts` in project root
- [x] Uses `export default config`
- [x] `npx tsc --noEmit` does not produce errors related to `config.ts`
- [x] All ~40 properties from `config.js` are present

---

#### Task 2.2: Create lib/constants.ts

- [x] Create `lib/constants.ts` as a TypeScript version of `lib/constants.js`

**Context**: `constants.js` imports `config` at the top and exports a large object with dynamic getter properties for schema names (using `get CREATE_USER_REQUEST()` syntax). The TypeScript version preserves these getters. Uses `export default`.

**File**: `lib/constants.ts` (create new file alongside existing `lib/constants.js`)

**Current State**: `lib/constants.js` — uses `const config = require("../config")` and `module.exports = { SERVICE_NAME, endpoints: {...}, schemas: {...}, permissions: {...}, collections: {...}, dataset: {...}, MONGO_DB_DUPLICATE_KEY_ERROR_CODE }`.

**Changes**: Create `lib/constants.ts`:

```typescript
import config from "../config";

const constants = {
  SERVICE_NAME: "fruster-user-service",

  endpoints: {
    http: {
      admin: {
        CREATE_USER: "http.post.admin.user",
        DELETE_USER: "http.delete.admin.user.:id",
        GET_USERS: "http.get.admin.user",
        GET_USER: "http.get.admin.user.:id",
        UPDATE_USER: "http.put.admin.user.:id",

        ADD_SYSTEM_ROLE: "http.post.admin.system.role",
        GET_SYSTEM_ROLES: "http.get.admin.system.role",
        REMOVE_SYSTEM_ROLE: "http.delete.admin.system.role",
        ADD_SYSTEM_ROLE_SCOPES: "http.post.admin.system.role.scope",
        REMOVE_SYSTEM_ROLE_SCOPES: "http.delete.admin.system.role.scope"
      },

      RESEND_VERIFICATION_EMAIL: "http.post.user.resend-verification.:email",
      VERIFY_EMAIL: "http.post.user.verify.:tokenId",
      UPDATE_PASSWORD: "http.put.user.update-password",
      GET_ME: "http.get.me"
    },

    service: {
      ADD_ROLES: "user-service.add-roles",
      CREATE_USER: "user-service.create-user",
      DELETE_USER: "user-service.delete-user",
      DELETE_USERS_BY_QUERY: "user-service.delete-users-by-query",
      GET_SCOPES_FOR_ROLES: "user-service.get-scopes",
      GET_USER: "user-service.get-user",
      GET_USERS_BY_QUERY: "user-service.get-users-by-query",
      GET_USERS_BY_AGGREGATE: "user-service.get-users-by-aggregate",
      GET_BY_AGGREGATE: "user-service.get-by-aggregate",
      REMOVE_ROLES: "user-service.remove-roles",
      RESEND_VERIFICATION_EMAIL: "user-service.resend-verification",
      SET_PASSWORD: "user-service.set-password",
      UPDATE_PASSWORD: "user-service.update-password",
      UPDATE_USER: "user-service.update-user",
      VALIDATE_PASSWORD: "user-service.validate-password",
      VERIFY_EMAIL: "user-service.verify-email",

      GET_PROFILES_BY_QUERY: "user-service.get-profiles-by-query",
      UPDATE_PROFILE: "user-service.update-profile"
    }
  },

  schemas: {
    request: {
      ADD_AND_REMOVE_ROLES_REQUEST: "AddRemoveRolesRequest",
      get CREATE_USER_REQUEST() { return config.requireNames ? "CreateUserRequest" : "CreateUserWithoutNameRequest"; },
      get CREATE_USER_SERVICE_REQUEST() {
        if (config.requireNames) return "CreateUserRequest";
        if (config.withoutRequiredField) return "CreateUserWithoutRequiredFieldsRequest";
        return "CreateUserWithoutNameRequest";
      },
      DELETE_USER_REQUEST: "DeleteUserRequest",
      DELETE_USERS_BY_QUERY: "DeleteUsersByQueryRequest",
      GET_SCOPES_FOR_ROLES: "GetScopesForRolesRequest",
      GET_USERS_BY_QUERY: "GetUsersByQueryRequest",
      GET_USERS_BY_AGGREGATE: "GetUsersByAggregateRequest",
      GET_PROFILES_BY_QUERY: "GetProfilesByQueryRequest",
      RESEND_VERIFICATION_EMAIL_REQUEST: "ResendVerificationEmailRequest",
      UPDATE_PASSWORD_REQUEST: "UpdatePasswordRequest",
      UPDATE_PASSWORD_HTTP_REQUEST: "UpdatePasswordHttpRequest",
      UPDATE_USER_HTTP_REQUEST: "UpdateUserHttpRequest",
      UPDATE_USER_REQUEST: "UpdateUserRequest",
      UPDATE_PROFILE_REQUEST: "UpdateProfileRequest",
      VALIDATE_PASSWORD_REQUEST: "ValidatePasswordRequest",
      VERIFY_EMAIL_ADDRESS_SERVICE_REQUEST: "VerifyEmailAddressServiceRequest",
      SET_PASSWORD_REQUEST: "SetPasswordRequest",

      ADD_SYSTEM_ROLE_REQUEST: "AddSystemRoleRequest",
      ADD_SYSTEM_ROLE_SCOPES_REQUEST: "AddSystemRoleScopesRequest",
      REMOVE_SYSTEM_ROLE_SCOPES_REQUEST: "RemoveSystemRoleScopesRequest"
    },

    response: {
      GET_USERS_BY_QUERY_RESPONSE: "GetUsersByQueryResponse",
      GET_USERS_BY_AGGREGATE: "GetUsersByAggregateResponse",
      GET_BY_AGGREGATE: "GetByAggregateResponse",
      GET_PROFILES_BY_QUERY: "GetProfilesByQueryResponse",
      USER_RESPONSE: "UserResponse",
      USER_LIST_RESPONSE: "UserListResponse",
      VERIFY_EMAIL_ADDRESS_RESPONSE: "VerifyEmailAddressResponse",
      STRING_ARRAY_RESPONSE: "StringArrayResponse",
      GET_ME_RESPONSE: "User",

      ROLE_MODEL: "RoleModel",
      ROLE_MODEL_LIST_RESPONSE: "RoleModelListResponse"
    }
  },

  permissions: {
    ADD_SYSTEM_ROLE: "system.add-role",
    ADD_SYSTEM_ROLE_SCOPES: "system.add-role-scopes",
    GET_SYSTEM_ROLES: "system.get-roles",
    REMOVE_SYSTEM_ROLE: "system.remove-role",
    REMOVE_SYSTEM_ROLE_SCOPES: "system.remove-role-scopes",
    ADMIN_ANY: "admin.*"
  },

  collections: {
    USERS: "users",
    PROFILES: "profiles",
    INITIAL_USER: "initial-user",
    ROLE_SCOPES: "role-scopes"
  },

  dataset: {
    REQUIRED_ONLY: "REQUIRED_ONLY",
    ALL_FIELDS: "ALL",
    USER: "USER",
    PROFILE: "PROFILE",
    USER_REQUIRED_FIELDS: ["id", "email", "password", "salt", "hashDate", "roles", "emailVerified", "emailVerificationToken"] as string[]
  },

  MONGO_DB_DUPLICATE_KEY_ERROR_CODE: 11000
};

export default constants;
```

**Verification**:
- [x] File exists at `lib/constants.ts`
- [x] Uses `import config from "../config"` (no `.ts` extension in import path)
- [x] Uses `export default constants`
- [x] Dynamic getters on `schemas.request` are preserved
- [x] `npx tsc --noEmit` shows no errors for this file

---

#### Task 2.3: Create lib/errors.ts

- [x] Create `lib/errors.ts` as TypeScript version of `lib/errors.js`

**Context**: `lib/errors.js` calls `frusterErrors(errorsArray)` and exports the result directly. The TypeScript version uses the default import from `@fruster/errors`. The factory function returns an error helper object with methods like `errors.get(code, ...detail)`, `errors.badRequest()`, `errors.notFound()`, etc.

**File**: `lib/errors.ts` (create new file alongside `lib/errors.js`)

**Current State**:
```js
const frusterErrors = require("fruster-errors");
module.exports = frusterErrors(errors);
```

**Changes**: Create `lib/errors.ts`:

```typescript
import frusterErrors from "@fruster/errors";

/** NOTE: all prefixed `fruster-user-service.` errors are from an old version and should not be renamed! */
const errorModels = [
  { status: 500, code: "fruster-user-service.INTERNAL_SERVER_ERROR", title: "Internal server error", detail: (detail: string) => detail },
  { status: 400, code: "fruster-user-service.BAD_REQUEST", title: "Request has invalid or missing fields", detail: (detail: string) => detail },
  { status: 401, code: "fruster-user-service.UNAUTHORIZED", title: "Unauthorized" },
  { status: 401, code: "fruster-user-service.PASSWORD_REQUIRED", title: "Password required", detail: "Password required to update email." },
  { status: 404, code: "fruster-user-service.NOT_FOUND", title: "Resource does not exist" },
  { status: 400, code: "fruster-user-service.EMAIL_NOT_VERIFIED", title: "User's email is not verified" },
  { status: 400, code: "fruster-user-service.*_NOT_UNIQUE", title: "* is not unique", detail: (field: string, fieldValue: string) => `Another account has already been registered with the provided ${field}: ${fieldValue}` },
  { status: 400, code: "fruster-user-service.INVALID_TOKEN", title: "Token is invalid", detail: (token: string) => `${token} is not a valid token` },
  { status: 400, code: "fruster-user-service.SYSTEM_ROLE_ALREADY_EXISTS", title: "System role already exists", detail: (role: string) => `The system role ${role} already exists` },
  { status: 400, code: "fruster-user-service.CANNOT_DELETE_SUPER_ADMIN", title: "Cannot delete super-admin role", detail: () => `Cannot delete super-admin role as it is needed to access the interface` }
];

// @ts-ignore — frusterErrors accepts detail as function but types expect string
const errors = frusterErrors(errorModels);

export default errors;
```

**Note**: The `@ts-ignore` on the `frusterErrors()` call suppresses a type mismatch for `detail` functions (same as the original JS comment). The exported `errors` object has methods: `errors.get(code, ...detail)`, `errors.badRequest()`, `errors.notFound()`, `errors.internalServerError()`, `errors.unauthorized()`.

**Verification**:
- [x] File exists at `lib/errors.ts`
- [x] Uses `import frusterErrors from "@fruster/errors"`
- [x] Uses `export default errors`
- [x] `npx tsc --noEmit` does not produce errors for this file (aside from any pre-existing `@ts-ignore` suppressions)

---

#### Task 2.4: Create lib/deprecatedErrors.ts

- [x] Create `lib/deprecatedErrors.ts` as TypeScript version of `lib/deprecatedErrors.js`

**Context**: `lib/deprecatedErrors.js` defines local `error()` and `Error()` factory functions and exports an object of error factory functions using `uuid`. It does NOT use `fruster-errors`. The module exports are named (multiple exports, not a default).

**File**: `lib/deprecatedErrors.ts` (create new file alongside `lib/deprecatedErrors.js`)

**Current State**:
```js
const uuid = require("uuid");
module.exports = { userNotFound, invalidPassword, ... }
```

**Changes**: Create `lib/deprecatedErrors.ts`:

```typescript
import { v4 as uuidv4 } from "uuid";

const serviceId = "user-service";

const errorCode = {
  invalidPassword: serviceId + ".400.3",
  invalidRoles: serviceId + ".400.4",
  invalidEmail: serviceId + ".400.5",
  cannotUpdatePassword: serviceId + ".400.6",
  passwordRequired: serviceId + ".400.7",
  emailNotUnique: serviceId + ".400.10",
  invalidJson: serviceId + ".400.13",
  cannotRemoveLastRole: serviceId + ".400.14",

  invalidUsernameOrPassword: serviceId + ".401.3",

  forbidden: serviceId + ".403.1",

  userNotFound: serviceId + ".404.1"
};

interface DeprecatedError {
  status: number;
  error: {
    code: string;
    id: string;
    title: string;
    detail: string | undefined;
  };
}

const createError = (status: number, code: string, title: string, detail?: string): DeprecatedError => ({
  status,
  error: { code, id: uuidv4(), title, detail }
});

const throwError = (status: number, code: string, title: string, detail?: string): never => {
  throw createError(status, code, title, detail);
};

const deprecatedErrors = {
  userNotFound: (id: string) => throwError(404, errorCode.userNotFound, "User not found", "User with id " + id + " was not found"),
  invalidPassword: () => throwError(400, errorCode.invalidPassword, "Invalid password", "Password is invalid"),
  invalidRoles: (roles: string[]) => throwError(400, errorCode.invalidRoles, "Invalid roles", "Roles contains invalid role(s) " + roles),
  invalidEmail: (email: string) => throwError(400, errorCode.invalidEmail, "Invalid email", "Email " + email + " is invalid"),
  cannotUpdatePassword: () => throwError(400, errorCode.cannotUpdatePassword, "Cannot update password", "Cannot update password through user update"),
  passwordRequired: () => throwError(400, errorCode.passwordRequired, "password is required", "Field password in request body is required"),
  emailNotUnique: (email: string) => createError(400, errorCode.emailNotUnique, "Email is not unique", "Another account has already been registered with the provided email-address: " + email),
  invalidJson: () => throwError(400, errorCode.invalidJson, "Invalid json", "Invalid json in request body"),
  cannotRemoveLastRole: () => throwError(400, errorCode.cannotRemoveLastRole, "Cannot remove last role", "User must have at least one role"),
  invalidUsernameOrPassword: () => throwError(401, errorCode.invalidUsernameOrPassword, "Invalid username or password", "Invalid username or password"),
  forbidden: (title?: string, detail?: string) => throwError(403, errorCode.forbidden, title || "Forbidden", detail || "Forbidden"),

  errorCodes: errorCode
};

export default deprecatedErrors;
```

**Note on `emailNotUnique`**: In the original JS, `emailNotUnique` calls `Error()` (capital E, which returns without throwing) while all others call `error()` (lowercase, which throws). The TypeScript version preserves this — `emailNotUnique` uses `createError` (returns), others use `throwError` (throws and returns `never`).

**Verification**:
- [x] File exists at `lib/deprecatedErrors.ts`
- [x] Uses `import { v4 as uuidv4 } from "uuid"`
- [x] Uses `export default deprecatedErrors`
- [x] `emailNotUnique` returns an error object (does not throw)
- [x] All other methods throw

---

### Phase 3: Models

---

#### Task 3.1: Create lib/models/AccountDataSetModel.ts

- [x] Create `lib/models/AccountDataSetModel.ts` as TypeScript version

**Context**: Base class for `UserModel` and `ProfileModel`. Heavy use of `config` for `lowerCaseName` branching. References `RoleManager` (for `toViewModel`). References `Utils` for `toTitleCase`. `isFilteredResult` is an optional second constructor param controlling which initialization path runs.

**File**: `lib/models/AccountDataSetModel.ts` (create new file alongside `.js`)

**Current State**: `lib/models/AccountDataSetModel.js` — class with constructor, `_fromFilteredData()`, and `toViewModel()` methods. Imports `config`, `uuid`, `Utils`, `RoleManager`, `fruster-log`.

**Changes**: Create `lib/models/AccountDataSetModel.ts`:

```typescript
import config from "../../config";
import { v4 as uuidv4 } from "uuid";
import Utils from "../utils/Utils";
import log from "@fruster/log";

// Forward-reference to avoid circular deps — RoleManager is only used as a parameter type
type RoleManagerLike = {
  getScopesForRoles(roles: string[]): Promise<string[]>;
};

class AccountDataSetModel {
  id?: string;
  email?: string;
  password?: string;
  salt?: string;
  hashDate?: Date;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  roles?: string[];
  scopes?: string[] | null;
  emailVerified?: boolean;
  emailVerificationToken?: string;
  metadata?: { created?: Date; updated?: Date };
  [key: string]: unknown;

  constructor(json: Record<string, unknown>, isFilteredResult?: boolean) {
    if (!json || typeof json !== "object")
      throw new Error(`Expected json to be of type object but got ${typeof json} with value ${json}`);

    if ("metadata" in json && json.metadata && typeof json.metadata === "object") {
      this.metadata = {};
      const meta = json.metadata as Record<string, unknown>;
      if ("created" in meta) this.metadata.created = new Date(meta.created as string);
      if ("updated" in meta) this.metadata.updated = new Date(meta.updated as string);
    }

    if (isFilteredResult) {
      this._fromFilteredData(json);
    } else {
      Object.keys(json).forEach(key => { this[key] = json[key]; });

      this.id = (json.id as string) || uuidv4();

      if (json.email) this.email = (json.email as string).toLowerCase();

      if ("password" in json) this.password = json.password as string;

      if (config.lowerCaseName) {
        if ("firstName" in json)
          this.firstName = json.firstName || json.firstName === "" ? (json.firstName as string).toLowerCase() : undefined;
        if ("lastName" in json)
          this.lastName = json.lastName || json.lastName === "" ? (json.lastName as string).toLowerCase() : undefined;
        if ("middleName" in json)
          this.middleName = json.middleName ? (json.middleName as string).toLowerCase() : undefined;
      } else {
        if ("firstName" in json) this.firstName = json.firstName as string;
        if ("lastName" in json) this.lastName = json.lastName as string;
        if ("middleName" in json) this.middleName = json.middleName as string;
      }

      if ("roles" in json) {
        this.roles = [];
        if (json.roles) {
          (json.roles as string[]).forEach(role => {
            if (!this.roles!.includes(role)) this.roles!.push(role);
          });
        }
      }

      if ("salt" in json) this.salt = json.salt as string;
      if ("hashDate" in json) this.hashDate = new Date(json.hashDate as string);
      if ("scopes" in json) this.scopes = null;
      if ("emailVerified" in json) this.emailVerified = json.emailVerified as boolean;
      if ("emailVerificationToken" in json) this.emailVerificationToken = json.emailVerificationToken as string;
    }
  }

  _fromFilteredData(json: Record<string, unknown>) {
    Object.keys(json).forEach(key => { this[key] = json[key]; });

    if (config.lowerCaseName) {
      if (this.firstName)
        this.firstName = json.firstName || json.firstName === "" ? (json.firstName as string).toLowerCase() : undefined;
      if (this.lastName)
        this.lastName = json.lastName || json.lastName === "" ? (json.lastName as string).toLowerCase() : undefined;
      if (this.middleName)
        this.middleName = json.middleName ? (json.middleName as string).toLowerCase() : undefined;
    }

    if (this.email) this.email = json.email ? (json.email as string).toLowerCase() : undefined;
    if (json.salt) this.salt = json.salt as string;
    if (this.hashDate) this.hashDate = new Date(json.hashDate as string);
    if (this.scopes) this.scopes = null;
    if (this.emailVerified) this.emailVerified = json.emailVerified as boolean;
    if (this.emailVerificationToken) this.emailVerificationToken = json.emailVerificationToken as string;
    if (this.roles && this.roles.length === 0) delete this.roles;
  }

  async toViewModel(roleManager?: RoleManagerLike): Promise<Record<string, unknown>> {
    log.debug("Converts data model to view model for", this.constructor.name, this.id);

    const viewModel: Record<string, unknown> = { ...this };

    config.privateProperties.split("|").forEach(property => {
      delete viewModel[property];
    });

    delete viewModel._id;

    if (viewModel.roles && roleManager)
      viewModel.scopes = await roleManager.getScopesForRoles(viewModel.roles as string[]);

    if (config.lowerCaseName) {
      if (viewModel.firstName) viewModel.firstName = Utils.toTitleCase(viewModel.firstName as string);
      if (viewModel.lastName) viewModel.lastName = Utils.toTitleCase(viewModel.lastName as string);
      if (viewModel.middleName)
        viewModel.middleName = viewModel.middleName ? Utils.toTitleCase(viewModel.middleName as string) : undefined;
    }

    return viewModel;
  }
}

export default AccountDataSetModel;
```

**Verification**:
- [x] File exists at `lib/models/AccountDataSetModel.ts`
- [x] Uses `import config from "../../config"` (no `.ts` extension)
- [x] Uses `import log from "@fruster/log"`
- [x] Uses `export default AccountDataSetModel`
- [x] `npx tsc --noEmit` shows no new errors for this file

---

#### Task 3.2: Create lib/models/ProfileModel.ts

- [x] Create `lib/models/ProfileModel.ts` as TypeScript version

**Context**: Minimal subclass of `AccountDataSetModel`. Deletes `id` in constructor if not present in the input json.

**File**: `lib/models/ProfileModel.ts` (create alongside `.js`)

**Changes**: Create `lib/models/ProfileModel.ts`:

```typescript
import AccountDataSetModel from "./AccountDataSetModel";

class ProfileModel extends AccountDataSetModel {
  constructor(json: Record<string, unknown>, isFilteredResult?: boolean) {
    super(json, isFilteredResult);
    if (!json.id) delete this.id;
  }
}

export default ProfileModel;
```

**Verification**:
- [x] File exists at `lib/models/ProfileModel.ts`
- [x] Extends `AccountDataSetModel` from `"./AccountDataSetModel"` (no `.ts` extension)
- [x] Uses `export default ProfileModel`

---

#### Task 3.3: Create lib/models/UserModel.ts

- [x] Create `lib/models/UserModel.ts` as TypeScript version

**Context**: Subclass of `AccountDataSetModel`. Adds `profile` property handling, `addEmailVerificationToken()`, `addSetPasswordToken()`, `concatWithProfile()`, and overrides `toViewModel()` to also convert the nested profile.

**File**: `lib/models/UserModel.ts` (create alongside `.js`)

**Changes**: Create `lib/models/UserModel.ts`:

```typescript
import AccountDataSetModel from "./AccountDataSetModel";
import ProfileModel from "./ProfileModel";

type RoleManagerLike = {
  getScopesForRoles(roles: string[]): Promise<string[]>;
};

class UserModel extends AccountDataSetModel {
  profile?: ProfileModel;
  setPasswordToken?: string;

  constructor(json: Record<string, unknown>, isFilteredResult?: boolean) {
    super(json, isFilteredResult);
    if ("profile" in json && json.profile)
      this.profile = new ProfileModel(json.profile as Record<string, unknown>);
  }

  addEmailVerificationToken(emailVerificationToken: string): UserModel {
    this.emailVerificationToken = emailVerificationToken;
    this.emailVerified = false;
    return this;
  }

  addSetPasswordToken(token: string): UserModel {
    this.setPasswordToken = token;
    return this;
  }

  concatWithProfile(profile: ProfileModel | null): UserModel {
    if (!profile) return this;
    const copyOfThis = Object.assign({}, this) as Record<string, unknown>;
    copyOfThis.profile = new ProfileModel(profile as unknown as Record<string, unknown>);
    return new UserModel(copyOfThis, false);
  }

  async toViewModel(roleManager?: RoleManagerLike): Promise<Record<string, unknown>> {
    const viewModel = await super.toViewModel(roleManager);
    if (viewModel.profile)
      viewModel.profile = await (viewModel.profile as ProfileModel).toViewModel(roleManager);
    return viewModel;
  }
}

export default UserModel;
```

**Verification**:
- [x] File exists at `lib/models/UserModel.ts`
- [x] Imports `AccountDataSetModel` from `"./AccountDataSetModel"`
- [x] Imports `ProfileModel` from `"./ProfileModel"`
- [x] Uses `export default UserModel`

---

#### Task 3.4: Create lib/models/RoleModel.ts

- [x] Create `lib/models/RoleModel.ts` as TypeScript version

**Context**: Simple class. Constructor accepts either an object with `role` and `scopes` properties, or a plain string for `role`. No external dependencies beyond what TypeScript provides.

**File**: `lib/models/RoleModel.ts` (create alongside `.js`)

**Current State**:
```js
class RoleModel {
  constructor(json, scopes) {
    if (typeof json === "object") {
      this.role = json.role;
      this.scopes = json.scopes;
    } else {
      this.role = json;
      this.scopes = scopes || [];
    }
  }
}
module.exports = RoleModel;
```

**Changes**: Create `lib/models/RoleModel.ts`:

```typescript
class RoleModel {
  role: string;
  scopes: string[];

  constructor(json: { role: string; scopes?: string[] } | string, scopes?: string[]) {
    if (typeof json === "object") {
      this.role = json.role;
      this.scopes = json.scopes || [];
    } else {
      this.role = json;
      this.scopes = scopes || [];
    }
  }
}

export default RoleModel;
```

**Verification**:
- [x] File exists at `lib/models/RoleModel.ts`
- [x] Uses `export default RoleModel`
- [x] Constructor handles both `object` and `string` input

---

### Phase 4: Repositories

---

#### Task 4.1: Create lib/repos/AbstractRoleScopesRepo.ts

- [x] Create `lib/repos/AbstractRoleScopesRepo.ts` as TypeScript version

**Context**: Abstract base class for role/scope repositories. Has `prepareRoles()` which parses `config.roles` string into `RoleModel` array. All other methods return null by default. Two concrete subclasses extend this.

**File**: `lib/repos/AbstractRoleScopesRepo.ts` (create alongside `.js`)

**Changes**: Create `lib/repos/AbstractRoleScopesRepo.ts`:

```typescript
import RoleModel from "../models/RoleModel";
import config from "../../config";

class AbstractRoleScopesRepo {
  protected _roles: RoleModel[] = [];

  async getRoles(): Promise<RoleModel[] | null> { return null; }
  async addRole(_role: string, _scopes: string[]): Promise<RoleModel | null> { return null; }
  async addScopes(_role: string, _scopes: string[]): Promise<RoleModel | null> { return null; }
  async removeRole(_role: string): Promise<void> { return; }
  async removeScopes(_role: string, _scopes: string[]): Promise<RoleModel | null> { return null; }

  async prepareRoles(): Promise<void> {
    this._roles = [];
    if (!config.roles) return;

    config.roles.split(";").forEach((roleEntry: string) => {
      const [role, scopesStr] = roleEntry.split(":");
      const scopes = scopesStr ? scopesStr.split(",") : [];
      this._roles.push(new RoleModel(role, scopes));
    });
  }
}

export default AbstractRoleScopesRepo;
```

**Note**: Check the original `prepareRoles()` logic in `lib/repos/AbstractRoleScopesRepo.js` if the parsing format differs from above. The string format is `"role1:scope1,scope2;role2:scope3"`.

**Verification**:
- [x] File exists at `lib/repos/AbstractRoleScopesRepo.ts`
- [x] Uses `export default AbstractRoleScopesRepo`

---

#### Task 4.2: Create lib/repos/RoleScopesConfigRepo.ts

- [x] Create `lib/repos/RoleScopesConfigRepo.ts` as TypeScript version

**Context**: Extends `AbstractRoleScopesRepo`. Stores roles in the in-memory `_roles` array. Uses `uuid` for an instance id property.

**File**: `lib/repos/RoleScopesConfigRepo.ts` (create alongside `.js`)

**Changes**: Create `lib/repos/RoleScopesConfigRepo.ts`:

```typescript
import { v4 as uuidv4 } from "uuid";
import AbstractRoleScopesRepo from "./AbstractRoleScopesRepo";
import RoleModel from "../models/RoleModel";

class RoleScopesConfigRepo extends AbstractRoleScopesRepo {
  private _id: string = uuidv4();

  async getRoles(): Promise<RoleModel[]> {
    return this._roles;
  }

  async addRole(role: string, scopes: string[]): Promise<RoleModel> {
    const newRole = new RoleModel(role, scopes);
    this._roles.push(newRole);
    return newRole;
  }

  async addScopes(role: string, scopes: string[]): Promise<RoleModel | null> {
    const existing = this._roles.find(r => r.role === role);
    if (!existing) return null;
    scopes.forEach(s => { if (!existing.scopes.includes(s)) existing.scopes.push(s); });
    return existing;
  }

  async removeRole(role: string): Promise<void> {
    this._roles = this._roles.filter(r => r.role !== role);
  }

  async removeScopes(role: string, scopes: string[]): Promise<RoleModel | null> {
    const existing = this._roles.find(r => r.role === role);
    if (!existing) return null;
    existing.scopes = existing.scopes.filter(s => !scopes.includes(s));
    return existing;
  }
}

export default RoleScopesConfigRepo;
```

**Important**: Read the original `lib/repos/RoleScopesConfigRepo.js` and verify the method implementations match before finalizing. The exact logic is in the original file.

**Verification**:
- [x] File exists at `lib/repos/RoleScopesConfigRepo.ts`
- [x] Extends `AbstractRoleScopesRepo`
- [x] Uses `export default RoleScopesConfigRepo`

---

#### Task 4.3: Create lib/repos/RoleScopesDbRepo.ts

- [x] Create `lib/repos/RoleScopesDbRepo.ts` as TypeScript version

**Context**: Extends `AbstractRoleScopesRepo`. Stores roles in a MongoDB collection. Uses `Db` from mongodb, `constants`, `RoleModel`, `errors`.

**File**: `lib/repos/RoleScopesDbRepo.ts` (create alongside `.js`)

**Changes**: Create `lib/repos/RoleScopesDbRepo.ts`. Read the full `lib/repos/RoleScopesDbRepo.js` first for exact method logic. Template:

```typescript
import { Db } from "mongodb";
import AbstractRoleScopesRepo from "./AbstractRoleScopesRepo";
import RoleModel from "../models/RoleModel";
import constants from "../constants";
import errors from "../errors";

class RoleScopesDbRepo extends AbstractRoleScopesRepo {
  private _collection: ReturnType<Db["collection"]>;

  constructor(db: Db) {
    super();
    this._collection = db.collection(constants.collections.ROLE_SCOPES);
  }

  // Implement all methods from the .js file, replacing:
  // - require("mongodb").Db → imported Db type
  // - require("../models/RoleModel") → imported RoleModel
  // - require("../errors") → imported errors
  // - require("../constants") → imported constants
  // Return types: match the .js behavior
}

export default RoleScopesDbRepo;
```

**Implementor note**: Read `lib/repos/RoleScopesDbRepo.js` fully before implementing. Copy all method bodies, replacing only the import syntax.

**Verification**:
- [x] File exists at `lib/repos/RoleScopesDbRepo.ts`
- [x] Constructor accepts `Db` parameter
- [x] Uses `export default RoleScopesDbRepo`

---

#### Task 4.4: Create lib/repos/InitialUserRepo.ts

- [x] Create `lib/repos/InitialUserRepo.ts` as TypeScript version

**Context**: Repository for the initial admin user. Uses `uuid`, `Db`, `constants`, `UserModel`. Has `exists()` and `saveInitialUser()` methods.

**File**: `lib/repos/InitialUserRepo.ts` (create alongside `.js`)

**Changes**: Create `lib/repos/InitialUserRepo.ts`:

```typescript
import { v4 as uuidv4 } from "uuid";
import { Db } from "mongodb";
import constants from "../constants";
import UserModel from "../models/UserModel";

class InitialUserRepo {
  private _collection: ReturnType<Db["collection"]>;
  private _userCollection: ReturnType<Db["collection"]>;

  constructor(db: Db) {
    this._collection = db.collection(constants.collections.INITIAL_USER);
    this._userCollection = db.collection(constants.collections.USERS);
  }

  // Copy method bodies from lib/repos/InitialUserRepo.js, replacing:
  // - require("uuid") → imported uuidv4
  // - require("mongodb").Db → imported Db type
  // - require("../constants") → imported constants
  // - require("../models/UserModel") → imported UserModel
}

export default InitialUserRepo;
```

**Implementor note**: Read `lib/repos/InitialUserRepo.js` fully before implementing. Replace only the imports.

**Verification**:
- [x] File exists at `lib/repos/InitialUserRepo.ts`
- [x] Constructor accepts `Db` parameter
- [x] Uses `export default InitialUserRepo`

---

#### Task 4.5: Create lib/repos/ProfileRepo.ts

- [x] Create `lib/repos/ProfileRepo.ts` as TypeScript version

**Context**: Repository for user profiles. Uses `Db`, `constants`, `ProfileModel`. Has find-based and aggregation-based query methods.

**File**: `lib/repos/ProfileRepo.ts` (create alongside `.js`)

**Changes**: Create `lib/repos/ProfileRepo.ts`:

```typescript
import { Db } from "mongodb";
import constants from "../constants";
import ProfileModel from "../models/ProfileModel";

class ProfileRepo {
  private _collection: ReturnType<Db["collection"]>;

  constructor(db: Db) {
    this._collection = db.collection(constants.collections.PROFILES);
  }

  // Copy all method bodies from lib/repos/ProfileRepo.js, replacing:
  // - require("mongodb").Db → imported Db type
  // - require("../constants") → imported constants
  // - require("../models/ProfileModel") → imported ProfileModel
}

export default ProfileRepo;
```

**Implementor note**: Read `lib/repos/ProfileRepo.js` fully before implementing. Copy method bodies verbatim, changing only imports.

**Verification**:
- [x] File exists at `lib/repos/ProfileRepo.ts`
- [x] Constructor accepts `Db` parameter
- [x] Uses `export default ProfileRepo`

---

#### Task 4.6: Create lib/repos/UserRepo.ts

- [x] Create `lib/repos/UserRepo.ts` as TypeScript version

**Context**: The most complex repository. Uses `Db`, `UserModel`, `errors`, `fruster-log`, `constants`, `config`. Has ~12 methods including complex MongoDB aggregation for user/profile joining.

**File**: `lib/repos/UserRepo.ts` (create alongside `.js`)

**Changes**: Create `lib/repos/UserRepo.ts`:

```typescript
import { Db } from "mongodb";
import UserModel from "../models/UserModel";
import errors from "../errors";
import log from "@fruster/log";
import constants from "../constants";
import config from "../../config";

class UserRepo {
  private _collection: ReturnType<Db["collection"]>;

  constructor(db: Db) {
    this._collection = db.collection(constants.collections.USERS);
  }

  // Copy ALL method bodies from lib/repos/UserRepo.js, replacing only imports:
  // - require("fruster-log") → imported log
  // - require("../errors") → imported errors
  // - require("../models/UserModel") → imported UserModel
  // - require("../constants") → imported constants
  // - require("../../config") → imported config
  // - require("mongodb").Db → imported Db type
}

export default UserRepo;
```

**Implementor note**: `lib/repos/UserRepo.js` is ~300+ lines. Read it fully. Copy all private methods (`_findResult`, `_aggregateResult`, `_findCount`, `_getExpandAggregation`, etc.) verbatim, changing only imports and `module.exports`.

**Verification**:
- [x] File exists at `lib/repos/UserRepo.ts`
- [x] Constructor accepts `Db` parameter
- [x] All methods from the `.js` file are present
- [x] Uses `export default UserRepo`
- [x] `npx tsc --noEmit` shows no errors for this file

---

### Phase 5: Managers

---

#### Task 5.1: Create lib/utils/Utils.ts

- [x] Create `lib/utils/Utils.ts` as TypeScript version of `lib/utils/Utils.js`

**Context**: Static utility class. Depends only on `config`. Three static methods.

**File**: `lib/utils/Utils.ts` (create alongside `.js`)

**Changes**: Create `lib/utils/Utils.ts`:

```typescript
import config from "../../config";

class Utils {
  static validateEmail(email: string): boolean {
    return new RegExp(config.emailValidationRegex).test(email);
  }

  static toTitleCase(str: string): string {
    if (str && str.length > 1)
      return str.substring(0, 1).toUpperCase() + str.substring(1);
    return str;
  }

  static userShouldVerifyEmail(user: { roles?: string[] }): boolean {
    return (config.requireEmailVerification || config.optionalEmailVerification)
      && (config.emailVerificationForRoles.includes("*")
        || (user.roles || []).some(r => config.emailVerificationForRoles.includes(r)));
  }
}

export default Utils;
```

**Verification**:
- [x] File exists at `lib/utils/Utils.ts`
- [x] Uses `export default Utils`

---

#### Task 5.2: Create lib/managers/RoleManager.ts

- [x] Create `lib/managers/RoleManager.ts` as TypeScript version

**Context**: Manages roles and scopes. Accepts either `RoleScopesDbRepo` or `RoleScopesConfigRepo` (both extend `AbstractRoleScopesRepo`). Default constructor arg is `new RoleScopesConfigRepo()`.

**File**: `lib/managers/RoleManager.ts` (create alongside `.js`)

**Changes**: Create `lib/managers/RoleManager.ts`. Read `lib/managers/RoleManager.js` for method logic:

```typescript
import AbstractRoleScopesRepo from "../repos/AbstractRoleScopesRepo";
import RoleScopesConfigRepo from "../repos/RoleScopesConfigRepo";
import RoleModel from "../models/RoleModel";

class RoleManager {
  private _repo: AbstractRoleScopesRepo;

  constructor(repo: AbstractRoleScopesRepo = new RoleScopesConfigRepo()) {
    this._repo = repo;
  }

  // Copy method bodies from lib/managers/RoleManager.js for:
  // - getRoles(): Promise
  // - validateRoles(roles): Promise<string[]>
  // - getScopesForRoles(roles): Promise<string[]>
}

export default RoleManager;
```

**Verification**:
- [x] File exists at `lib/managers/RoleManager.ts`
- [x] Uses `export default RoleManager`
- [x] Constructor default uses `new RoleScopesConfigRepo()`

---

#### Task 5.3: Create lib/managers/PasswordManager.ts

- [x] Create `lib/managers/PasswordManager.ts` as TypeScript version

**Context**: Password hashing and validation. Uses `crypto`, `csprng` (imported as `secureRandom`), `config`, `deprecatedErrors`, `UserModel`, `UserRepo`.

**File**: `lib/managers/PasswordManager.ts` (create alongside `.js`)

**Changes**: Create `lib/managers/PasswordManager.ts`. Read `lib/managers/PasswordManager.js` for method logic:

```typescript
import * as crypto from "crypto";
import secureRandom from "csprng";
import config from "../../config";
import deprecatedErrors from "../deprecatedErrors";
import UserModel from "../models/UserModel";
import UserRepo from "../repos/UserRepo";

class PasswordManager {
  private _userRepo: UserRepo;

  constructor(userRepo: UserRepo) {
    this._userRepo = userRepo;
  }

  // Copy method bodies from lib/managers/PasswordManager.js for:
  // - hashPassword(user: UserModel): Promise<void>
  // - hashPasswordForUserId(password, userId): Promise<string>
  // - validatePassword(password, hashedPassword, salt, userId): boolean
  // - validatePasswordForUser(password, userId): Promise<boolean>
  // - validatePasswordFollowsRegExp(password): boolean
}

export default PasswordManager;
```

**Note on `csprng`**: The package may not have `@types`. Use `import secureRandom from "csprng"` with `esModuleInterop: true`. If types are missing, add `declare module "csprng"` in a `csprng.d.ts` file, or use `// @ts-ignore`.

**Verification**:
- [x] File exists at `lib/managers/PasswordManager.ts`
- [x] Uses `export default PasswordManager`

---

#### Task 5.4: Create lib/managers/ProfileManager.ts

- [x] Create `lib/managers/ProfileManager.ts` as TypeScript version

**Context**: Manages profile operations and the user/profile field splitting logic. Uses `ProfileRepo`, `UserModel`, `ProfileModel`, `AccountDataSetModel`, `constants`, `config`.

**File**: `lib/managers/ProfileManager.ts` (create alongside `.js`)

**Changes**: Create `lib/managers/ProfileManager.ts`. Read `lib/managers/ProfileManager.js` for method logic:

```typescript
import ProfileRepo from "../repos/ProfileRepo";
import UserModel from "../models/UserModel";
import ProfileModel from "../models/ProfileModel";
import AccountDataSetModel from "../models/AccountDataSetModel";
import constants from "../constants";
import config from "../../config";

class ProfileManager {
  private _profileRepo: ProfileRepo;

  constructor(profileRepo: ProfileRepo) {
    this._profileRepo = profileRepo;
  }

  // Copy method bodies from lib/managers/ProfileManager.js for:
  // - saveProfile(profile)
  // - updateProfile(id, updateData)
  // - getProfilesByQuery(query)
  // - expandUsersWithProfiles(users)
  // - expandUserWithProfile(user)
  // - splitUserFields(data): [userFields, profileFields]
}

export default ProfileManager;
```

**Verification**:
- [x] File exists at `lib/managers/ProfileManager.ts`
- [x] Uses `export default ProfileManager`

---

#### Task 5.5: Create lib/managers/UserManager.ts

- [x] Create `lib/managers/UserManager.ts` as TypeScript version

**Context**: User data validation and error handling. Uses `config`, `errors`, `constants`, `deprecatedErrors`, `PasswordManager`, `RoleManager`, `UserRepo`, `Utils`, `fruster-log`.

**File**: `lib/managers/UserManager.ts` (create alongside `.js`)

**Changes**: Create `lib/managers/UserManager.ts`. Read `lib/managers/UserManager.js` for method logic:

```typescript
import config from "../../config";
import errors from "../errors";
import constants from "../constants";
import deprecatedErrors from "../deprecatedErrors";
import PasswordManager from "./PasswordManager";
import RoleManager from "./RoleManager";
import UserRepo from "../repos/UserRepo";
import Utils from "../utils/Utils";
import log from "@fruster/log";

class UserManager {
  private _passwordManager: PasswordManager;
  private _roleManager: RoleManager;
  private _userRepo: UserRepo;

  constructor(passwordManager: PasswordManager, roleManager: RoleManager, userRepo: UserRepo) {
    this._passwordManager = passwordManager;
    this._roleManager = roleManager;
    this._userRepo = userRepo;
  }

  // Copy method bodies from lib/managers/UserManager.js for:
  // - validateUpdateData(data): object
  // - handleUniqueIndexError(err, user): Error
  // - validateInputData(data): Promise<void>
}

export default UserManager;
```

**Verification**:
- [x] File exists at `lib/managers/UserManager.ts`
- [x] Uses `export default UserManager`

---

#### Task 5.6: Create lib/utils/EmailUtils.ts

- [x] Create `lib/utils/EmailUtils.ts` as TypeScript version

**Context**: Static utility class for email token generation and template rendering. Uses `uuid`, `crypto`, `csprng`, `config`, `errors`, `UserModel`.

**File**: `lib/utils/EmailUtils.ts` (create alongside `.js`)

**Changes**: Create `lib/utils/EmailUtils.ts`. Read `lib/utils/EmailUtils.js` for all method logic:

```typescript
import { v4 as uuidv4 } from "uuid";
import * as crypto from "crypto";
import secureRandom from "csprng";
import config from "../../config";
import errors from "../errors";
import UserModel from "../models/UserModel";

class EmailUtils {
  static generateToken(email: string): string {
    return crypto.createHmac("sha256", secureRandom(256, 36) + uuidv4() + email).digest("hex");
  }

  static getHashedToken(token: string): string {
    return crypto.createHmac("sha256", token).digest("hex");
  }

  // Copy remaining methods from lib/utils/EmailUtils.js:
  // - getEmailMessage(message, user, token): string
  // - getEmailTemplate(roles): string
  // - _replaceAll(str, search, replacement): string
}

export default EmailUtils;
```

**Verification**:
- [x] File exists at `lib/utils/EmailUtils.ts`
- [x] Uses `export default EmailUtils`

---

#### Task 5.7: Create lib/clients/MailServiceClient.ts

- [x] Create `lib/clients/MailServiceClient.ts` as TypeScript version

**Context**: Static class wrapping a bus request to `mail-service.send-mail`. Uses `bus` directly (not as a constructor dependency). This is a service client — not a class that receives dependencies via constructor injection. It is a static-method class, so no instance export is needed.

**File**: `lib/clients/MailServiceClient.ts` (create alongside `.js`)

**Changes**: Create `lib/clients/MailServiceClient.ts`:

```typescript
import bus from "@fruster/bus";

class MailServiceClient {
  static get endpoints() {
    return {
      SEND_MAIL: "mail-service.send-mail"
    };
  }

  static async sendMail({ reqId, to, from, subject, message, templateId, templateArgs }: {
    reqId: string;
    to: string | string[];
    from?: string;
    subject?: string;
    message?: string;
    templateId?: string;
    templateArgs?: Record<string, unknown>;
  }): Promise<void> {
    return (await bus.request({
      subject: MailServiceClient.endpoints.SEND_MAIL,
      message: {
        reqId,
        data: { to, from, subject, message, templateId, templateArgs }
      }
    })).data;
  }
}

export default MailServiceClient;
```

**Verification**:
- [x] File exists at `lib/clients/MailServiceClient.ts`
- [x] Uses `import bus from "@fruster/bus"` (default import)
- [x] Uses `export default MailServiceClient`

---

#### Task 5.8: Create lib/Publishes.ts

- [x] Create `lib/Publishes.ts` as TypeScript version of `lib/Publishes.js`

**Context**: Static class that publishes events to the bus. Uses `bus.publish()`.

**File**: `lib/Publishes.ts` (create alongside `.js`)

**Changes**: Create `lib/Publishes.ts`:

```typescript
import bus from "@fruster/bus";

class Publishes {
  static get subjects() {
    return {
      USER_DELETED: "pub.user-service.user-deleted"
    };
  }

  static async userDeleted(reqId: string, userId: string): Promise<void> {
    bus.publish(Publishes.subjects.USER_DELETED, { reqId, data: { userId } });
  }
}

export default Publishes;
```

**Verification**:
- [x] File exists at `lib/Publishes.ts`
- [x] Uses `import bus from "@fruster/bus"`
- [x] Uses `export default Publishes`

---

#### Task 5.9: Create lib/managers/EmailManager.ts

- [x] Create `lib/managers/EmailManager.ts` as TypeScript version

**Context**: Static class with `sendVerificationEmail()` and `sendSetPasswordEmail()` methods. Uses `fruster-log`, `config`, `UserModel`, `EmailUtils`, `MailServiceClient`.

**File**: `lib/managers/EmailManager.ts` (create alongside `.js`)

**Changes**: Create `lib/managers/EmailManager.ts`. Read `lib/managers/EmailManager.js` for full method logic:

```typescript
import log from "@fruster/log";
import config from "../../config";
import UserModel from "../models/UserModel";
import EmailUtils from "../utils/EmailUtils";
import MailServiceClient from "../clients/MailServiceClient";

class EmailManager {
  // Copy static method bodies from lib/managers/EmailManager.js:
  // - static sendVerificationEmail(reqId, user, token): void
  // - static sendSetPasswordEmail(reqId, user, token): void
}

export default EmailManager;
```

**Verification**:
- [x] File exists at `lib/managers/EmailManager.ts`
- [x] Uses `export default EmailManager`

---

#### Task 5.10: Create lib/docs.ts

- [x] Create `lib/docs.ts` as TypeScript version of `lib/docs.js`

**Context**: Exports API documentation object. Imports `config`, `constants`, `Publishes`. Large file (~400+ lines). This is a data file — copy the content verbatim, changing only the imports and export syntax.

**File**: `lib/docs.ts` (create alongside `.js`)

**Changes**:

1. Read `lib/docs.js` fully
2. Create `lib/docs.ts` replacing:
   - `const config = require("../config")` → `import config from "../config"`
   - `const constants = require("./constants")` → `import constants from "./constants"`
   - `const Publishes = require("./Publishes")` → `import Publishes from "./Publishes"`
   - `module.exports = { http: {...}, service: {...}, deprecated: {...} }` → `const docs = { ... }; export default docs`

**Verification**:
- [x] File exists at `lib/docs.ts`
- [x] Uses `export default docs`
- [x] `npx tsc --noEmit` shows no errors for this file

---

### Phase 6: Handlers

Each handler follows the same conversion pattern:
1. Rename imports from `require()` to `import`
2. Replace `const FrusterRequest = require("fruster-bus").FrusterRequest` with nothing (it was only used in JSDoc)
3. Replace `require("fruster-log")` with `import log from "@fruster/log"`
4. Replace `module.exports = HandlerClass` with `export default HandlerClass`
5. Create new `.ts` file alongside the existing `.js` file

---

#### Task 6.1: Create lib/handlers/CreateUserHandler.ts

- [x] Create TypeScript version of `CreateUserHandler.js`

**File**: `lib/handlers/CreateUserHandler.ts`

**Imports to replace**:
```typescript
import UserModel from "../models/UserModel";
import ProfileModel from "../models/ProfileModel";
import Utils from "../utils/Utils";
import EmailUtils from "../utils/EmailUtils";
import PasswordManager from "../managers/PasswordManager";
import RoleManager from "../managers/RoleManager";
import ProfileManager from "../managers/ProfileManager";
import UserManager from "../managers/UserManager";
import EmailManager from "../managers/EmailManager";
import UserRepo from "../repos/UserRepo";
import config from "../../config";
```

**Export**: `export default CreateUserHandler`

**Method signatures** (copy bodies verbatim from `.js`):
```typescript
async handle({ reqId, data }: { reqId: string; data: Record<string, unknown> }): Promise<{ status: number; data: unknown }>
```

**Verification**:
- [x] File exists at `lib/handlers/CreateUserHandler.ts`
- [x] No `require()` statements
- [x] Uses `export default CreateUserHandler`

---

#### Task 6.2: Create lib/handlers/CreateInitialUserHandler.ts

- [x] Create TypeScript version of `CreateInitialUserHandler.js`

**File**: `lib/handlers/CreateInitialUserHandler.ts`

Read `lib/handlers/CreateInitialUserHandler.js` for full content. Standard conversion:

```typescript
import UserRepo from "../repos/UserRepo";
import InitialUserRepo from "../repos/InitialUserRepo";
import PasswordManager from "../managers/PasswordManager";
import config from "../../config";
import log from "@fruster/log";
// ... any other imports from the .js file
```

**Export**: `export default CreateInitialUserHandler`

**Verification**:
- [x] File exists at `lib/handlers/CreateInitialUserHandler.ts`
- [x] Uses `export default CreateInitialUserHandler`

---

#### Task 6.3: Create lib/handlers/GetUserHandler.ts

- [x] Create TypeScript version of `GetUserHandler.js` (marked as DEPRECATED)

**File**: `lib/handlers/GetUserHandler.ts`

Read `lib/handlers/GetUserHandler.js`. Standard conversion:

```typescript
import UserRepo from "../repos/UserRepo";
import RoleManager from "../managers/RoleManager";
import UserModel from "../models/UserModel";
// ... other imports as in .js
```

**Export**: `export default GetUserHandler`

---

#### Task 6.4: Create lib/handlers/GetUsersByQueryHandler.ts

- [x] Create TypeScript version of `GetUsersByQueryHandler.js`

**File**: `lib/handlers/GetUsersByQueryHandler.ts`

```typescript
import UserRepo from "../repos/UserRepo";
import RoleManager from "../managers/RoleManager";
import UserModel from "../models/UserModel";
import log from "@fruster/log";
import deprecatedErrors from "../deprecatedErrors";
import config from "../../config";
import ProfileManager from "../managers/ProfileManager";
```

**Export**: `export default GetUsersByQueryHandler`

---

#### Task 6.5: Create lib/handlers/GetUsersByAggregateHandler.ts

- [x] Create TypeScript version of `GetUsersByAggregateHandler.js`

**File**: `lib/handlers/GetUsersByAggregateHandler.ts`

Read `lib/handlers/GetUsersByAggregateHandler.js`. Standard conversion replacing `require()` with `import`.

**Export**: `export default GetUsersByAggregateHandler`

---

#### Task 6.6: Create lib/handlers/GetByAggregateHandler.ts

- [x] Create TypeScript version of `GetByAggregateHandler.js`

**File**: `lib/handlers/GetByAggregateHandler.ts`

Read `lib/handlers/GetByAggregateHandler.js`. Standard conversion.

**Export**: `export default GetByAggregateHandler`

---

#### Task 6.7: Create lib/handlers/GetUserByIdHandler.ts

- [x] Create TypeScript version of `GetUserByIdHandler.js`

**File**: `lib/handlers/GetUserByIdHandler.ts`

```typescript
import errors from "../errors";
import log from "@fruster/log";
import UserModel from "../models/UserModel";
import UserRepo from "../repos/UserRepo";
import RoleManager from "../managers/RoleManager";
import ProfileManager from "../managers/ProfileManager";
```

**Export**: `export default GetUserByIdHandler`

---

#### Task 6.8: Create lib/handlers/GetScopesForRolesHandler.ts

- [x] Create TypeScript version of `GetScopesForRolesHandler.js`

**File**: `lib/handlers/GetScopesForRolesHandler.ts`

Read `lib/handlers/GetScopesForRolesHandler.js`. Standard conversion.

**Export**: `export default GetScopesForRolesHandler`

---

#### Task 6.9: Create lib/handlers/UpdateUserHandler.ts

- [x] Create TypeScript version of `UpdateUserHandler.js`

**File**: `lib/handlers/UpdateUserHandler.ts`

```typescript
import UserRepo from "../repos/UserRepo";
import Utils from "../utils/Utils";
import EmailUtils from "../utils/EmailUtils";
import config from "../../config";
import deprecatedErrors from "../deprecatedErrors";
import errors from "../errors";
import PasswordManager from "../managers/PasswordManager";
import RoleManager from "../managers/RoleManager";
import ProfileManager from "../managers/ProfileManager";
import UserManager from "../managers/UserManager";
import EmailManager from "../managers/EmailManager";
import UserModel from "../models/UserModel";
import log from "@fruster/log";
```

**Export**: `export default UpdateUserHandler`

---

#### Task 6.10: Create lib/handlers/DeleteUserHandler.ts

- [x] Create TypeScript version of `DeleteUserHandler.js`

**File**: `lib/handlers/DeleteUserHandler.ts`

```typescript
import log from "@fruster/log";
import UserRepo from "../repos/UserRepo";
import ProfileRepo from "../repos/ProfileRepo";
import Publishes from "../Publishes";
```

**Export**: `export default DeleteUserHandler`

---

#### Task 6.11: Create lib/handlers/DeleteUsersByQueryHandler.ts

- [x] Create TypeScript version of `DeleteUsersByQueryHandler.js`

**File**: `lib/handlers/DeleteUsersByQueryHandler.ts`

Read `lib/handlers/DeleteUsersByQueryHandler.js`. Standard conversion.

**Export**: `export default DeleteUsersByQueryHandler`

---

#### Task 6.12: Create lib/handlers/ValidatePasswordHandler.ts

- [x] Create TypeScript version of `ValidatePasswordHandler.js`

**File**: `lib/handlers/ValidatePasswordHandler.ts`

Read `lib/handlers/ValidatePasswordHandler.js`. Standard conversion.

**Export**: `export default ValidatePasswordHandler`

---

#### Task 6.13: Create lib/handlers/UpdatePasswordHandler.ts

- [x] Create TypeScript version of `UpdatePasswordHandler.js`

**File**: `lib/handlers/UpdatePasswordHandler.ts`

Read `lib/handlers/UpdatePasswordHandler.js`. Standard conversion.

**Export**: `export default UpdatePasswordHandler`

---

#### Task 6.14: Create lib/handlers/SetPasswordHandler.ts

- [x] Create TypeScript version of `SetPasswordHandler.js`

**File**: `lib/handlers/SetPasswordHandler.ts`

Read `lib/handlers/SetPasswordHandler.js`. Standard conversion.

**Export**: `export default SetPasswordHandler`

---

#### Task 6.15: Create lib/handlers/AddRolesHandler.ts

- [x] Create TypeScript version of `AddRolesHandler.js`

**File**: `lib/handlers/AddRolesHandler.ts`

```typescript
import UserRepo from "../repos/UserRepo";
import RoleManager from "../managers/RoleManager";
import deprecatedErrors from "../deprecatedErrors";
```

**Export**: `export default AddRolesHandler`

---

#### Task 6.16: Create lib/handlers/RemoveRolesHandler.ts

- [x] Create TypeScript version of `RemoveRolesHandler.js`

**File**: `lib/handlers/RemoveRolesHandler.ts`

Read `lib/handlers/RemoveRolesHandler.js`. Standard conversion.

**Export**: `export default RemoveRolesHandler`

---

#### Task 6.17: Create lib/handlers/GetProfilesByQueryHandler.ts

- [x] Create TypeScript version of `GetProfilesByQueryHandler.js`

**File**: `lib/handlers/GetProfilesByQueryHandler.ts`

Read `lib/handlers/GetProfilesByQueryHandler.js`. Standard conversion.

**Export**: `export default GetProfilesByQueryHandler`

---

#### Task 6.18: Create lib/handlers/UpdateProfileHandler.ts

- [x] Create TypeScript version of `UpdateProfileHandler.js`

**File**: `lib/handlers/UpdateProfileHandler.ts`

Read `lib/handlers/UpdateProfileHandler.js`. Standard conversion.

**Export**: `export default UpdateProfileHandler`

---

#### Task 6.19: Create lib/handlers/GetMeHandler.ts

- [x] Create TypeScript version of `GetMeHandler.js`

**File**: `lib/handlers/GetMeHandler.ts`

Read `lib/handlers/GetMeHandler.js`. Standard conversion.

**Export**: `export default GetMeHandler`

---

#### Task 6.20: Create lib/handlers/email-verification/VerifyEmailAddressHandler.ts

- [x] Create TypeScript version of `VerifyEmailAddressHandler.js`

**File**: `lib/handlers/email-verification/VerifyEmailAddressHandler.ts`

```typescript
import errors from "../../errors";
import UserRepo from "../../repos/UserRepo";
```

**Export**: `export default VerifyEmailAddressHandler`

---

#### Task 6.21: Create lib/handlers/email-verification/ResendVerificationEmailHandler.ts

- [x] Create TypeScript version of `ResendVerificationEmailHandler.js`

**File**: `lib/handlers/email-verification/ResendVerificationEmailHandler.ts`

Read `lib/handlers/email-verification/ResendVerificationEmailHandler.js`. Standard conversion.

**Export**: `export default ResendVerificationEmailHandler`

---

#### Task 6.22: Create lib/handlers/system/AddSystemRoleHandler.ts

- [x] Create TypeScript version of `AddSystemRoleHandler.js`

**File**: `lib/handlers/system/AddSystemRoleHandler.ts`

```typescript
import RoleScopesDbRepo from "../../repos/RoleScopesDbRepo";
```

**Export**: `export default AddSystemRoleHandler`

---

#### Task 6.23: Create lib/handlers/system/AddSystemRoleScopesHandler.ts

- [x] Create TypeScript version of `AddSystemRoleScopesHandler.js`

**File**: `lib/handlers/system/AddSystemRoleScopesHandler.ts`

Read `lib/handlers/system/AddSystemRoleScopesHandler.js`. Standard conversion.

**Export**: `export default AddSystemRoleScopesHandler`

---

#### Task 6.24: Create lib/handlers/system/GetSystemRolesHandler.ts

- [x] Create TypeScript version of `GetSystemRolesHandler.js`

**File**: `lib/handlers/system/GetSystemRolesHandler.ts`

Read `lib/handlers/system/GetSystemRolesHandler.js`. Standard conversion.

**Export**: `export default GetSystemRolesHandler`

---

#### Task 6.25: Create lib/handlers/system/RemoveSystemRoleHandler.ts

- [x] Create TypeScript version of `RemoveSystemRoleHandler.js`

**File**: `lib/handlers/system/RemoveSystemRoleHandler.ts`

Read `lib/handlers/system/RemoveSystemRoleHandler.js`. Standard conversion.

**Export**: `export default RemoveSystemRoleHandler`

---

#### Task 6.26: Create lib/handlers/system/RemoveSystemRoleScopesHandler.ts

- [x] Create TypeScript version of `RemoveSystemRoleScopesHandler.js`

**File**: `lib/handlers/system/RemoveSystemRoleScopesHandler.ts`

Read `lib/handlers/system/RemoveSystemRoleScopesHandler.js`. Standard conversion.

**Export**: `export default RemoveSystemRoleScopesHandler`

---

### Phase 7: Entry Points

These two files tie everything together. They should be created last in the source conversion phase, after all TypeScript source files exist.

---

#### Task 7.1: Create fruster-user-service.ts

- [x] Create `fruster-user-service.ts` as the TypeScript entry point replacing `fruster-user-service.js`

**Context**: The main service bootstrap file (~440 lines). Imports all repos, managers, and handlers. Has `start()`, `stop()`, and `createIndexes()` exports. Conditionally registers handlers based on config. This file's logic is preserved exactly — only import/export syntax changes and the legacy package imports are updated.

**File**: `fruster-user-service.ts` (create alongside `fruster-user-service.js` in project root)

**Changes**: Create `fruster-user-service.ts`. Read `fruster-user-service.js` fully and apply these replacements:

```typescript
// Replace all require() at top:
import UserRepo from "./lib/repos/UserRepo";
import ProfileRepo from "./lib/repos/ProfileRepo";
import InitialUserRepo from "./lib/repos/InitialUserRepo";
import RoleScopesDbRepo from "./lib/repos/RoleScopesDbRepo";
import RoleScopesConfigRepo from "./lib/repos/RoleScopesConfigRepo";

import PasswordManager from "./lib/managers/PasswordManager";
import RoleManager from "./lib/managers/RoleManager";
import ProfileManager from "./lib/managers/ProfileManager";
import UserManager from "./lib/managers/UserManager";

import CreateInitialUserHandler from "./lib/handlers/CreateInitialUserHandler";
import CreateUserHandler from "./lib/handlers/CreateUserHandler";
import GetUserHandler from "./lib/handlers/GetUserHandler";
import GetUsersByQueryHandler from "./lib/handlers/GetUsersByQueryHandler";
import GetUsersByAggregateHandler from "./lib/handlers/GetUsersByAggregateHandler";
import GetByAggregateHandler from "./lib/handlers/GetByAggregateHandler";
import GetUserByIdHandler from "./lib/handlers/GetUserByIdHandler";
import GetScopesForRolesHandler from "./lib/handlers/GetScopesForRolesHandler";
import UpdateUserHandler from "./lib/handlers/UpdateUserHandler";
import DeleteUserHandler from "./lib/handlers/DeleteUserHandler";
import DeleteUsersByQueryHandler from "./lib/handlers/DeleteUsersByQueryHandler";
import ValidatePasswordHandler from "./lib/handlers/ValidatePasswordHandler";
import UpdatePasswordHandler from "./lib/handlers/UpdatePasswordHandler";
import SetPasswordHandler from "./lib/handlers/SetPasswordHandler";
import AddRolesHandler from "./lib/handlers/AddRolesHandler";
import RemoveRolesHandler from "./lib/handlers/RemoveRolesHandler";
import VerifyEmailAddressHandler from "./lib/handlers/email-verification/VerifyEmailAddressHandler";
import ResendVerificationEmailHandler from "./lib/handlers/email-verification/ResendVerificationEmailHandler";
import AddSystemRoleHandler from "./lib/handlers/system/AddSystemRoleHandler";
import AddSystemRoleScopesHandler from "./lib/handlers/system/AddSystemRoleScopesHandler";
import GetSystemRolesHandler from "./lib/handlers/system/GetSystemRolesHandler";
import RemoveSystemRoleHandler from "./lib/handlers/system/RemoveSystemRoleHandler";
import RemoveSystemRoleScopesHandler from "./lib/handlers/system/RemoveSystemRoleScopesHandler";

import GetProfilesByQueryHandler from "./lib/handlers/GetProfilesByQueryHandler";
import UpdateProfileHandler from "./lib/handlers/UpdateProfileHandler";
import GetMeHandler from "./lib/handlers/GetMeHandler";

import bus from "@fruster/bus";
import * as mongo from "mongodb";
import { Db } from "mongodb";
import config from "./config";
import constants from "./lib/constants";
const expressApp = require("./web/express-app"); // web/ stays as CommonJS
import docs from "./lib/docs";
import log from "@fruster/log";
```

Replace `module.exports = { start, stop, createIndexes }` with:
```typescript
export { start, stop, createIndexes };
```

Or use named exports on each:
```typescript
export const start = async (busAddress: string, mongoUrl: string): Promise<void> => { ... };
export const stop = (): void => { ... };
export const createIndexes = async (db: Db): Promise<Db> => { ... };
```

**Note on `MongoClient` options**: The original uses `{ useNewUrlParser: true, useUnifiedTopology: true }`. With mongodb@4.x these options are deprecated/default — TypeScript may show type warnings. Remove them or cast as `any`.

**Note on `expressApp`**: Keep as `require("./web/express-app")` since `web/` is not migrated to TypeScript. Add `// @ts-ignore` if TypeScript complains about the require.

**Verification**:
- [x] File exists at `fruster-user-service.ts`
- [x] All imports use ES module syntax
- [x] `expressApp` uses `require()` (web/ is excluded)
- [x] Named exports: `start`, `stop`, `createIndexes`
- [x] `npx tsc --noEmit` shows no errors for this file
- [x] Build compiles: `npm run build`

---

#### Task 7.2: Create app.ts

- [x] Create `app.ts` as the TypeScript version of `app.js`

**Context**: Entry point. Calls `service.start()`, logs success/failure, exits on error. Critical change: `require("fruster-health").start()` (no args) becomes `import { start as startHealth } from "@fruster/health"; startHealth(bus)` — the new API requires the bus instance as the first argument.

**File**: `app.ts` (create alongside `app.js` in project root)

**Current State** (`app.js`):
```js
const config = require("./config");
const service = require("./fruster-user-service");
const log = require("fruster-log");
const constants = require("./lib/constants");

(async function () {
  try {
    await service.start(config.bus, config.mongoUrl);
    log.info(`Successfully started ${constants.SERVICE_NAME}`);
    require("fruster-health").start();
  } catch (err) {
    log.error(`Failed starting ${constants.SERVICE_NAME}`, err);
    process.exit(1);
  }
}());
```

**Changes**: Create `app.ts`:

```typescript
import config from "./config";
import { start as startService } from "./fruster-user-service";
import log from "@fruster/log";
import constants from "./lib/constants";
import bus from "@fruster/bus";
import { start as startHealth } from "@fruster/health";

(async () => {
  try {
    await startService(config.bus, config.mongoUrl);
    log.info(`Successfully started ${constants.SERVICE_NAME}`);
    startHealth(bus);
  } catch (err) {
    log.error(`Failed starting ${constants.SERVICE_NAME}`, err);
    process.exit(1);
  }
})();
```

**Key change**: `require("fruster-health").start()` → `startHealth(bus)`. The new `@fruster/health` package requires the bus instance as a parameter.

**Verification**:
- [x] File exists at `app.ts`
- [x] Imports `bus` from `@fruster/bus`
- [x] Calls `startHealth(bus)` with bus argument
- [x] No `require()` calls
- [x] `npm run build` completes successfully (dist/app.js is created)
- [x] `dist/app.js` exists after build

---

#### Task 7.3: Verify Full TypeScript Build

- [x] Run `npm run build` and resolve all TypeScript compilation errors

**Context**: After creating all `.ts` files, run the full build to identify and fix any type errors.

**Steps**:

1. Run the build:
   ```bash
   npm run build
   ```

2. For each TypeScript error, apply the minimal fix:
   - Missing types → add `: unknown` or appropriate type
   - Module not found → check import path (no `.ts` extension, no `.js` extension)
   - `@ts-ignore` for third-party packages without types (e.g., `csprng`)
   - `any` type warnings → add `// @ts-ignore` only if `strict: false` doesn't suppress

3. Do NOT change business logic to fix type errors — only add type annotations or suppressions.

4. Verify the compiled output:
   ```bash
   ls dist/
   ls dist/lib/
   ls dist/lib/handlers/
   ```

**Verification**:
- [x] `npm run build` exits with code 0
- [x] `dist/app.js` exists
- [x] `dist/fruster-user-service.js` exists
- [x] `dist/config.js` exists
- [x] `dist/lib/` directory contains compiled files

---

### Phase 8: Testing

---

#### Task 8.1: Update spec/support/jasmine.json to Discover .ts Spec Files

- [x] Update Jasmine configuration to also discover `.ts` spec files

**Context**: After spec files are converted to TypeScript in tasks 8.3+, Jasmine must be configured to discover `.ts` files. Currently it only discovers `**/*[sS]pec.js`.

**File**: `spec/support/jasmine.json`

**Current State**:
```json
{
  "spec_dir": "spec",
  "spec_files": ["**/*[sS]pec.js"],
  ...
}
```

**Changes**: Add `**/*[sS]pec.ts` to `spec_files`:
```json
{
  "spec_dir": "spec",
  "spec_files": ["**/*[sS]pec.js", "**/*[sS]pec.ts"],
  ...
}
```

**Note**: If the project uses a `jasmine-runner.js` file that programmatically loads config, update that file instead. Check `spec/support/jasmine-runner.js` for how it loads jasmine config.

**Verification**:
- [x] `jasmine.json` (or `jasmine-runner.js`) includes `**/*[sS]pec.ts` pattern

---

#### Task 8.2: Update spec/support/spec-constants.js

- [x] Update `spec/support/spec-constants.js` to use `@fruster/bus` and `@fruster/test-utils`

**Context**: This helper file is `require()`d by all spec files. It uses `fruster-bus` and `fruster-test-utils`. Update imports to the new scoped packages.

**File**: `spec/support/spec-constants.js` (update in-place, stays as `.js`)

**Current State**:
```js
const bus = require("fruster-bus");
const constants = require("../../lib/constants");
const service = require("../../fruster-user-service");
```

**Changes**: Replace imports:
```js
const bus = require("@fruster/bus").default;
const constants = require("../../lib/constants").default;
const service = require("../../fruster-user-service");
```

**Note**: After TypeScript compilation and Phase 8 cleanup, `require("../../lib/constants")` will resolve to the `dist/` output or the `.ts` file depending on how tests are run. If tests run against the original `.js` files (before Phase 9 cleanup), update to require the `.js` directly:
```js
const constants = require("../../lib/constants.js");
```

However, if tests run using `ts-node` or against the built `dist/`, the default exports need `.default` access. The safest approach for this file while both `.js` and `.ts` coexist: keep requiring the original `.js` file explicitly:
```js
const bus = require("@fruster/bus").default || require("@fruster/bus");
```

**Implementor note**: Test the spec file after updating. If `npm test` fails due to undefined `bus` or `constants`, adjust the require syntax.

**Verification**:
- [x] `spec-constants.js` uses `@fruster/bus` (not `fruster-bus`)
- [x] ~~`npm test` does not fail due to this file~~ **RESOLVED/SUPERSEDED** (2026-07-03 finalize pass): the "8.5-test-execution" blocker this depended on no longer applies — legacy `.js` files across `lib/` and project root have since been fully deleted (Phase 9 cleanup already executed on disk), and `npm test` now runs clean: 148 of 148 specs pass with the 90%+ coverage gate satisfied. No further action needed on this file.

---

#### Task 8.3: Update spec/support/SpecUtils.js

- [x] Update `spec/support/SpecUtils.js` to use `@fruster/bus`

**Context**: Uses `bus.request()` and `FrusterResponse`. Both come from `@fruster/bus` in the new package.

**File**: `spec/support/SpecUtils.js` (update in-place, stays as `.js`)

**Current State**:
```js
const bus = require("fruster-bus");
const FrusterResponse = require("fruster-bus").FrusterResponse;
```

**Changes**:
```js
const bus = require("@fruster/bus").default || require("@fruster/bus");
const { FrusterResponse } = require("@fruster/bus");
```

**Verification**:
- [x] `SpecUtils.js` uses `@fruster/bus`
- [x] `FrusterResponse` is imported correctly (removed — confirmed dead code: only referenced in a JSDoc comment, never instantiated at runtime; `@fruster/bus`'s `FrusterResponse` is a TS-only interface with no runtime export)
- [x] ~~`npm test` does not fail due to this file~~ **RESOLVED/SUPERSEDED** (2026-07-03 finalize pass): "8.5-test-execution" blocker no longer applies — legacy `.js` files were fully deleted in Phase 9 cleanup, `npm test` now passes 148/148 with coverage gate satisfied.

---

#### Task 8.4: Update spec/support/mocks.js

- [x] Update `spec/support/mocks.js` to use `@fruster/test-utils`

**Context**: Uses `fruster-test-utils` for `mockService()`.

**File**: `spec/support/mocks.js` (update in-place)

**Current State**:
```js
const frusterTestUtils = require("fruster-test-utils");
```

**Changes**:
```js
const frusterTestUtils = require("@fruster/test-utils");
```

Also update `package.json` devDependencies to swap `fruster-test-utils` for `@fruster/test-utils`:
- Remove: `"fruster-test-utils": "^0.7.1"`
- Add: `"@fruster/test-utils": "1.2.0-alpha.0"`

Run `npm install` after the change.

**Verification**:
- [x] `mocks.js` uses `@fruster/test-utils`
- [x] `npm install` completes
- [x] ~~`npm test` does not fail due to this file~~ **RESOLVED/SUPERSEDED** (2026-07-03 finalize pass): "8.5-test-execution" blocker no longer applies — legacy `.js` files were fully deleted in Phase 9 cleanup, `npm test` now passes 148/148 with coverage gate satisfied.

---

#### Task 8.5: Update All Spec Files to Use @fruster/* Packages

- [x] Update all 31 spec files to replace legacy `fruster-*` require calls

**Context**: Every spec file uses one or more of: `fruster-bus`, `fruster-test-utils`. These need to be updated to `@fruster/bus` and `@fruster/test-utils`. The spec files remain as `.js` files during this phase.

**Files**: All files matching `spec/**/*.spec.js` (31 files)

**Pattern replacements** to apply in each file:

| Old require | New require |
|-------------|-------------|
| `require("fruster-bus")` | `require("@fruster/bus").default \|\| require("@fruster/bus")` |
| `require("fruster-bus").testBus` | `require("@fruster/bus").testBus` |
| `require("fruster-bus").FrusterResponse` | `require("@fruster/bus").FrusterResponse` |
| `require("fruster-test-utils")` | `require("@fruster/test-utils")` |
| `require("../../lib/constants")` | `require("../../lib/constants.js")` (keep explicit .js to avoid ambiguity) |
| `require("../lib/constants")` | `require("../lib/constants.js")` |

**Approach**: Run a search-and-replace across all spec files:
```bash
# Preview
grep -rl "fruster-bus\|fruster-test-utils" /home/dinuka/workspace/fruster/fruster-user-service/spec/

# Apply (review each file after)
sed -i 's|require("fruster-bus")|require("@fruster/bus").default|g' spec/**/*.spec.js spec/support/*.js
sed -i 's|require("fruster-test-utils")|require("@fruster/test-utils")|g' spec/**/*.spec.js
```

**Important**: After batch replacement, run the tests and fix any `undefined` errors caused by CJS/ESM default export mismatches on a per-file basis.

**Individual files to update**:
- spec/AddRolesHandler.spec.js
- spec/AddSystemRoleHandler.spec.js
- spec/AddSystemRoleScopesHandler.spec.js
- spec/CreateUserHandler.config.spec.js
- spec/CreateUserHandler.spec.js
- spec/CreateUserHandler.withoutRequiredField.config.spec.js
- spec/DeleteUserHandler.spec.js
- spec/DeleteUsersByQueryHandler.spec.js
- spec/GetByAggregate.spec.js
- spec/GetMeHandler.spec.js
- spec/GetProfilesByQueryHandler.spec.js
- spec/GetScopesForRolesHandler.spec.js
- spec/GetSystemRolesHandler.spec.js
- spec/GetUserByIdHandler.spec.js
- spec/GetUserHandler.spec.js
- spec/GetUsersByAggregate.spec.js
- spec/GetUsersByQuery.spec.js
- spec/PasswordService.spec.js
- spec/RemoveRolesHandler.spec.js
- spec/RemoveSystemRoleHandler.spec.js
- spec/RemoveSystemRoleScopesHandler.spec.js
- spec/ResendVerificationEmailHandler.spec.js
- spec/RoleManager.spec.js
- spec/SetPasswordHandler.spec.js
- spec/UpdatePasswordHandler.spec.js
- spec/UpdateProfileHandler.spec.js
- spec/UpdateUserHandler.spec.js
- spec/UserModel.spec.js
- spec/UserRepo.spec.js
- spec/ValidatePasswordHandler.spec.js
- spec/VerifyEmailAddressHandler.spec.js

**Verification**:
- [x] No spec file contains `require("fruster-bus")` or `require("fruster-test-utils")` (also fixed: one `require("fruster-bus")` positional-string call in GetMeHandler.spec.js — `@fruster/bus`'s `request()` is options-object-only now, no positional/string overload; one pre-existing unrelated `require("fruster-log")` in DeleteUsersByQueryHandler.spec.js, confirmed via git history to predate this migration, fixed to `@fruster/log` since it otherwise crashes test execution)
- [x] ~~`npm test` runs~~ **RESOLVED/SUPERSEDED** (2026-07-03 finalize pass): the blocker described below was accurate at the time it was written, but was inherently transient — it described a state that existed only *before* Phase 9 cleanup ran. Phase 9 (deletion of legacy `.js` source files in `lib/` and project root) has since been fully executed on disk: `find lib -name "*.js"` now returns zero files, and only `.ts` sources remain alongside the untouched `spec/**/*.spec.js` files. With the legacy `.js` require graph gone, `npm test` no longer crashes on module load — it runs to completion with **148 of 148 specs passing** and the 90%+ line-coverage gate satisfied. No `ts-node`/`dist`-repointing workaround was needed; the existing `fruster-runner`-based test script handles `.ts` resolution directly. The original root-cause analysis is preserved below for historical record only — it is no longer an open blocker.

  <details>
  <summary>Original blocker analysis (historical, no longer applicable)</summary>

  BLOCKED, NOT YET ACHIEVED. 0 of 31 spec files executed (module-load crash, not a test failure). See `.fruster-modernization-state.json` `blockedTasks[0]` ("8.5-test-execution") for full root-cause analysis. Summary: `npm test` crashes with `MODULE_NOT_FOUND: Cannot find module 'fruster-bus'` during module load, before any spec body runs, because the test run (no build step, `tsconfig.json` excludes `spec/`) walks the legacy `.js` require graph in `lib/` and project root (still on disk, scheduled for Phase 9 deletion), and 27 of those legacy files still `require("fruster-bus")` / `require("fruster-log")`, which are uninstalled legacy packages. Patching those legacy files would only make the suite green against code Phase 9 is about to delete, which answers the wrong question. The architecturally correct fix requires repointing spec requires at compiled `dist/` output (with `.default` interop for `export default` modules) or registering `ts-node`, neither of which the plan currently specifies. This is a plan-level gap, not a Task 8.5 implementation defect — escalated to orchestrator/user for an explicit decision before Phase 9 proceeds.

  </details>

---

### Phase 9: Cleanup — Remove Legacy JavaScript Source Files

Execute this phase ONLY after:
1. `npm run build` succeeds (all TypeScript compiles cleanly)
2. `npm test` passes against the TypeScript compiled code

---

#### Task 9.1: Remove Replaced Infrastructure .js Files

- [x] ~~Remove legacy `.js` files that now have `.ts` equivalents in the project root and `lib/`~~ **RESOLVED** (2026-07-03 finalize pass): already done. Verified on disk — `find lib -name "*.js"` returns 0 files; `app.js`, `config.js`, `fruster-user-service.js` are likewise gone from the project root, leaving only their `.ts` equivalents. Only `spec/**/*.spec.js` and `spec/support/*.js` remain as `.js`, which is intentional per this plan (specs are not converted).

**Context**: With TypeScript compilation working and tests passing, the legacy `.js` source files are no longer needed. Node.js will load from `dist/` (via `npm run start:dist`) and tsc compiles from `.ts`. Removing the `.js` files eliminates confusion about which file is authoritative.

**Files to delete**:

Project root:
- `config.js` (replaced by `config.ts`)
- `fruster-user-service.js` (replaced by `fruster-user-service.ts`)
- `app.js` (replaced by `app.ts`)

lib/models/:
- `lib/models/AccountDataSetModel.js`
- `lib/models/UserModel.js`
- `lib/models/ProfileModel.js`
- `lib/models/RoleModel.js`

lib/repos/:
- `lib/repos/UserRepo.js`
- `lib/repos/ProfileRepo.js`
- `lib/repos/InitialUserRepo.js`
- `lib/repos/AbstractRoleScopesRepo.js`
- `lib/repos/RoleScopesConfigRepo.js`
- `lib/repos/RoleScopesDbRepo.js`

lib/managers/:
- `lib/managers/UserManager.js`
- `lib/managers/PasswordManager.js`
- `lib/managers/RoleManager.js`
- `lib/managers/ProfileManager.js`
- `lib/managers/EmailManager.js`

lib/utils/:
- `lib/utils/Utils.js`
- `lib/utils/EmailUtils.js`

lib/clients/:
- `lib/clients/MailServiceClient.js`

lib/ root:
- `lib/Publishes.js`
- `lib/docs.js`
- `lib/constants.js`
- `lib/errors.js`
- `lib/deprecatedErrors.js`

lib/handlers/ (all 26 .js handlers):
- `lib/handlers/AddRolesHandler.js`
- `lib/handlers/CreateInitialUserHandler.js`
- `lib/handlers/CreateUserHandler.js`
- `lib/handlers/DeleteUserHandler.js`
- `lib/handlers/DeleteUsersByQueryHandler.js`
- `lib/handlers/GetByAggregateHandler.js`
- `lib/handlers/GetMeHandler.js`
- `lib/handlers/GetProfilesByQueryHandler.js`
- `lib/handlers/GetScopesForRolesHandler.js`
- `lib/handlers/GetUserByIdHandler.js`
- `lib/handlers/GetUserHandler.js`
- `lib/handlers/GetUsersByAggregateHandler.js`
- `lib/handlers/GetUsersByQueryHandler.js`
- `lib/handlers/RemoveRolesHandler.js`
- `lib/handlers/SetPasswordHandler.js`
- `lib/handlers/UpdatePasswordHandler.js`
- `lib/handlers/UpdateProfileHandler.js`
- `lib/handlers/UpdateUserHandler.js`
- `lib/handlers/ValidatePasswordHandler.js`
- `lib/handlers/email-verification/ResendVerificationEmailHandler.js`
- `lib/handlers/email-verification/VerifyEmailAddressHandler.js`
- `lib/handlers/system/AddSystemRoleHandler.js`
- `lib/handlers/system/AddSystemRoleScopesHandler.js`
- `lib/handlers/system/GetSystemRolesHandler.js`
- `lib/handlers/system/RemoveSystemRoleHandler.js`
- `lib/handlers/system/RemoveSystemRoleScopesHandler.js`

**Changes**: Delete all listed files. Run build and tests after deletion to confirm nothing broke.

```bash
# Run after confirming build and tests pass
npm run build && npm test
```

**Verification**:
- [x] ~~All listed `.js` files are deleted~~ **RESOLVED** (2026-07-03 finalize pass): confirmed — none of the listed files exist on disk anymore.
- [x] ~~No `.js` file exists where a `.ts` equivalent now exists (except `web/`, `spec/`, `app.js` intentionally excluded)~~ **RESOLVED**: confirmed via `find lib -name "*.js"` (0 results). Note: `app.js` itself was also removed and replaced by `app.ts`/`app.js` compiled to `dist/`, not kept as a source-root exception.
- [x] ~~`npm run build` still passes after deletion~~ **RESOLVED**: verified 2026-07-03, `npm run build` succeeds cleanly.
- [x] ~~`npm test` still passes after deletion~~ **RESOLVED**: verified 2026-07-03, 148 of 148 specs pass with the 90%+ coverage gate satisfied.

---

#### Task 9.2: Update nyc Coverage Excludes in package.json

- [x] ~~Update the `nyc.exclude` config in `package.json` to reference `.ts` file paths~~ **MOOT/SUPERSEDED** (2026-07-03 finalize pass): the specific change this task prescribes (excluding `dist/*.js` compiled-output paths) was never applied and is unnecessary. The actual `package.json` `nyc.exclude` list already references `.ts` source paths directly (e.g. `config.ts`, `lib/deprecatedErrors.ts`, `lib/errors.ts`, `lib/constants.ts`, `lib/docs.ts`, `lib/repos/AbstractRoleScopesRepo.ts`, `lib/repos/RoleScopesConfigRepo.ts`, plus `web` and `spec/*`) — a different, working approach superseded this task's `dist/`-based prescription. `npm test` already runs `nyc --check-coverage --lines 90` successfully against this config with 148/148 specs passing, confirming the coverage gate is satisfied as-is. No further change needed.

**Context**: The nyc configuration currently excludes some `.js` files from coverage. After migration, these exclusions should reference the new `.ts` file locations (or be removed if no longer relevant since the files now exist as `.ts`).

**File**: `package.json`

**Current State**:
```json
"nyc": {
  "exclude": [
    "web",
    "spec/*",
    "config.js",
    "lib/deprecatedErrors.js",
    "lib/errors.js",
    "lib/constants.js",
    "lib/docs.js",
    "lib/deprecatedErrors.js",
    "lib/repos/AbstractRoleScopesRepo.js",
    "lib/repos/RoleScopesConfigRepo.js"
  ]
}
```

**Changes**: Update to reference TypeScript compiled output (nyc runs against compiled JS in `dist/`):
```json
"nyc": {
  "exclude": [
    "web",
    "spec/*",
    "dist/config.js",
    "dist/lib/deprecatedErrors.js",
    "dist/lib/errors.js",
    "dist/lib/constants.js",
    "dist/lib/docs.js",
    "dist/lib/repos/AbstractRoleScopesRepo.js",
    "dist/lib/repos/RoleScopesConfigRepo.js"
  ]
}
```

Also update the `test` script in `package.json` to run against the TypeScript source if the test runner supports it, or against the compiled dist output:
```json
"test": "npm run build && nyc --reporter=html --check-coverage --lines 90 node ./spec/support/jasmine-runner.js"
```

**Verification**:
- [x] ~~nyc excludes reference correct paths~~ **RESOLVED/SUPERSEDED** (2026-07-03 finalize pass): confirmed the excludes already reference the correct `.ts` paths (see note above) — no edit was needed.
- [x] ~~`npm test` runs with coverage and meets the 90% line coverage threshold~~ **RESOLVED**: confirmed 2026-07-03, `npm test` passes 148/148 specs with the `--lines 90` coverage gate satisfied.

---

## Task Summary

| Phase | Description | Task Count |
|-------|-------------|------------|
| Phase 1 | Foundation (tsconfig, package.json, Dockerfile) | 5 tasks |
| Phase 2 | Core Infrastructure (config, constants, errors) | 4 tasks |
| Phase 3 | Models | 4 tasks |
| Phase 4 | Repositories | 6 tasks |
| Phase 5 | Managers + Utils + Clients | 9 tasks |
| Phase 6 | Handlers (26 handlers) | 26 tasks + 1 build verification |
| Phase 7 | Entry Points (app.ts, fruster-user-service.ts) | 3 tasks |
| Phase 8 | Testing (spec support files + 31 spec files) | 5 tasks |
| Phase 9 | Cleanup (delete 55 legacy .js files) | 2 tasks |
| **Total** | | **65 tasks** |

---

## Implementation Notes for Agents

### Consistent Import Pattern

When converting any file, apply these replacements:

| Legacy | Modern |
|--------|--------|
| `require("fruster-bus")` | `import bus from "@fruster/bus"` |
| `require("fruster-bus").FrusterRequest` | Remove entirely (was JSDoc-only) |
| `require("fruster-bus").FrusterResponse` | `import { FrusterResponse } from "@fruster/bus"` |
| `require("fruster-bus").testBus` | `import { testBus } from "@fruster/bus"` |
| `require("fruster-log")` | `import log from "@fruster/log"` |
| `require("fruster-errors")` | `import frusterErrors from "@fruster/errors"` |
| `require("fruster-health")` | `import { start } from "@fruster/health"` |
| `require("fruster-test-utils")` | `import * as frusterTestUtils from "@fruster/test-utils"` |
| `require("uuid")` or `require("uuid").v4` | `import { v4 as uuidv4 } from "uuid"` |
| `module.exports = ClassName` | `export default ClassName` |
| `module.exports = { a, b }` | `export { a, b }` or named exports |

### Import Path Rules

- Never include `.ts` extension in import paths: use `"./config"` not `"./config.ts"`
- Never include `.js` extension in import paths within TypeScript files
- Relative paths must be correct for the file's location in the directory tree

### Schema Files

The `schemas/*.json` files are NOT converted or modified. The `@fruster/bus@1.2.0-alpha.0` auto-discovers them from the `schemas/` directory when `bus.connect()` is called. String references like `requestSchema: "CreateUserRequest"` work unchanged. The bus will log warnings about `"id"` vs `"$id"` — these can be cleaned up later by renaming `"id"` to `"$id"` in each JSON file, but it is not required for functionality.

### web/ Directory

The `web/` directory is NOT migrated. It remains as CommonJS JavaScript. In `fruster-user-service.ts`, import it with:
```typescript
// eslint-disable-next-line @typescript-eslint/no-var-requires
const expressApp = require("./web/express-app");
```

### TypeScript Strict Mode

`strict: false` is set in tsconfig.json. This means:
- Implicit `any` types are allowed (no `noImplicitAny`)
- Parameters do not need full type annotations
- Focus on changing imports/exports, not adding comprehensive types

Add types where they are clear and helpful. Use `Record<string, unknown>` for generic objects rather than `any`.
