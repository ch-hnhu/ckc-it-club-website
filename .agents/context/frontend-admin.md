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
- create-user form UI
- `/departments`
- faculty list
- `/majors`
- major list
- `/classes`
- school class list
- `/contacts`
- contact management list with real backend data and status updates
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
- `/roles`
- `/permissions`
- `/club-info`
- `/divisions`
- `/fields`
- Dashboard contains significant placeholder/demo content rather than fully live backend-driven analytics.
- `CreateUser` is currently a UI-only form. It logs payload to console and does not call a backend endpoint.
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
- Logout is token-based and goes through backend `/auth/logout`.

## Auth Risks and Assumptions
- Admin frontend assumes backend `GET /auth/me` is the canonical token check.
- Admin frontend relies on redirecting to `/login` on `401`, so breaking that route will break recovery.
- There is no explicit frontend-side role check after login; auth success depends on backend already filtering admin users during OAuth.

## Layout and UI System
- Main layout is sidebar-first and breadcrumb-aware.
- Sidebar content is driven from static local config in `AppSidebar.tsx`, not from backend permissions or route introspection.
- Theme system:
- `ThemeProvider` writes selected theme to `localStorage` under `vite-ui-theme`
- applies `light`, `dark`, or system-derived class to `document.documentElement`
- Design tokens live in `src/index.css`.
- Styling approach:
- shadcn token variables
- neutral base palette
- custom pastel accents such as `--pastel-blue`, `--pastel-pink`, `--pastel-green`, `--pastel-orange`
- default body font still falls back to system stack even though `Source Sans 3` is imported in `main.tsx`

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
- `email`
- `avatar`
- `created_at`
- `updated_at`
- If backend `User` payload grows, update the type instead of using `any`.

## Feature-Specific Notes
- User list:
- server-driven pagination, search, sort
- currently no live edit/delete action implementation
- Create user:
- UI exists
- no API integration yet
- role selection is local only
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
- Create user flow is incomplete.
- Recruitment list can silently fall back to mock data on API failure.
- Supabase helper exists without documented envs or active call sites.
- Installed Redux dependencies are unused.
- Font import and body font configuration are not fully aligned.

## Change Log
- `2026-04-23`: Added admin contact management route `/contacts`, sidebar entry, `contact.service.ts`, and live status updates backed by the Laravel API.
- `2026-04-08`: Replaced scaffold with full admin frontend audit. Added route surface, auth/session model, service conventions, UI system notes, env requirements, and known gap inventory.
