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
- contact listing and status updates.
- club application listing and status transitions.
- application question CRUD and reorder.
- Recruitment domain is the strongest implemented domain in this backend.

## What Is Actually Implemented

- Public API routes:
- `GET /api/v1/health`
- `GET /api/v1/auth/verify-token`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/admin/login`
- `POST /api/v1/contacts`
- Community public read routes under `/api/v1/community`: `GET /channels`, `GET /posts`, `GET /posts/{id}`, `GET /posts/{id}/comments`, `GET /blogs`, `GET /blog-tags`, `GET /blogs/{slug}`, and `GET /blogs/{id}/comments`.
- Authenticated API routes under Sanctum:
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/logout-all`
- `POST /api/v1/community/posts`
- `POST /api/v1/community/posts/{id}/reactions`
- `POST /api/v1/community/posts/{id}/comments`
- `POST /api/v1/community/blogs`
- `POST /api/v1/community/blogs/{id}/reactions`
- `POST /api/v1/community/blogs/{id}/comments`
- `GET /api/v1/`
- `GET /api/v1/users`
- `GET /api/v1/faculties`
- `GET /api/v1/faculties/trash`
- `PATCH /api/v1/faculties/{faculty}/restore`
- `DELETE /api/v1/faculties/{faculty}/force`
- `GET /api/v1/majors`
- `GET /api/v1/majors/trash`
- `PATCH /api/v1/majors/{major}/restore`
- `DELETE /api/v1/majors/{major}/force`
- `GET /api/v1/roles`
- `GET /api/v1/roles/{role}`
- `POST /api/v1/roles/{role}/permissions`
- `GET /api/v1/permissions`
- `PUT /api/v1/permissions/{permission}/roles`
- `GET /api/v1/school-classes`
- `GET /api/v1/school-classes/trash`
- `PATCH /api/v1/school-classes/{schoolClass}/restore`
- `DELETE /api/v1/school-classes/{schoolClass}/force`
- `POST /api/v1/academic-structure/import`
- `GET /api/v1/academic-structure/imports`
- `GET /api/v1/academic-structure/imports/stats`
- `GET /api/v1/academic-structure/imports/{academicStructureImport}/download`
- `GET /api/v1/contacts`
- `PATCH /api/v1/contacts/{contact}/status`
- `GET /api/v1/departments`
- `GET /api/v1/departments/trash`
- `POST /api/v1/departments`
- `GET /api/v1/departments/{department}`
- `PUT/PATCH /api/v1/departments/{department}`
- `DELETE /api/v1/departments/{department}`
- `PATCH /api/v1/departments/{department}/restore`
- `DELETE /api/v1/departments/{department}/force`
- `POST /api/v1/departments/{department}/users`
- `GET /api/v1/club-informations`
- `POST /api/v1/club-informations`
- `PUT/PATCH /api/v1/club-informations/{clubInformation}`
- `POST /api/v1/club-informations/{clubInformation}/values`
- `PATCH /api/v1/club-informations/{clubInformation}/values/{clubInformationValue}/default`
- `PUT/PATCH /api/v1/club-informations/{clubInformation}/values/{clubInformationValue}`
- `DELETE /api/v1/club-informations/{clubInformation}/values/{clubInformationValue}`
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
- Club information admin listing/detail exists, but create/update/delete flows are not complete yet.

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
- `docker/` and `Dockerfile`: container flow for local/container deployment and DigitalOcean App Platform services.
- Docker image installs `pcntl` because Reverb needs PHP signal constants when running its long-lived server.

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
- Credential user signup is available at `POST /api/v1/auth/register` and requires only `full_name`, `username`, `email`, `password`, and `password_confirmation`; new users are active by default and receive the default `user` role.
- New tokens are Sanctum personal access tokens.
- Token TTL is manually written to `personal_access_tokens.expires_at`:
- admin: 8 hours
- user: 24 hours
- Existing tokens are deleted on successful login before issuing a new one.

## Authorization Model

- Default role assignment happens automatically on new `User` creation via model boot hook.
- Default assigned role: `user`.
- Role seeding is handled in `database/seeders/RoleSeeder.php`.
- All admin-capable roles (`admin`, `president`, `vice-president`, `academic-head`, `communications-head`, `volunteer-head`) have `roles.view` so they can view the role list. Only roles explicitly granted `roles.manage` can create/update/delete roles or sync role permissions.
- Role-permission sync accepts an empty `permissions` array so a non-admin role can have all permissions removed; the `admin` role cannot have any currently assigned permission removed.
- Route-level authorization is currently minimal.
- If you add sensitive admin endpoints, add explicit role/permission checks. Do not assume `auth:sanctum` is enough.

## Core Data Model

- `users`
- identity, OAuth provider data, profile fields, academic references, active flag.
- admin-created avatars are stored on Laravel `public` disk under `avatars/`, and the relative path is persisted in `users.avatar`.
- admin create/update user flow persists `gender` and `is_active` directly on the `users` table and assigns the selected Spatie roles from the submitted `roles` array.
- when create/update user assigns a department head role (`academic-head`, `communications-head`, or `volunteer-head`), backend also attaches that user to the matching department if needed and removes that same head role from any other user; unrelated roles are preserved.
- `User` API serialization formats `created_at` and `updated_at` as `d/m/Y` for frontend direct display.
- `roles`
- admin role create payload uses `label` for the display name, `name` for the internal value, and `is_system` as a boolean flag.
- belongs to `faculty`, `major`, `school class`.
- can create/update other records through `created_by` and `updated_by`.
- `faculties`
- top-level academic grouping.
- has many `majors`.
- faculties use existing `deleted_at/deleted_by` columns for the admin trash workflow; they can be restored from `GET /faculties/trash` and permanently deleted from trash.
- `majors`
- belongs to one `faculty`.
- has many `school_classes`.
- majors use `deleted_at/deleted_by` for the admin trash workflow; they can be restored from `GET /majors/trash` and permanently deleted from trash.
- `school_classes`
- belongs to one `major`.
- school classes use `deleted_at/deleted_by` for the admin trash workflow; they can be restored from `GET /school-classes/trash` and permanently deleted from trash.
- `departments`
- club operating departments/ban records seeded for Học thuật, Truyền thông, and Tình nguyện.
- admins can list, fetch detail, create, update, soft-delete, restore, and permanently delete departments; users attach to departments through `department_user`.
- department soft delete uses `departments.deleted_at` and `deleted_by`; the trash endpoint is `GET /departments/trash`. A department can only be moved to trash when it has no members.
- department member management endpoints support adding members, changing whether a member is head of that department, and removing a member through `POST /departments/{department}/users`, `PATCH /departments/{department}/users/{user}`, and `DELETE /departments/{department}/users/{user}`; removing a head member also removes only that department's head role from the user.
- department heads are resolved from the member's normal Spatie user roles against `departments.head_role_id`; the seeded head roles are `academic-head`, `communications-head`, and `volunteer-head`.
- updating a department head assigns/removes only that department's configured head role on the user and does not sync or overwrite unrelated user roles, so one user can head multiple departments by holding multiple head roles.
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
- public contact submissions are created through `POST /api/v1/contacts`.
- public contact submission responses include the newly created contact with default `status` resolved as `pending`.
- admin can list contacts with pagination, search, sort, and status filtering.
- admin can update contact status through `PATCH /api/v1/contacts/{contact}/status`.
- `club_informations` and `club_information_values`
- admin can list club information records through `GET /api/v1/club-informations` with pagination, search, and sort.
- admin can create parent club information records through the resource `store` action; parent update is limited to `slug` and `description` because label, key, and type are treated as stable code contracts. Parent records are not deletable through the API, and `club_informations` no longer has a parent-level `is_active` column.
- admin can fetch one club information record through `GET /api/v1/club-informations/{id}`; nested `club_information_values` accept `search`, `sort`, and `order` query params for the detail table, including `alt`, `link`, and `position` sorting for media/banner values.
- admin can create, update, set a non-banner value as the default, and delete nested values through `/club-informations/{clubInformation}/values`; value payloads support long-text `value`, `link`, `alt`, integer/null `position`, and `is_active`; HTML values are not capped at 1000 characters.
- every parent club information record must keep at least one nested value, and active nested values are treated as the current/default values for that config. Active values cannot be deleted, and the final remaining value of a config cannot be deleted.
- for non-banner config types, activating one value or calling the default endpoint automatically deactivates sibling values. Banner configs can have multiple active values and are resolved by active values ordered by `position` then `id`; the default endpoint rejects banner configs.
- creating/updating club information records and creating/updating nested values dispatch database notifications to admin roles.
- `DatabaseSeeder` seeds demo club information keys and values for club name, slogan, email, about text, logo, home banners, Facebook page, and recruitment availability.
- `DatabaseSeeder` seeds the three default club departments: Ban Học thuật, Ban Truyền thông, and Ban Tình nguyện.
- `RoleSeeder` seeds the system/user roles, including the three department head roles referenced by `departments.head_role_id`.
- list responses serialize `created_at` and `updated_at` as `d/m/Y` for direct frontend display.
- `academic_structure_imports`
- admin academic structure import history for uploaded faculty/major/class files.
- valid imports support `.xlsx` and `.csv`; unsupported uploaded file extensions are stored as `file_type = Other`, `status = failed`, and returned as validation errors so the admin UI can show failed upload history.
- Community module:
- user-facing community routes expose published channels/posts/blogs, comments, and reactions under `/api/v1/community`.
- user-facing post list items include `content`, `excerpt`, and `is_excerpt_truncated` so the frontend can render collapsed Markdown and expand the full post content inline without navigating away.
- authenticated users can create published posts through `POST /api/v1/community/posts` with `channel_slug` or `channel_id`, `title`, `content`, optional `visibility`, and optional `media` image/video upload up to 20 MB. Uploaded post media is stored on the public disk under `community/posts/{post_id}`, mirrored into `posts.media_urls`, and tracked in `media_files`.
- `posts` now has schema support for author profile pinning (`is_pinned`, `pinned_at`), author-owned archiving through `status = archived`, soft delete metadata, and `visibility`; pinning is scoped to the post author's profile, not global community feed ordering. The backend must enforce a maximum of 3 pinned posts per author when the pin endpoint is implemented.
- `post_bookmarks` stores one saved post per user/post pair, while `post_reports` stores report reason/status/resolution metadata.
- `channels`, `posts`, `post_reports`, and `comments` support topic feeds, reports, nested comments, and soft-deleted comments.
- `reactions` is polymorphic by `target_type`/`target_id` for posts, comments, and blogs.
- authenticated users can create published blogs through `POST /api/v1/community/blogs` with `title`, `content`, optional `excerpt`, optional `tag_ids[]`, and optional `featured_image` image upload up to 5 MB. Uploaded blog cover images are stored on the public disk under `blog-covers`.
- `chat_rooms`, `chat_members`, and `messages` support direct/group chat, unread tracking through `last_read_at`, message replies, and soft-deleted messages.
- `blogs`, `tags`, and `blog_tags` support long-form posts with normalized blog tags.
- `media_files` stores shared uploads for posts, messages, and blogs.
- Community module tables are defined in separate table-specific migrations dated `2026_05_25_000010` through `2026_05_25_000023`, not one combined community migration.
- Community notification metadata is included on the Laravel `notifications` table (`recipient_id`, `actor_id`, `community_type`, `target_type`, `target_id`, `message`) so existing database notifications continue to work through `notifiable_*`, `data`, and `read_at`.

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
- `DepartmentSeeder`
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
- `BROADCAST_CONNECTION=reverb` plus `REVERB_APP_ID`, `REVERB_APP_KEY`, `REVERB_APP_SECRET`, `REVERB_HOST`, `REVERB_PORT`, and `REVERB_SCHEME` when realtime broadcasting is enabled.
- `REVERB_SERVER_HOST` and `REVERB_SERVER_PORT` are for the Reverb process bind address, not for browser/client connection.
- `MYSQL_ATTR_SSL_CA` when using SSL-protected MySQL providers

## Docker and Deploy Notes

- Production target is currently DigitalOcean App Platform for backend API and Reverb services.
- DigitalOcean setup docs live in `DIGITALOCEAN_APP_PLATFORM_REVERB.md`.
- There is also a Dockerfile available for local/container deployment.
- Container startup script:
- can generate `APP_KEY` if missing.
- clears Laravel caches.
- optionally runs migrations and seeders with `RUN_MIGRATIONS=true` and `RUN_SEEDERS=true`.
- serves through nginx + php-fpm on `PORT`, default `10000`.
- can run Reverb instead of nginx/php-fpm when `APP_ROLE=reverb`; this starts `php artisan reverb:start` on `0.0.0.0:$PORT`.
- DigitalOcean App Platform should run Reverb as a separate web service and route public `/app` and `/apps` requests from `api.ckcitclub.tech` to that service with path prefix preserved.

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
- Club information domain still has schema presence but no real API surface yet.
- Root documentation is partially stale.

## Change Log

- `2026-06-01`: User chat message pagination accepts `per_page`, `before`, and optional `before_id`; messages are ordered by `created_at desc, id desc` so scroll-up loading can fetch older batches without cursor boundary gaps.

- `2026-05-30`: Public/user profile payload now returns separate `posts_count`, `blogs_count`, and `content_count` (`posts + blogs`); community blog listing accepts `username` to filter blogs by author handle/email prefix.
- `2026-05-24`: Department member leadership is tied to each department's configured Spatie head role (`head_role_id`); updating a head only assigns/removes that one user role, so the same user can hold multiple department-head roles.
- `2026-05-24`: User create/update role sync now also propagates department head roles into department membership/head ownership, so editing user roles and editing department chức vụ stay consistent.
- `2026-05-24`: Removing a member from a department now also removes that department's configured head role from the user when applicable.
- `2026-05-23`: Added department member role update and remove endpoints; department detail member payload now includes user active status for the admin detail table.
- `2026-04-07`: Initial backend context created after full backend audit. Captured actual route surface, auth model, recruitment rules, setup flow, known gaps, and agent editing rules.
