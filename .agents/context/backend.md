# CKC IT Club Backend Context

## Purpose

- This folder is the Laravel backend for the CKC IT Club system.
- It currently acts as an API backend for two frontend clients:
- `frontend/admin`: admin dashboard.
- `frontend/user`: public/user-facing frontend.
- The most complete backend flow today is admin-side management of users, academic reference data, and club recruitment applications.

## Read This First

- Treat this file as the backend source-of-truth for agent work.
- Do not trust `backend/README.md` or the root `README.md` blindly. Both still contain generic Laravel text and at least one stale setup step.
- Prefer reading actual code in `routes/`, `app/Http/Controllers/`, `app/Models/`, `database/migrations/`, and `database/seeders/`.

## Maintenance Rule

- Any agent that changes backend behavior MUST review and update this file before finishing work.
- Update this file when any of these change:
- route surface
- auth or authorization behavior
- middleware registration
- database schema or relationships
- seed data assumptions
- environment variables
- deployment flow
- folder structure or source-of-truth files
- If a code change does not affect behavior or operational context, no content rewrite is required, but the agent should still check whether the existing text remains accurate.
- Keep updates short and factual. Do not turn this file into a full changelog of code diffs.

## Stack

- Framework: Laravel 12.
- PHP: `^8.2` in Composer. Docker image currently uses PHP `8.4-fpm-alpine`.
- Auth: Laravel Sanctum personal access tokens.
- OAuth: Laravel Socialite with Google provider.
- Roles: `spatie/laravel-permission`.
- Database: MySQL by default.
- Frontend asset tooling inside backend: Vite + Tailwind 4, but backend is API-first.

## Main Business Scope Right Now

- Google OAuth login for admin and user flows.
- Admin authenticated API for:
- dashboard health access.
- user listing.
- faculty, major, school class listing with search and pagination.
- club application listing and status transitions.
- application question CRUD and reorder.
- Recruitment domain is the strongest implemented domain in this backend.

## What Is Actually Implemented

- Public API routes:
- `GET /api/v1/health`
- `GET /api/v1/auth/verify-token`
- Authenticated API routes under Sanctum:
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/logout-all`
- `GET /api/v1/`
- `GET /api/v1/users`
- `GET /api/v1/faculties`
- `GET /api/v1/majors`
- `GET /api/v1/roles`
- `GET /api/v1/school-classes`
- `GET /api/v1/club-applications`
- `PATCH /api/v1/club-applications/{clubApplication}/status`
- `PATCH /api/v1/application-questions/reorder`
- REST resource routes for `application-questions`
- Web routes used for OAuth:
- `GET /admin/auth/google`
- `GET /user/auth/google`
- `GET /auth/google/callback`

## Important Reality Checks

- Admin API routes are protected by `auth:sanctum`, but they are not additionally protected by explicit role middleware.
- Admin access is currently enforced mainly at OAuth login time in `AuthBaseController::handleAdmin()`.
- A user who already has a valid admin-issued token can access admin API routes without extra per-route role checks.
- Token expiration logic exists in `app/Http/Middleware/CheckTokenExpiration.php`, but this middleware is not registered in `bootstrap/app.php` and not attached to routes.
- `ApiVersion` middleware exists but is not applied anywhere in `routes/api.php`.
- Some files are scaffolding leftovers and not part of the current domain:
- `app/Http/Requests/Api/V1/Product/*`
- `app/Http/Resources/Api/V1/ProductResource.php`
- Some schema/models exist but currently have no active API/controller surface:
- `Contact`
- `ClubInformation`
- `ClubInformationValue`

## Backend Layout

- `app/Enums/`: centralized enums such as API messages, HTTP status, and roles.
- `app/Traits/ApiResponse.php`: standard JSON response helpers.
- `app/Http/Controllers/Auth/`: OAuth login, token verification, auth session endpoints.
- `app/Http/Controllers/Api/V1/Admin/`: current admin API surface.
- `app/Http/Requests/Api/V1/`: validation rules for request payloads.
- `app/Models/`: Eloquent models and relationships.
- `app/Http/Middleware/`: JSON forcing, locale selection, API version, token expiry check.
- `database/migrations/`: real schema definition.
- `database/seeders/`: dev/demo seed data.
- `routes/api.php`: API route source-of-truth.
- `routes/web.php`: OAuth web entrypoints.
- `config/`: auth, sanctum, cors, database, services, permission.
- `docker/` and `Dockerfile`: production-ish container flow for Render.

## Request and Response Conventions

- API responses are expected to be JSON.
- `ForceJsonResponse` middleware sets `Accept: application/json` for API requests.
- Most controllers use `BaseApiController` + `ApiResponse` trait for consistent response shape:
- success: `{ success: true, message, data }`
- paginated: `{ success: true, message, data, meta, links }`
- error: `{ success: false, message, errors? }`
- Localization is supported at API level through:
- query param `lang=en|vi`
- `Accept-Language` header

## Authentication Model

- Google OAuth redirects start on web routes, not API routes.
- Login type is stored in session before redirect:
- admin flow: `redirectAdmin()`
- user flow: `redirectUser()`
- Callback uses Socialite stateless user fetch, then branches by session `login_type`.
- Admin login is allowed only for users who already exist and have one of these roles:
- `admin`
- `president`
- `vice-president`
- `academic-head`
- `communications-head`
- `volunteer-head`
- User login can create a new `users` record automatically.
- New tokens are Sanctum personal access tokens.
- Token TTL is manually written to `personal_access_tokens.expires_at`:
- admin: 8 hours
- user: 24 hours
- Existing tokens are deleted on successful login before issuing a new one.

## Authorization Model

- Default role assignment happens automatically on new `User` creation via model boot hook.
- Default assigned role: `user`.
- Role seeding is handled in `database/seeders/RoleSeeder.php`.
- Route-level authorization is currently minimal.
- If you add sensitive admin endpoints, add explicit role/permission checks. Do not assume `auth:sanctum` is enough.

## Core Data Model

- `users`
- identity, OAuth provider data, profile fields, academic references, active flag.
- admin-created avatars are stored on Laravel `public` disk under `avatars/`, and the relative path is persisted in `users.avatar`.
- admin create-user flow now persists `gender` directly on the `users` table and assigns the selected Spatie roles from the submitted `roles` array.
- `User` API serialization formats `created_at` and `updated_at` as `d/m/Y` for frontend direct display.
- `roles`
- admin role create payload uses `label` for the display name, `name` for the internal value, and `is_system` as a boolean flag.
- belongs to `faculty`, `major`, `school class`.
- can create/update other records through `created_by` and `updated_by`.
- `faculties`
- top-level academic grouping.
- has many `majors`.
- `majors`
- belongs to one `faculty`.
- has many `school_classes`.
- `school_classes`
- belongs to one `major`.
- `club_applications`
- one application per applicant in current seeded/dev usage.
- applicant is stored in `created_by`.
- admin/editor is typically stored in `updated_by`.
- `application_questions`
- recruitment form question definitions.
- fields include `type`, `is_required`, `order_index`, `is_active`.
- supported types in current validation:
- `text`
- `textarea`
- `radio`
- `select`
- `application_question_options`
- options for `radio` and `select` questions.
- `application_answers`
- answer rows joining one application to one question.
- stores raw `answer_value`.
- `contacts`
- contact form-like table exists in schema and seeders, but there is no active controller/route surface.
- `club_informations` and `club_information_values`
- schema exists, but implementation is incomplete and not exposed.

## Recruitment Domain Rules

- Question CRUD lives in `ApplicationQuestionController`.
- Option rules:
- `radio` and `select` must have at least 2 options.
- option `label` and `value` must be non-blank.
- option values must be unique within a question.
- `text` and `textarea` must not receive options.
- Question deletion rule:
- a question with existing answers must not be deleted.
- if a used question needs to be hidden, current UX should prefer `is_active = false`.
- Question type mutation rule:
- if answers already exist, question `type` must not change.
- Reorder rule:
- reorder endpoint only requires a partial ordered list, then appends remaining question IDs in existing order.
- Club application status transitions are intentionally constrained:
- `pending -> processing`
- `processing -> interview`
- `interview -> passed | failed`
- `passed` and `failed` are terminal in current logic.

## Seeder Reality

- `DatabaseSeeder` currently runs:
- `RoleSeeder`
- `UserSeeder`
- `FacultySeeder`
- `MajorSeeder`
- `SchoolClassSeeder`
- `ContactSeeder`
- `ApplicationQuestionSeeder`
- `ApplicationQuestionOptionSeeder`
- `ClubApplicationSeeder`
- `ApplicationAnswerSeeder`
- There is no `FactoryDataSeeder`, even though the root `README.md` mentions it.
- `ApplicationQuestionSeeder` and `ApplicationQuestionOptionSeeder` look up `admin@gmail.com`.
- `ClubApplicationSeeder` creates `admin@gmail.com` if missing.
- `UserSeeder` seeds several admin emails, but not `admin@gmail.com`.
- Conclusion: do not “clean up” this mismatch casually. It currently works because `ClubApplicationSeeder` backfills `admin@gmail.com`.

## Setup and Run

- Backend install:

```bash
cd backend
composer install
npm install
cp .env.example .env
php artisan key:generate
```

- Required env categories:
- app URL and locale.
- MySQL connection.
- frontend URLs for CORS and OAuth postMessage redirects.
- Google OAuth credentials.
- Recommended dev bootstrap:

```bash
php artisan migrate:fresh --seed
php artisan storage:link
composer run dev
```

- `composer run dev` starts:
- Laravel dev server
- queue listener
- pail log tailing
- Vite dev server
- Health check:

```bash
curl http://localhost:8000/api/v1/health
```

## Environment Variables That Matter

- `APP_URL`
- `DB_*`
- `ADMIN_FRONTEND_URL`
- `USER_FRONTEND_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`
- `OAUTH_HTTP_VERIFY`
- `MYSQL_ATTR_SSL_CA` when using SSL-protected MySQL providers

## Docker and Deploy Notes

- There is a Dockerfile intended for Render-style deployment.
- Container startup script:
- can generate `APP_KEY` if missing.
- clears Laravel caches.
- optionally runs migrations and seeders with `RUN_MIGRATIONS=true` and `RUN_SEEDERS=true`.
- serves through nginx + php-fpm on `PORT`, default `10000`.

## Files Agents Should Prefer Reading Before Edits

- `routes/api.php`
- `routes/web.php`
- `bootstrap/app.php`
- `app/Http/Controllers/Auth/AuthBaseController.php`
- `app/Http/Controllers/Api/V1/Admin/ApplicationQuestionController.php`
- `app/Http/Controllers/Api/V1/Admin/ClubApplicationController.php`
- `app/Models/User.php`
- `app/Models/ClubApplication.php`
- `app/Models/ApplicationQuestion.php`
- `database/migrations/*application*`
- `database/migrations/*users*`
- `database/seeders/DatabaseSeeder.php`

## Safe Edit Rules For Agents

- Prefer extending existing admin controllers over inventing a parallel module structure.
- Preserve the response envelope from `ApiResponse` unless there is an explicit API contract change.
- When adding admin-only endpoints, add explicit authorization checks. The current codebase under-enforces authorization.
- When modifying application questions, preserve existing invariants around `type`, `options`, `answers`, and `order_index`.
- When touching OAuth flow, verify both popup `postMessage` behavior and redirect fallback behavior.
- Do not remove “unused-looking” schema or seeders without tracing whether frontend work is planned around them.
- Do not assume token expiration is enforced unless you also wire the middleware.
- Do not assume tests will catch regressions. Test coverage is effectively minimal.

## Common Task Playbooks

- Add a new authenticated admin endpoint:
- add route in `routes/api.php`
- create controller action under `app/Http/Controllers/Api/V1/Admin/`
- add a `FormRequest` if payload validation is non-trivial
- use `BaseApiController` response helpers
- add explicit role/permission protection if sensitive
- Add a new recruitment question type:
- update request validation rules
- update controller option-sync logic
- update frontend consumers
- check seeded data compatibility
- Add a public API:
- keep it outside the Sanctum middleware group
- decide whether locale support and JSON forcing are enough
- document exact response shape
- Strengthen auth security:
- consider registering `CheckTokenExpiration`
- add route-level admin role middleware or policy checks
- review `verify-token` contract with frontend before changing it

## Known Gaps and Debt

- Test suite is only Laravel example tests.
- Admin routes do not enforce role middleware.
- Token-expiry middleware exists but is unused.
- Version middleware exists but is unused.
- Generic Product request/resource files are leftover scaffolding.
- Contact and club information domains have schema presence but no real API surface yet.
- Root documentation is partially stale.

## Change Log

- `2026-04-07`: Initial backend context created after full backend audit. Captured actual route surface, auth model, recruitment rules, setup flow, known gaps, and agent editing rules.
