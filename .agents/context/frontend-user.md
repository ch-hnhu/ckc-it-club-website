# CKC IT Club Frontend User Context

## Purpose
- This folder is the user-facing frontend at `frontend/user/`.
- It is the public-facing site for CKC IT Club with landing-page sections, contact page, and user login CTA through Google OAuth.
- It is visually opinionated and already has a soft neo-brutalist design direction encoded in CSS and component structure.

## Read This First
- Treat this file as the source-of-truth for user frontend work.
- Do not trust `frontend/user/README.md`; it is still the generic Vite template.
- If your task touches auth/session or backend response contracts, also read `.agents/context/backend.md`.
- If your task changes the public-facing design language, also inspect the local skill `ckc-user-frontend-style`.

## Maintenance Rule
- Any agent changing user frontend behavior MUST review and update this file before finishing work.
- Update this file when any of these change:
- route surface
- auth/session behavior
- landing page section structure
- visual system assumptions
- API or form integration behavior
- environment variables
- important static asset or external dependency assumptions

## Stack
- Framework: React 19.
- Language: TypeScript.
- Build tool: Vite 7.
- Router: React Router 7, browser router.
- Styling: Tailwind 4 plus extensive custom CSS utilities in `src/index.css`.
- Icons: `lucide-react`.
- HTTP client: Axios exists, but auth flow mainly uses `fetch`.
- Utility libraries: `clsx`, `class-variance-authority`, `tailwind-merge`.
- Redux Toolkit is installed but not actively used.

## App Boot Flow
- Entry: `src/main.tsx`
- Root app: `src/App.tsx`
- Router only; no top-level provider stack like admin.
- Main public shell:
- `MainLayout`
- fixed navbar
- outlet content
- footer
- back-to-top control

## Route Surface
- `/`
- landing page composed from multiple section components
- `/lien-he`
- contact page
- There is currently no `/login` route in the router.

## Important Reality Checks
- User login exists as a popup-based Google OAuth flow triggered from the navbar, not as a dedicated login page.
- `ContactPage` currently simulates form submission locally with `setTimeout`; it does not post to a backend contact endpoint.
- `Navbar` and auth service use `localStorage` for the access token.
- `src/config/axios.config.ts` tries to read the token from `sessionStorage`, not `localStorage`.
- The same Axios interceptor redirects `401` responses to `/login`, but this app has no `/login` route.
- Conclusion: token storage and unauthorized redirect behavior are internally inconsistent. Agents must treat auth/session handling carefully.
- Several public links inside landing sections still point to `#` placeholders.

## Layout and Visual System
- Global visual direction is defined in `src/index.css`.
- The design system is not generic shadcn. It is custom and should be preserved unless a redesign is explicit.
- Core characteristics:
- soft neo-brutalism
- thick black borders
- flat pastel accent blocks
- hard drop shadows
- rounded cards and buttons
- expressive section spacing
- mixed use of `Be Vietnam Pro` for headings and `Inter` for body
- Reusable utility classes:
- `.neo-card`
- `.neo-btn`
- `.neo-btn-primary`
- `.neo-btn-secondary`
- `.neo-section`
- `.neo-container`
- `.neo-tag`
- `.fade-in-up`
- Animation assumptions:
- sections often use `IntersectionObserver` to reveal `.fade-in-up` content
- decorative floating shapes and SVG assets are part of the intended look

## Module Layout
- `src/components/landing-page/`
- landing page sections such as hero, quick actions, board, mentors, featured content, leaderboard, contribution CTA
- `src/components/partials/`
- navbar, footer, back-to-top
- `src/layouts/`
- public layout shell
- `src/pages/`
- top-level pages
- `src/services/`
- auth, health, generic API wrapper
- `src/config/`
- Axios instance config
- `src/types/`
- shared TS types

## Landing Page Structure
- `LandingPage.tsx` is a composition page, not a data-heavy page.
- Current order:
- `HeroSection`
- `QuickActions`
- `AboutValues`
- `MentorSection`
- `BoardSection`
- `FeaturedContent`
- `LeaderboardPreview`
- `ContributionSection`
- `FinalCTA`
- Navbar anchor links expect section IDs such as:
- `#blog`
- `#resources`
- `#leaderboard`
- `#events`
- `#courses`
- `#about`
- Not every referenced target represents a full routed page; many are in-page anchors only.

## Authentication Model
- Login is popup-based and starts from the navbar.
- Auth URL is derived from `VITE_BACKEND_URL` and points to `/user/auth/google`.
- OAuth completion is communicated back through `postMessage`.
- Successful auth stores `access_token` in `localStorage`.
- `MainLayout` refreshes user state by calling `getCurrentUser()` on mount.
- `getCurrentUser()`:
- uses `fetch`, not Axios
- calls backend `/auth/me`
- maps backend user fields to `AuthUser`
- Logout also uses `fetch` and clears the local token.

## Auth Risks and Assumptions
- Since `getCurrentUser()` uses `fetch` and not the shared Axios client, changing one auth path may not update the other.
- `axios.config.ts` currently has behavior that does not match the router:
- clears `localStorage`
- redirects to `/login`
- There is no `/login` page in this app.
- If you standardize auth, update:
- `src/services/auth.service.ts`
- `src/config/axios.config.ts`
- navbar login/logout behavior
- this file

## Service Layer Conventions
- Generic API wrapper lives in `src/services/api.service.ts`.
- Health check service exists and is simple.
- Auth flow is custom and mostly bypasses Axios.
- Current services:
- `auth.service.ts`
- `health.service.ts`
- `api.service.ts`
- Prefer centralizing real backend integration in services rather than embedding fetch logic into pages, unless you are deliberately consolidating auth behavior.

## Data and Form Reality
- `ContactPage` is currently presentation-first, not data-integrated.
- It keeps form state locally and shows a success state after a simulated delay.
- There is a `contacts` table in the backend, but the user frontend does not currently submit into it.
- If you wire real contact submission, update both frontend and backend context docs.

## Environment Variables
- Current app uses:
- `VITE_API_URL`
- `VITE_BACKEND_URL`
- There is no checked-in `.env.example` in this package right now, only a local `.env`.
- If you formalize setup for other developers or agents, add `.env.example` and document it here.

## Setup and Run
```bash
cd frontend/user
npm install
npm run dev
```
- Standard scripts:
- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run preview`

## Source-of-Truth Files
- `src/routes/index.tsx`
- `src/layouts/MainLayout.tsx`
- `src/components/partials/Navbar.tsx`
- `src/services/auth.service.ts`
- `src/config/axios.config.ts`
- `src/pages/LandingPage.tsx`
- `src/pages/ContactPage.tsx`
- `src/index.css`

## Safe Edit Rules For Agents
- Preserve the current visual language unless the task explicitly requests a redesign.
- When modifying landing sections, prefer extending existing section components over adding new top-level page complexity.
- Do not introduce a `/login` flow casually without reconciling the popup OAuth design.
- If fixing auth, standardize token storage and unauthorized redirect behavior end-to-end rather than patching one file.
- If integrating the contact form with backend, make the service layer explicit and document the payload contract.
- Keep anchor-based navigation coherent; update section IDs and navbar targets together.

## Known Gaps and Debt
- `frontend/user/README.md` is stale.
- No `.env.example` is committed for this package.
- Contact form is simulated and not wired to backend.
- Axios auth behavior and actual auth storage are inconsistent.
- Axios redirects to a missing `/login` route.
- Several links in landing sections are still placeholders.
- Redux dependencies are installed but unused.
- Public branding assets partly depend on external Supabase-hosted images.

## Change Log
- `2026-04-08`: Replaced scaffold with full user frontend audit. Added landing-page structure, neo-brutalist design assumptions, auth/session model, service conventions, env notes, and known gap inventory.
