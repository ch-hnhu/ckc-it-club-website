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
- `GET /api/v1/gamification/leaderboard/weekly` with paginated leaderboard data (`page`, `per_page`, default 20).
- `GET /api/v1/gamification/leaderboard/all-time` with paginated leaderboard data (`page`, `per_page`, default 20).
- `GET /api/v1/users/profile/{username}` returns public profile details plus gamification summary fields `total_points` and `current_rank`.
- Community public read routes under `/api/v1/community`: `GET /channels`, `GET /posts`, `GET /posts/{id}`, `GET /posts/{id}/comments`, `GET /posts/{id}/reactions/users`, `GET /blogs`, `GET /blog-tags`, `GET /blogs/{slug}`, `GET /blogs/{id}/comments`, and `GET /blogs/{id}/reactions/users`. Post detail and post comments return published posts for everyone, plus archived posts only to their authenticated owner.
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
- `GET /api/v1/gamification/me`
- `GET /api/v1/gamification/me/history`
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
- Admin community post management includes `GET /api/v1/posts/trash` for soft-deleted posts and `PATCH /api/v1/posts/{post}/restore` to restore them; admin post stats no longer return pin counts.
- Admin post/blog report stats include the report schema statuses `pending`, `reviewing`, `resolved`, `dismissed`, and `superseded`; `superseded` is set when another related report is handled first.
- User-facing realtime notification broadcasts are best-effort; database notifications remain persisted even if Reverb/Pusher is unavailable during the request.
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
- user profile API responses expose `total_points` and formatted `current_rank` for user-facing gamification display; `current_rank` falls back to the lowest rank (default seeded `Đồng`) when `users.rank_id` is null.
- admin-created avatars are stored on Laravel `public` disk under `avatars/`, and the relative path is persisted in `users.avatar`.
- admin create/update user flow persists `gender` and `is_active` directly on the `users` table and assigns the selected Spatie roles from the submitted `roles` array.
- when create/update user assigns a department head role (`academic-head`, `communications-head`, or `volunteer-head`), backend also attaches that user to the matching department if needed and removes that same head role from any other user; unrelated roles are preserved.
- `User` API serialization formats `created_at` and `updated_at` as `d/m/Y` for frontend direct display.
- `roles`
- admin role create payload uses `label` for the display name, `name` for the internal value, and `is_system` as a boolean flag.
- belongs to `faculty`, `major`, `school class`.
- can create/update other records through `created_by` and `updated_by`.
- `ranks`
- gamification rank records use `name`, unique `min_points`, and `badge`; current seeded badges use absolute Supabase image URLs, and API formatting also preserves `/assets/...` paths for frontend-bundled badges. Admin uploads store files on the Laravel `public` disk under `rank-badges/` and return `/storage/...` URLs. User gamification `/me` and profile responses fall back to the lowest rank as the default current rank when a user's `rank_id` is not set.
- admin rank listing/detail returns `users_count` computed from `users.total_points` ranges between rank thresholds, not from the potentially stale `users.rank_id` relationship.
- admin rank create/update/delete dispatches `RecomputeUserRanksJob` to recompute `users.rank_id` in the background. Production deployments must keep a Laravel queue worker running because `QUEUE_CONNECTION=database` is the default.
- seeded rank data has 6 tiers: Đồng, Bạc, Vàng, Bạch Kim, Kim Cương, and Tinh Anh. The old `icon`/`color` rank contract is obsolete.
- `blogs`
- seeded blogs include `gioi-thieu-bang-xep-hang`, used by the user leaderboard right rail. Blog cover images can be uploaded storage paths or public frontend asset paths such as `/assets/img/level03.png`; API transforms keep `/assets/`, `/storage/`, and absolute URLs unchanged.
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
- `quizzes`, `quiz_questions`, and `quiz_question_options`
- one quiz belongs to exactly one lesson (`quizzes.lesson_id` is unique); questions reference a seeded `question_types` record and options support optional images plus type-specific metadata.
- `quiz_questions.explanation` stores the immediate post-answer explanation shown to the learner. Quiz attempt scoring remains a percentage of correctly answered questions; there is no per-question point weight.
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
- user-facing post listing with a `username` profile filter orders pinned posts before unpinned posts, then applies the requested sort/order.
- user-facing post visibility is enforced in backend read/action queries: `public` posts are visible to everyone, `members` posts are visible to the owner and users with the club member role (`club-member`; legacy `club_member` is also accepted in the check), and `private` posts are visible only to the owner. Detail, comments, bookmarks, reports, reactions, comment reactions, profile post counts, and profile content counts all use the same visibility gate. Profile `likes_count` intentionally remains a total engagement statistic across all posts/blogs owned by the profile user, regardless of viewer visibility.
- authenticated users can create published posts through `POST /api/v1/community/posts` with `channel_slug` or `channel_id`, `title`, `content`, optional `visibility`, and optional `media` image/video upload up to 20 MB. Uploaded post media is stored on the public disk under `community/posts/{post_id}`, mirrored into `posts.media_urls`, and tracked in `media_files`.
- `posts` now has schema support for author profile pinning (`is_pinned`, `pinned_at`), author-owned archiving through `status = archived`, soft delete metadata, and `visibility`; pinning is scoped to the post author's profile, not global community feed ordering. The backend must enforce a maximum of 3 pinned posts per author when the pin endpoint is implemented.
- `post_bookmarks` stores one saved post per user/post pair, while `post_reports` stores report reason/status/resolution metadata.
- `channels`, `posts`, `post_reports`, and `comments` support topic feeds, reports, nested comments, and soft-deleted comments.
- `reactions` is polymorphic by `target_type`/`target_id` for posts, comments, and blogs.
- authenticated users can create published blogs through `POST /api/v1/community/blogs` with `title`, `content`, optional `excerpt`, optional `tag_ids[]`, and optional `featured_image` image upload up to 5 MB. Uploaded blog cover images are stored on the public disk under `blog-covers`.
- `chat_rooms`, `chat_members`, and `messages` support named chat rooms, unread tracking through `last_read_at`, message replies, and soft-deleted messages.
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

- `2026-06-25`: Certificate render fonts are now **self-hosted** (no Google Fonts dependency at render time). Previously `buildHtml` linked Google Fonts and Konva drew before the font finished downloading (or the CDN was slow/blocked) → text fell back to a system font ("lỗi font"). Now `backend/public/vendor/fonts/cert-fonts.css` holds Be Vietnam Pro + Roboto (400/700, normal+italic; latin/latin-ext/vietnamese subsets) as base64-embedded woff2 `@font-face`, inlined into the render HTML `<style>`. Regenerated by downloading the Google CSS2 + embedding the woff2 (a one-off; re-run if adding fonts). Render is now offline-capable and the designed font always appears. Editor still uses the Google Fonts `<link>` (same family). Regenerated existing templates' thumbnails with the embedded font.
- `2026-06-25`: Certificate template **thumbnails are now rendered server-side** (Browsershot `screenshot()` → GD `imagescale` to 480px wide), not from the client's `stage.toDataURL()`. The client path threw "tainted canvas" whenever the design used cross-origin (`localhost:8000/storage`) images, so those templates had no thumbnail. `CertificateRenderer` refactored: shared `makeShot()` builds the configured Browsershot instance; `renderPdf()` and new `renderThumbnail()` reuse it; `downscalePng()` resizes. `CertificateTemplateController::store/update` call `generateThumbnail()` (renders with `sampleData()`, stores to `certificate-thumbnails`, deletes old, swallows errors so save never fails); the `thumbnail` field/validation and the old base64 `storeThumbnail()` were removed. Frontend `handleSave` no longer sends a thumbnail. Adds ~1–2s to save (sync render). Backfilled existing templates' thumbnails.
- `2026-06-25`: Fixed certificate render **deadlock with `php artisan serve`** (waitForFunction 12s timeout → 500). The single-threaded built-in server can't serve a `localhost:8000/storage/...` image while it's busy handling the render request itself, so Chrome's image fetch hung → `window.__certReady` never set. `CertificateRenderer::prepareScene()` now **inlines** background and `image`-element sources to base64 data URIs (`inlineAsset()` reads them off the public disk) so Chrome never calls back to the app. Also hardened `renderScene`: images load in parallel, and `window.__certReady = true` is set in a `finally` (no `requestAnimationFrame` dependency) so Browsershot never hangs even on a draw error. Verified: a design with bg image + logo + QR renders in ~1.4s over the single-threaded serve.
- `2026-06-25`: Fixed certificate render **500 when `node` not on PATH**. The dev backend runs under **Laravel Herd** (php at `~/.config/herd-lite/bin`), whose PHP process PATH does NOT include nvm's node (`~/.nvm/versions/node/<ver>/bin`), so Browsershot's node subprocess failed → `ProcessFailedException` ("command ... failed") → 500. `CertificateRenderer::resolveNodeBinary()` now resolves the node binary explicitly (env `BROWSERSHOT_NODE_PATH` first, else globs `~/.nvm/versions/node/*/bin/node` rsorted, else `/opt/homebrew/bin/node`, `/usr/local/bin/node`, `/usr/bin/node`) and passes it via `->setNodeBinary()`. Verified rendering succeeds even with node removed from PATH. For prod set `BROWSERSHOT_NODE_PATH` (and `BROWSERSHOT_CHROME_PATH`).
- `2026-06-25`: Fixed certificate render **hang**. `CertificateRenderer` no longer calls `->waitUntilNetworkIdle()` — it waited on network (Google Fonts CDN) and could hang until PHP's 30s `max_execution_time`, making `/preview` and auto-issue fail with "Maximum execution time of 30 seconds exceeded". Now relies only on `waitForFunction('window.__certReady===true', null, 12000)` (renderScene already awaits fonts+images before setting the flag), plus `->timeout(90)` and `@set_time_limit(120)`. The in-page JS wraps `document.fonts.load`/`document.fonts.ready` and image loads in hard timeouts (4s/1s/6s) so rendering always completes (falls back to default font / skips image) instead of hanging when offline or the CDN stalls. Render now ~1–2s. (Consider self-hosting Be Vietnam Pro/Roboto under `public/vendor/fonts` to drop the Google Fonts dependency for prod/offline.)
- `2026-06-24`: `CertificateRenderer` fixes — `Browsershot::waitForFunction($js, $polling, $timeout)`: arg 2 must be `?Spatie\Browsershot\Enums\Polling` (passing an int throws and made `/preview` return 500); pass `null`. Also force-load the actual web fonts before Konva draws (`document.fonts.load('400 40px "..."')` per family) — without it Konva renders text in a serif fallback instead of Be Vietnam Pro. Verified end-to-end: Vietnamese diacritics + QR render correctly, `/preview` returns a `data:application/pdf;base64,...` in ~3s.
- `2026-06-24`: Certificate templates became a **drag-drop canvas designer** (Canva-style). `certificate_templates` migration (edited in place — original `2026_06_18_000007`) gained a nullable `design` JSON column (scene: `{canvas:{width,height,background:{color,image}}, elements:[...]}`) and made `html_content` nullable. `CertificateTemplateController` now has full CRUD: `show`, `store`, `update`, `destroy` (blocked when `is_default`), `setDefault`, `duplicate`, `uploadAsset` (`POST .../assets` → stores to `certificate-assets` public disk), `preview` (`POST .../preview` → renders sample PDF as base64 data URI). **Important**: `store`/`update` persist `$request->input('design')` (NOT the validated array — `validate()` strips keys without rules like `canvas.background`). Thumbnails arrive as base64 data URLs from the editor (`stage.toDataURL()`) → decoded to PNG on `certificate-thumbnails`. Write routes are under `permission:courses.manage`; `show` under `courses.view`. New render engine `App\Services\CertificateRenderer` uses **spatie/browsershot** (Chrome headless) to rebuild the Konva scene with real data → PDF (WYSIWYG with the editor), replacing dompdf for design-based templates; placeholders `{{name}} {{course}} {{issued_at}} {{cert_code}}`, and `qr`-type elements get a QR (endroid/qr-code) pointing at `{APP_URL}/verify/{cert_code}`. `CourseCertificateService::generate()` now renders via `CertificateRenderer` when `template->design` is set, else falls back to dompdf+`html_content`. Browsershot uses `base_path('node_modules')` (puppeteer installed there for dev); set `BROWSERSHOT_CHROME_PATH` env for prod (Dockerfile has a commented apk block for Chromium). Konva is vendored at `backend/public/vendor/konva.min.js`. The `/verify/{cert_code}` public page itself is NOT built yet (QR encodes the URL for the future page).
- `2026-06-22`: Added read-only admin endpoint `GET /api/v1/certificate-templates` (inside the `permission:courses.view` group, "Trung tâm đào tạo") served by `App\Http\Controllers\Api\V1\Admin\CertificateTemplateController@index`. Returns paginated `certificate_templates` with name search and per-column sorting (`id`, `name`, `is_default`, `created_at`, `creator`); each row is `{id,name,thumbnail(public url),is_default,creator:{id,full_name,avatar},created_at,updated_at}`. New model `App\Models\CertificateTemplate` (`is_default` cast bool, `creator()` belongsTo User via `created_by`). No store/update/destroy yet. No seeder — table starts empty.
- `2026-06-22`: Admin quiz upsert (`PUT .../quiz`) no longer requires `questions.*.content` (now `nullable`, stored as `''` when empty) and accepts `questions.*.options` as `present|array` instead of `min:1`, so incomplete quizzes can be saved as draft. There is no quiz status column; "draft vs publish" completeness is enforced on the admin frontend at publish time, not by the API.
- `2026-06-22`: User-facing quiz-taking API shipped. `GET /api/v1/learning/courses/{course:slug}/lessons/{lessonSlug}/quiz` (public learning group, auth-optional) returns the lesson quiz with questions + options (incl. `is_correct`, `metadata`, `explanation`, `ui_type`) plus `pass_threshold` and whether the current user already passed; `POST /api/v1/learning/courses/{course:slug}/lessons/{lessonSlug}/quiz/submit` (auth:sanctum) re-grades all answers server-side, records a `quiz_attempts` row + `quiz_attempt_answers`, upserts the `lesson_progress` quiz section (completion is sticky once passed; keeps best score), and returns `{score,is_passed,pass_threshold,correct_count,total,results[]}`. Served by `App\Http\Controllers\Api\V1\User\QuizController`; grading lives in `App\Services\QuizGradingService` (covers multiple_choice/select, fill_blank case-insensitive, word_bank_fill_blank by `slot_index`, word_order, matching by `side`/`pairId`). `ordering` is unsupported; `word_order` is the sole ordering type. New models: `QuizAttempt`, `QuizAttemptAnswer`. Score = % correct over total quiz questions; `is_passed` = score ≥ `courses.quiz_pass_threshold`. Answers are sent to the client (immediate-feedback learning quiz, not a proctored exam).
- `2026-06-21`: Lesson quiz authoring gained its own permission `quizzes.manage` (added to `PermissionsEnum`, `PermissionSeeder` definitions, and assigned to `admin`/`president`/`vice-president`/`academic-head` — not `communications-head`/`volunteer-head`). Both quiz routes are now grouped under `permission:quizzes.manage` instead of `courses.view`/`courses.manage`.
- `2026-06-21`: Admin lesson quiz authoring API shipped. New routes: `GET /api/v1/courses/{course}/lessons/{lesson}/quiz` returns the lesson's quiz with `questions[].options[]` or `data: null` when none exists; `PUT /api/v1/courses/{course}/lessons/{lesson}/quiz` full-replaces the quiz content in a transaction (`Quiz::firstOrCreate` by `lesson_id`, deletes old questions so options cascade, recreates with 1-based `order`). `{course}` binds by slug, `{lesson}` by id. Served by `App\Http\Controllers\Api\V1\Admin\QuizController`. New models: `QuestionType`, `QuizQuestionOption`; `QuizQuestion` gained `type()`/`options()` relations and `explanation` fillable. Request payload is `{ questions: [{ type (question_types.key), ui_type?, content, explanation?, image?, metadata?, options: [{ content, is_correct, image?, metadata? }] }] }`. Persisted types are restricted to `QuestionTypeKey` and therefore reject legacy/unseeded values such as `ordering`; `word_order` is the sole ordering type. `ui_type` (the frontend authoring template, e.g. `true_false`) is stored inside `quiz_questions.metadata.ui_type` when it differs from the persisted `type` and re-surfaced on read so the composer round-trips exactly; option `metadata` is stored verbatim (frontend camelCase passthrough — `pairId`, `slot_index`, `side`). `image` only persists real URLs / internal paths (`http*` or `/...`); transient `blob:`/`data:` previews are dropped because proper quiz image upload is not implemented yet. `QuestionTypeSeeder` seeds the 6 persisted types, including `word_bank_fill_blank` and `word_order`. No quiz-attempt/submit/scoring endpoints yet.
- `2026-06-20`: Learning Center read API (Giai đoạn 1) shipped. New public, auth-optional routes under `/api/v1/learning`: `GET /courses` (paginated catalog with `search`, `category` = tag name, `level`, `sort` = `created_at|enrolled_count`, `order`), `GET /categories` (course tags → `{id,name,color:null}`), `GET /courses/{course:slug}` (course detail + lessons + stats), `GET /courses/{course:slug}/lessons/{lessonSlug}` (lesson with one video/reference/exercise/quiz section each), and `GET /courses/{course:slug}/lessons/{lessonSlug}/videos/{videoSlug}` (single-video player payload). Served by `App\Http\Controllers\Api\V1\User\CourseController`, which builds response arrays inline (no API Resource classes, mirroring `EventController`) to exactly match the frontend `learning.types.ts` contract; `frontend/user/src/services/learning.service.ts` mock was replaced with real `api.get` calls. New Eloquent models: `Course`, `Lesson`, `CourseEnrollment`, `LessonProgress` (table `lesson_progress`), `Quiz`, `QuizQuestion`, `LessonAttendance`, `LessonQrTicket`. Course categories reuse the shared `tags` table filtered by `model_type = course`. Schema fields with no backing yet are stubbed in responses and marked `TODO(G2)`: `is_interested` (no follow/interest table), and stats `projects_*`/`xp_*`/`badges_*` (return 0). Data comes from the existing `LearningCenterSeeder` (1 course `lap-trinh-web-co-ban`, 6 lessons). No write/enrollment/QR/quiz-submit/certificate endpoints yet.
- `2026-06-14`: Admin event create/update/status changes now resync a non-draft/non-cancelled event's status from its updated `start_at`/`end_at`, allowing schedule edits to move events back to `published` or `ongoing` as well as forward to `ended`.
- `2026-06-13`: Public user event listing/detail now resolve an optional Sanctum bearer token so authenticated viewers receive their event registration status and QR token without making the route private.
- `2026-06-05`: Admin post management removed pin-specific admin sorting/stats, added soft-deleted post listing through `GET /posts/trash`, and added restore through `PATCH /posts/{post}/restore`.
- `2026-06-03`: User community post listing `GET /api/v1/community/posts?username=` now matches authors by username or email prefix, keeping profile post lists consistent with public profile lookup and blog listing.
- `2026-06-01`: Admin channel create/update now accepts an uploaded image file in `image`, stores it on the public disk under `channels/`, and returns a public image URL while preserving existing external image URLs.
- `2026-06-01`: `chat_rooms` no longer has a `type` column; chat room APIs, model fillable fields, and `ChatRoomSeeder` now treat every room as a named chat room without direct/group filtering.
- `2026-06-01`: Admin chat room management supports CRUD through `POST /chat-rooms`, `PUT/PATCH /chat-rooms/{room}`, and `DELETE /chat-rooms/{room}`.
- `2026-06-01`: Admin comment list payload includes `article_url` pointing to the user-facing post/blog URL; admin comment filtering now supports both post and blog comments.
- `2026-06-01`: User chat message pagination accepts `per_page`, `before`, and optional `before_id`; messages are ordered by `created_at desc, id desc` so scroll-up loading can fetch older batches without cursor boundary gaps.

- `2026-06-01`: Admin channel create/update now accepts an uploaded image file in `image`, stores it on the public disk under `channels/`, and returns a public image URL while preserving existing external image URLs.
- `2026-06-01`: `chat_rooms` no longer has a `type` column; chat room APIs, model fillable fields, and `ChatRoomSeeder` now treat every room as a named chat room without direct/group filtering.
- `2026-06-01`: Admin chat room management supports CRUD through `POST /chat-rooms`, `PUT/PATCH /chat-rooms/{room}`, and `DELETE /chat-rooms/{room}`.
- `2026-06-01`: Admin comment list payload includes `article_url` pointing to the user-facing post/blog URL; admin comment filtering now supports both post and blog comments.
- `2026-06-01`: User chat message pagination accepts `per_page`, `before`, and optional `before_id`; messages are ordered by `created_at desc, id desc` so scroll-up loading can fetch older batches without cursor boundary gaps.

- `2026-05-31`: Added the missing `posts.pinned_at` migration required by user post pin/unpin updates.
- `2026-05-30`: Public/user profile payload now returns separate `posts_count`, `blogs_count`, and `content_count` (`posts + blogs`); community blog listing accepts `username` to filter blogs by author handle/email prefix.
- `2026-05-24`: Department member leadership is tied to each department's configured Spatie head role (`head_role_id`); updating a head only assigns/removes that one user role, so the same user can hold multiple department-head roles.
- `2026-05-24`: User create/update role sync now also propagates department head roles into department membership/head ownership, so editing user roles and editing department chức vụ stay consistent.
- `2026-05-24`: Removing a member from a department now also removes that department's configured head role from the user when applicable.
- `2026-05-23`: Added department member role update and remove endpoints; department detail member payload now includes user active status for the admin detail table.
- `2026-04-07`: Initial backend context created after full backend audit. Captured actual route surface, auth model, recruitment rules, setup flow, known gaps, and agent editing rules.
