# CKC IT Club Frontend Admin Context

## Purpose

- This folder is the admin dashboard frontend at `frontend/admin/`.
- It is the control surface for admin-side operations backed by the Laravel API in `backend/`.
- The strongest implemented admin domains today are:
- Google OAuth login
- dashboard shell
- user listing
- faculty/major/class listing
- recruitment application review
- recruitment question management

## Read This First

- Treat this file as the source-of-truth for admin frontend work.
- Do not trust `frontend/admin/README.md`; it is still the generic Vite template.
- If your task touches API contracts or auth behavior, read `.agents/context/backend.md` before editing.

## Maintenance Rule

- Any agent changing admin frontend behavior MUST review and update this file before finishing work.
- Update this file when any of these change:
- route surface
- auth/session behavior
- API service contracts
- page ownership or module boundaries
- shared UI system assumptions
- environment variables
- optional integrations such as Supabase uploads
- known gaps or dangerous fallback behavior

## Stack

- Framework: React 19.
- Language: TypeScript.
- Build tool: Vite 7.
- Router: React Router 7, browser router.
- UI foundation: Tailwind 4 + shadcn/ui + Radix primitives.
- Notifications: `sonner`.
- Forms available in stack: React Hook Form + Zod.
- HTTP client: Axios.
- Theme: custom light/dark theme provider using a `dark` class on the root element.
- Optional integration: Supabase storage helper exists, but current usage appears absent.

## App Boot Flow

- Entry: `src/main.tsx`
- Root app: `src/App.tsx`
- Global wrappers:
- `ThemeProvider`
- `RouterProvider`
- global `Toaster`
- Main authenticated shell:
- `ProtectedRoute` gates all routes under `/`
- `MainLayout` provides sidebar, header, breadcrumb context, and `Outlet`

## Route Surface

- `/login`
- login page with popup-based Google OAuth admin login
- `/`
- dashboard
- `/users`
- user list
- `/users/create`
- create-user form UI with avatar upload, required gender selection, and role loading from `/roles`
- `/departments`
- faculty list
- `/majors`
- major list
- `/classes`
- school class list
- `/contacts`
- contact management list with real backend data and status updates
- `/divisions`
- department management table backed by `GET /departments`, listing the seeded club departments with search, sorting, pagination, status, and member counts
- `/divisions/:id`
- department detail page with the department info card and member management table
- `/organization/upload`
- academic structure import history and upload flow for faculty, major, and class files
- `/club-informations`
- club information list backed by `GET /club-informations` with search, sort, and pagination
- `/requests`
- recruitment application list
- `/requests/:applicationId`
- recruitment application detail
- `/questions`
- recruitment question list/editor
- `/questions/:questionId`
- recruitment question detail
- `/answers`
- recruitment answers page

## Important Reality Checks

- Route definitions are the source-of-truth, not sidebar labels.
- Sidebar nav currently contains placeholder links with no matching route surface:
- `/reports`
- `/club-info`
- `/fields`
- Dashboard contains significant placeholder/demo content rather than fully live backend-driven analytics.
- `CreateUser` is now wired at `/users/create` and includes username, avatar upload preview plus faculty -> major -> class dependent searchable comboboxes. A reusable `ui/combobox` now supports search and optional multiple select mode. Avatar clear now resets preview to default avatar image (`/img/default-avatar.jpg`) while keeping other form state intact. Submit now calls backend `POST /users` with `multipart/form-data` (including optional avatar), selected `is_active` status, and redirects to `/users` on success.
- Recruitment application service uses `mockApplications` as a fallback when fetching `/club-applications` fails. This can mask backend outages and make the UI look “healthy” when it is not.
- Redux Toolkit is installed, but there is no centralized Redux store in the current app. State is local component state plus services.
- `supabase.config.ts` exists, but `uploadImage` does not appear to be actively used by current features.

## Authentication Model

- Login is popup-based Google OAuth against backend web routes.
- Login page listens for `postMessage` events with payload types:
- `OAUTH_AUTH_SUCCESS`
- `OAUTH_AUTH_ERROR`
- Successful admin login stores `access_token` in `localStorage`.
- `ProtectedRoute` checks authentication by:
- reading `localStorage.access_token`
- calling `authService.getMe()`
- treating `response.success` as authenticated
- Axios request interceptor adds `Authorization: Bearer <token>` from `localStorage`.
- Axios response interceptor on `401`:
- removes `access_token`
- removes `user`
- stores intended return path in `sessionStorage.redirectPath`
- redirects browser to `/login`
- Axios response interceptor on `403` shows a `sonner` toast: `Tài khoản không có quyền thực hiện chức năng này`.
- `PermissionRoute` no longer redirects unauthorized admin route access to the dashboard by default. It shows the same access-denied toast and replaces the URL with the last authorized route stored in `sessionStorage.admin:lastAuthorizedPath`, falling back to the first navigation route allowed by the current user's permissions.
- `MainLayout` uses `usePermissionNavigationGuard` to intercept unauthorized internal `<Link>` clicks before React Router changes route, keeping the current page mounted and showing the access-denied toast. Imperative `navigate(...)` calls that can target protected routes should use `useGuardedNavigate` for the same no-route-change behavior.
- Logout is token-based and goes through backend `/auth/logout`.

## Auth Risks and Assumptions

- Admin frontend assumes backend `GET /auth/me` is the canonical token check.
- Admin frontend relies on redirecting to `/login` on `401`, so breaking that route will break recovery.
- There is no explicit frontend-side role check after login; auth success depends on backend already filtering admin users during OAuth.

## Layout and UI System

- Main layout is sidebar-first and breadcrumb-aware.
- Sidebar content is driven from static local config in `AppSidebar.tsx`, not from backend permissions or route introspection.
- Sidebar main navigation is accordion-like: only one dropdown group is open at a time, and route changes reopen the group containing the active route.
- Theme system:
- `ThemeProvider` writes selected theme to `localStorage` under `vite-ui-theme`
- applies `light`, `dark`, or system-derived class to `document.documentElement`
- Design tokens live in `src/index.css`.
- Styling approach:
- shadcn token variables
- neutral base palette
- custom pastel accents such as `--pastel-blue`, `--pastel-pink`, `--pastel-green`, `--pastel-orange`
- default body font still falls back to system stack even though `Source Sans 3` is imported in `main.tsx`
- Shared checkbox UI lives in `src/components/ui/checkbox.tsx`, wraps `@radix-ui/react-checkbox`, and explicitly centers/sets the indicator color so checked ticks remain visible across table/list usage.

## Module Layout

- `src/components/auth/`
- route protection
- `src/components/dashboard/`
- stat cards, charts, recent activity UI
- `src/components/layout/`
- sidebar, header, nav, user menu, theme toggle
- `src/components/provider/`
- theme provider
- `src/components/ui/`
- shared shadcn/Radix component library
- `src/pages/auth/`
- login UI
- `src/pages/user/`
- user management views
- `src/pages/faculty/`
- faculty listing
- `src/pages/major/`
- major listing
- `src/pages/school-class/`
- school class listing
- `src/pages/recruitment/`
- applications, answers, questions, detail flows
- `src/pages/contact/`
- contact management list/detail/status flows
- `src/pages/division/`
- department management table page
- `src/services/`
- thin API client wrappers
- `src/types/`
- API and domain types
- `src/hooks/`
- breadcrumb and viewport helpers

## Service Layer Conventions

- `src/services/api.service.ts` is the generic wrapper around Axios client methods.
- Domain services are thin and mostly return raw server envelopes or normalized data.
- Current services:
- `auth.service.ts`
- `user.service.ts`
- `faculty.service.ts`
- `major.service.ts`
- `school-class.service.ts`
- `contact.service.ts`
- `application.service.ts`
- `health.service.ts`
- Prefer adding or updating endpoint wrappers in `src/services/` rather than making Axios calls directly in pages.

## Data Contract Conventions

- Generic API types live in `src/types/api.types.ts`.
- Paginated backend responses are expected as:
- `success`
- `message`
- `data[]`
- `meta`
- `links`
- Recruitment types are the most mature and live in `src/types/application.type.ts`.
- Current `User` type is minimal:
- `id`
- `full_name`
- `username`
- `email`
- `is_active`
- `avatar`
- `created_at`
- `updated_at`
- If backend `User` payload grows, update the type instead of using `any`.

## Feature-Specific Notes

- User list:
- server-driven pagination, search, sort
- displays `is_active` as a status badge
- currently no live delete action implementation
- Create user:
- UI exists
- create-user form loads roles from the backend and submits `username`, `gender`, `is_active`, plus selected roles to the API
- Recruitment applications:
- list uses client-side filtering/sorting after fetch
- status update is live against backend
- detail pages and answers pages should be treated as recruitment source-of-truth UI
- Recruitment questions:
- supports create, update, reorder, delete
- mirrors backend rules around question type and options
- page is relatively advanced and should be reused, not reimplemented
- Contact management:
- route `/contacts`
- server-driven pagination, search, sort, and status filtering
- status update is live against backend `PATCH /contacts/{contact}/status`
- Department management:
- route `/divisions`
- server-driven pagination, search, sort, status display through `CompactBadgeList`, row selection, member counts, create/update/delete modal flows, and row actions backed by backend department endpoints. Department delete is blocked when the department still has members; bulk delete uses a popup confirmation and only proceeds for selected departments without members.
- route `/divisions/:id`
- detail page fetches `GET /departments/{department}`, renders the department info card, warns when no head exists, and manages members with client-side search, role filter, pagination, add-member modal, role-change modal, and remove confirmation.
- add-member modal is intentionally minimal: member combobox, cancel/add actions, submit loading, close-and-refresh on success, and no primary-department toggle.
- department detail displays whether a member is the department head based on the user's configured Spatie head role for that department; changing a member's chức vụ calls the department member PATCH endpoint.
- member update/remove actions require `club_info.manage` and are disabled in the UI otherwise.
- Role management:
- route `/roles`
- route `/roles/:id`
- role detail can add one or more existing permissions from a modal multi-select combobox and remove assigned permissions directly from permission badges after confirmation. Permission removal is disabled for the `admin` role. The add option list is loaded from `GET /permissions` and filters out permissions already assigned to the role; add/remove both persist via `POST /roles/{role}/permissions` with the full permission name list. Permission detail also confirms before removing a role from a permission.
- Club information management:
- route `/club-informations`
- route `/club-informations/:id`
- list uses server-driven pagination, search, and sorting through `clubInformationService.getClubInformations`; parent `club_informations.is_active` has been removed from the database/API because parent configs are stable code-facing contracts.
- detail uses `clubInformationService.getClubInformation(id, params)`; the nested value table supports API-driven search/sort and local pagination.
- image and banner rows render the thumbnail preview and URL in the same value cell, matching the user list pattern; there is no separate image column.
- the nested value table supports sorting by `alt` for image rows and `link`/`position` for banner rows in addition to the existing value/date/status keys.
- backend `show()` whitelists `alt`, `link`, and `position` for nested value sorting so those headers sort server-side instead of falling back to `created_at`.
- detail can switch the parent information card into an inline edit form and submit through `clubInformationService.updateClubInformation`; parent label, key, and type are read-only there, and only slug/description are editable.
- parent club information records are stable config keys and are not deletable in the admin UI.
- detail value rows can be deleted after confirmation through `clubInformationService.deleteClubInformationValue`, except active values and the final remaining value of a config.
- detail can create nested values from a modal through `clubInformationService.createClubInformationValue`, then refreshes the value table.
- detail value popup can switch from read-only view to edit mode and submit through `clubInformationService.updateClubInformationValue`.
- non-banner detail value rows expose a quick dropdown action backed by `clubInformationService.setDefaultClubInformationValue`; clicking it sets that row as the default without opening the edit form.
- active values are labelled as `Mặc định` in the value table. For non-banner configs, setting one value active makes it the only active/default value; banner configs can keep multiple active values ordered by position.
- date fields are displayed directly from the API, which formats them as `d/m/Y`
- Academic structure import:
- route `/organization/upload`
- imports faculty/major/class data through `POST /academic-structure/import`
- wrong file formats are shown as failed history rows after backend stores them as `file_type = Other`

## Environment Variables

- Required:
- `VITE_API_URL`
- `VITE_BACKEND_URL`
- Optional but currently undocumented in `.env.example`:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_KEY`
- If you introduce real Supabase-dependent features, update `.env.example` and this file together.

## Setup and Run

```bash
cd frontend/admin
npm install
npm run dev
```

- Standard scripts:
- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run preview`

## Files Agents Should Read Before Major Edits

- `src/routes/index.tsx`
- `src/components/auth/ProtectedRoute.tsx`
- `src/layouts/MainLayout.tsx`
- `src/config/axios.config.ts`
- `src/services/auth.service.ts`
- `src/services/application.service.ts`
- `src/pages/auth/LoginForm.tsx`
- `src/pages/user/UserList.tsx`
- `src/pages/recruitment/ApplicationQuestionsPage.tsx`
- `src/pages/recruitment/ApplicationRequestsPage.tsx`
- `src/index.css`

## Safe Edit Rules For Agents

- Preserve the service-layer pattern. Do not scatter raw Axios calls across page components unless there is a very good reason.
- Keep auth token storage consistent with current admin conventions unless you are deliberately refactoring the full auth flow.
- Do not remove the popup `postMessage` OAuth pattern without updating both frontend and backend.
- When fixing sidebar or navigation issues, verify the route actually exists before surfacing a link.
- When touching recruitment pages, keep backend invariants in sync with `.agents/context/backend.md`.
- If you remove the `mockApplications` fallback, do it intentionally and update the docs.
- Do not introduce Redux unless the task explicitly requires centralized state. Current architecture is hook-and-service based.

## Known Gaps and Debt

- `frontend/admin/README.md` is stale.
- Sidebar includes dead or placeholder links.
- Dashboard is only partially backend-backed.
- Create user API integration is incomplete (UI and route are in place, submit is still UI-only).
- Recruitment list can silently fall back to mock data on API failure.
- Supabase helper exists without documented envs or active call sites.
- Installed Redux dependencies are unused.
- Font import and body font configuration are not fully aligned.

## Change Log

- `2026-05-24`: Wired department member chức vụ changes from the detail table to `PATCH /departments/{department}/users/{user}`; the backend maps head/member changes to the user's configured head role for that department.
- `2026-05-24`: User create/update role forms can affect department head display because backend maps selected head roles to the corresponding department ownership.
- `2026-04-20`: Updated CreateUser avatar behavior so clearing selected image restores default avatar preview (`/img/default-avatar.jpg`) while preserving all other form field state.
- `2026-04-20`: Added reusable shadcn-style `ui/combobox` component (Command + Popover) with optional search and multiple select support, and migrated CreateUser faculty/major/class fields to searchable comboboxes.
- `2026-04-20`: Wired `/users/create` route in router, connected User list "Thêm" button to navigate there, and implemented full shadcn CreateUser form UI with avatar preview and dependent faculty-major-class selectors.
- `2026-04-23`: Added admin contact management route `/contacts`, sidebar entry, `contact.service.ts`, and live status updates backed by the Laravel API.
- `2026-05-23`: Reworked `/divisions` from a local-data dashboard into a backend-backed department table for the seeded Học thuật, Truyền thông, and Tình nguyện departments, with create/update, detail, add-member, and member chức vụ actions.
- `2026-05-23`: Simplified the division add-member modal to the quick-add flow only and added shared combobox trigger focus support for dialog autofocus.
- `2026-05-23`: Added `/divisions/:id` as a full department detail and member management page with search, role filtering, pagination, role update, and member removal.
- `2026-05-20`: Updated admin division management so the third fixed division is Communication instead of Event.
- `2026-05-12`: Added admin route `/divisions` with a local-data management dashboard for the 3 fixed club divisions (academic, volunteer, communication).
- `2026-04-08`: Replaced scaffold with full admin frontend audit. Added route surface, auth/session model, service conventions, UI system notes, env requirements, and known gap inventory.
