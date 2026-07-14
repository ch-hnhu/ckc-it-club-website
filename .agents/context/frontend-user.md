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
- Markdown rendering: community post detail uses `markdown-it` plus a local sanitizer in `src/lib/markdown.ts`, then displays content with Stacks-style `s-prose` classes so saved Markdown matches the editor preview more closely.
- Community feed cards use the same Markdown renderer for collapsed excerpts. Long posts are truncated by rendered text nodes, not CSS height, show `...` plus `Xem thêm`, and expand full rendered Markdown inline while title clicks still navigate to detail.
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
- the shell uses `min-h-[100dvh]` (with `min-h-screen` fallback) so its background and footer always reach the visual viewport edge.
- lesson video pages (`/khoa-hoc/:slug/:lessonSlug/:videoSlug`) use an app-like split layout: fixed navbar with logo plus breadcrumb instead of the normal nav tabs; the breadcrumb shows the backend lesson title and `Video`, then two full-height main panes for lesson material and video, a fixed bottom learning navigation bar, and no global site footer/back-to-top control
- `/cong-dong` is a dense community layout exception:
- footer is hidden
- navbar and footer use the standard centered container; only lesson video pages (`/khoa-hoc/:slug/:lessonSlug/:videoSlug`) stretch them full-width for the lecture viewing layout
- community content fills the available desktop width up to a 76rem cap with reduced feed-side padding, and its right rail uses a custom `70rem` breakpoint so it remains visible below Tailwind `xl`
- on mobile/tablet below `lg`, the community page shows a sticky community sub-header and turns the left sidebar into an overlay drawer
- community channels are fetched in `CommunityPage` from public `GET /community/channels` through `communityService`; the page keeps a seeded local fallback list if the request fails.
- `/cong-dong/dang-bai` lives inside `CommunityLayout`, renders only the create-post form content, and submits authenticated posts to `POST /community/posts` through `postService.createPost`.
- Community post cards and detail render the post overflow menu dynamically: authors see pin/edit/privacy/archive/delete actions, while other viewers see save/report actions backed by the bookmark and report endpoints.
- Blog detail reaction counts can open the same reactor list modal used by community posts, backed by `GET /community/blogs/{id}/reactions/users`.
- Community post detail owner menu is wired to real actions: pin/unpin, edit route, privacy modal, archive/restore, and delete confirmation. Viewer menu actions use real bookmark and report flows.
- Own-profile empty states for Posts and Blog show direct create CTAs linking to `/cong-dong/dang-bai` and `/blog/dang-bai`; the same CTAs appear in overview carousel panels when those lists are empty.
- Profile post lists and overview carousels display pinned posts first and mark pinned content with a `Pin` badge instead of the older energy/Zap marker.
- Profile tab badges and stats update optimistically when a published post is archived or deleted so archived posts are not counted in the published Posts badge.
- Profile right sidebar includes a compact gamification panel with only total XP and current rank, read from `total_points` and `current_rank` on the profile response.

## Route Surface

- `/`
- landing page composed from multiple section components
- `/lien-he`
- contact page
- `/ung-tuyen`
- application form page; unauthenticated users can open it from the navbar `Tham gia ngay` CTA and are prompted to log in before submitting.
- `/thong-bao`
- authenticated user notification center. The navbar notification dropdown links here through “Xem tất cả”; the page loads personal notifications from `GET /user-notifications` in pages of 20, supports load more/infinite sentinel behavior, unread state, item navigation, and mark-all-read.
- `/blog`
- standalone blog feed page linked from the community dropdown in the navbar
- `/blog/dang-bai`
- standalone authenticated blog create page with title, excerpt, tag chips, Stacks editor content, and a cover-image upload.
- `/blog/:slug`
- standalone blog detail page
- `/cong-dong`
- dense community page with sidebar, feed, and right rail
- `/cong-dong/dang-bai`
- community create-post form linked from the composer entry and post button
- `/cong-dong/bang-xep-hang`
- public community leaderboard page; guests can view weekly and all-time rankings without logging in. Weekly and all-time tabs use paginated leaderboard endpoints and auto-load 20 more rows when the user scrolls to the bottom sentinel.
- `/login`
- credential login page with Google/GitHub OAuth popup buttons.
- `/register`
- credential signup page requiring only full name, email, password, and password confirmation. Username is generated by the backend from the email prefix before `@`.

## Important Reality Checks

- User login supports a dedicated credential `/login` page and popup-based Google/GitHub OAuth.
- User credential signup is available at `/register` and posts to `POST /api/v1/auth/register`; the frontend does not collect username because the backend derives it from email.
- `ContactPage` posts real data to `POST /api/v1/contacts`, shows backend success or error feedback, and resets the form on success.
- `Navbar` and auth service use `localStorage` for the access token.
- When a user is not authenticated, `Navbar` shows a `/login` link and a `Tham gia ngay` CTA that links to `/ung-tuyen`.
- When a user is authenticated, `Navbar` shows an avatar-only account trigger. Clicking it opens a neo-styled profile dropdown with Profile, Bookmarks, Account, Switch theme, and Sign Out actions.
- Authenticated users also see a notification bell. Its dropdown shows recent personal notifications, supports marking all as read, and links to `/thong-bao` for the full paginated notification center.
- `src/config/axios.config.ts` tries to read the token from `sessionStorage`, not `localStorage`.
- The same Axios interceptor redirects `401` responses to `/login`.
- Conclusion: token storage is internally inconsistent between the shared Axios client and the auth service. Agents must treat auth/session handling carefully.
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

- Login starts from the dedicated `/login` page, which supports credential login plus Google/GitHub OAuth popup buttons.
- Auth URL is derived from `VITE_BACKEND_URL` and points to `/user/auth/google`.
- OAuth completion is communicated back through `postMessage`.
- Successful auth stores `access_token` in `localStorage`.
- Successful credential register also stores `access_token` in `localStorage`.
- `MainLayout` refreshes user state by calling `getCurrentUser()` on mount.
- `getCurrentUser()`:
- uses `fetch`, not Axios
- calls backend `/auth/me`
- maps backend user fields to `AuthUser`
- Logout also uses `fetch` and clears the local token.

## Auth Risks and Assumptions

- Since `getCurrentUser()` uses `fetch` and not the shared Axios client, changing one auth path may not update the other.
- `axios.config.ts` currently has token storage behavior that does not match the auth service:
- clears `localStorage`
- redirects to `/login`
- If you standardize auth, update:
- `src/services/auth.service.ts`
- `src/services/notification.service.ts`
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
- `contact.service.ts`
- Prefer centralizing real backend integration in services rather than embedding fetch logic into pages, unless you are deliberately consolidating auth behavior.

## Data and Form Reality

- It keeps form state locally, submits to the backend through `contact.service.ts`, and resets the form after a successful response.
- Contact submissions are stored in the backend `contacts` table through the public API.
- Community create-post submissions require an authenticated user, a real channel slug, title, editor content, and optional image/video media up to 20 MB. Successful submissions redirect to `/cong-dong/bai-viet/{id}`.
- Gamification rank summaries use `badge` as an image path/URL. The old `icon`/`color` fields are obsolete. User gamification `/me` reads `current_rank`, `next_rank`, and `points_to_next_rank`; leaderboard rows read `member_rank` so `rank` remains the numeric leaderboard position. Leaderboard list responses are paginated, not full arrays.
- Public and authenticated profile responses include gamification summary fields `total_points` and `current_rank` for the profile sidebar panel.
- `/diem-cua-toi` loads point history from `/gamification/me/history` in pages of 5 entries and appends the next page through a “Tải thêm” button until the paginated response has no more pages.
- The community leaderboard right rail links to the seeded blog slug `gioi-thieu-bang-xep-hang`; its teaser card fetches the blog detail to show cover image, title, reading time, and published date.
- Learning course detail reads `enrollment_track` (`offline` or `online`) and `max_offline_slots` from the course detail contract. `max_offline_slots !== null` means the course has a parallel offline class; null means online-only. Offline lesson rows unlock all sessions that have started plus the nearest upcoming session, while online-only rows unlock completed lessons plus the next incomplete lesson. The progress sidebar renders offline track metrics as Điểm danh, Bài thực hành, Quiz, and Điểm XP; online track metrics render only Quiz and Điểm XP. The learner card displays the track label and shows the certificate claim CTA only when `progress >= 100`.
- Learning course cards/detail read `audience` (`club_member`, `cao_thang_student`, `public`) and display the target learner badge. Course detail uses that value to gate CTAs and lesson row access: `club_member` requires a non-`user` role, `cao_thang_student` requires a valid Cao Thắng student email, and `public` requires any logged-in account.
- Learning course feed `/khoa-hoc` can filter by audience through the public course list query param `audience` (`club_member`, `cao_thang_student`, `public`) alongside `search` and `category`.
- Lesson video navigation reads `session_start` on `prev_lesson`/`next_lesson`; the fixed footer disables `Tiếp` for a future lesson so users cannot navigate from an open video into content that has not started.
- Learning course detail remains publicly reachable, but its lesson-content column is gated for guests with a dashboard-style login panel. It consumes `user` and `loadingUser` from `MainLayout`'s outlet context so the authentication state stays consistent with the navbar; the learning sidebar stays hidden until an authenticated user is available.

## Environment Variables

- Current app uses:
- `VITE_API_URL`
- `VITE_BACKEND_URL`
- `VITE_REVERB_APP_KEY`
- `VITE_REVERB_HOST`
- `VITE_REVERB_PORT`
- `VITE_REVERB_SCHEME`
- `.env.example` exists for local setup. Production currently points Reverb to `api.ckcitclub.tech` over HTTPS/WSS, with DigitalOcean App Platform routing `/app` and `/apps` to the Reverb service.

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
- `src/components/ui/StacksEditorWrapper.tsx`
- `src/services/auth.service.ts`
- `src/config/axios.config.ts`
- `src/pages/LandingPage.tsx`
- `src/pages/ContactPage.tsx`
- `src/services/contact.service.ts`
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
- Contact form now submits to backend, but there is still no dedicated admin workflow for reviewing contact submissions from the public site.
- Axios auth behavior and actual auth storage are inconsistent.
- Axios redirects to a missing `/login` route.
- Several links in landing sections are still placeholders.
- Redux dependencies are installed but unused.
- Public branding assets partly depend on external Supabase-hosted images.

## Change Log

- `2026-06-26`: `getCurrentUser()` now skips `/auth/me` when no `localStorage.access_token` exists and clears stale tokens on `401`, preventing guest page loads from producing noisy auth-check 401s in the console.
- `2026-06-25`: Learning course catalog/detail now displays course audience badges and uses `course.audience` for eligibility instead of the old hard-coded "Sinh viên Cao Thắng hoặc thành viên CLB" rule. Public courses still require login before opening lessons.
- `2026-06-24`: Learning course detail no longer uses the main "Bắt đầu học" CTA to call course enrollment. Eligibility is evaluated as soon as the authenticated user opens `/khoa-hoc/:slug`: enrolled users, Cao Thang student email accounts (`@caothang.edu.vn` / `is_school_student`), and club members can open the first or nearest incomplete lesson directly; ineligible accounts see a non-button "Chỉ dành cho sinh viên Cao Thắng hoặc thành viên CLB" notice. Lesson rows and progress UI remain visible but disabled/faded for ineligible accounts, and the learner identity/track card is hidden unless the viewer can learn the course.
- `2026-06-22`: Quiz player feedback mirrors the admin preview exactly: after checking, correct options/blanks/positions/pairs turn green and wrong picks pink for every type. The bottom panel shows the question `explanation` below the verdict when present. It does NOT repeat the correct answer for types where it's already highlighted; only `fill_blank`/`word_bank_fill_blank` (text input, nothing to highlight) get an `Đáp án: …` reveal in the verdict line. Wrong-answer label is `Chưa đúng` (admin preview's label was also changed `Chưa chính xác` → `Chưa đúng`).
- `2026-06-22`: Added the Duolingo-style quiz player at `/khoa-hoc/:slug/:lessonSlug/quiz` (`src/pages/learning/QuizPlayPage.tsx`, registered before the `:videoSlug` route). It fetches `GET /learning/courses/{slug}/lessons/{lessonSlug}/quiz` (auth-optional) via `learningService.getQuiz`, runs one question at a time with a progress bar, gives immediate correct/wrong feedback + explanation (graded locally with the option `is_correct`/metadata returned by the API), then a results screen (score %, correct count, pass vs `pass_threshold`). On finish, logged-in users submit all answers to `POST .../quiz/submit` via `learningService.submitQuiz` (server re-grades authoritatively and records progress); guests get a local-only score with a "đăng nhập để lưu" prompt. Supports all persisted question types: multiple_choice, multiple_select (+ true_false preset), fill_blank, word_bank_fill_blank, word_order, matching — all tap-based. `ordering` is not supported; use `word_order` as the sole ordering template. Style matches the neo-brutalist learning UI (bold borders, hard shadows, `--color-primary` lime, pastel accents). `LessonDetailPage` "Làm quiz" now links to `.../quiz` (was the broken `.../quiz/{quiz.slug}`). New types/service methods live in `learning.types.ts` / `learning.service.ts` (`QuizPlay`, `QuizQuestion`, `QuizSubmitResult`, etc.). Quiz/option images currently render whatever URL the API returns (admin image upload still not implemented).
- `2026-06-13`: Event detail ticket modal now includes a `Tải QR` action that downloads the displayed ticket QR as a PNG file.
- `2026-06-13`: Event detail QR ticket viewing now falls back to `GET /community/events/{event}/my-ticket` when a registered user's QR token is missing after reload.
- `2026-06-10`: Blog detail reactions now support viewing the list of users who reacted, matching community post behavior.
- `2026-06-05`: Edit flows for community posts and blogs now present only cancel/save actions; blog edits save existing content without separate draft or submit-for-review buttons.
- `2026-06-01`: User chat room type contract no longer includes `type`; all chat rooms returned by `/community/chat-rooms` are treated as standard named rooms.
- `2026-06-01`: Community chat initially requests 30 latest messages and scroll-up pagination requests older batches with `before` plus `before_id` cursor parameters.

- `2026-05-30`: Profile overview now shows a Blog carousel below the Posts carousel, with a `Xem tất cả Blog` action that switches to the Blog tab.
- `2026-05-30`: Profile empty states now distinguish own profile copy (`Bạn chưa...`) from other-user copy (`Người dùng này...`).
- `2026-05-30`: Profile stats card uses `content_count` for total posts plus blogs, while tab badges continue using separate `posts_count` and `blogs_count`.
- `2026-05-30`: Profile tabs now split `Posts` and `Blog`; `Posts` badge uses only post count, while `Blog` has its own `blogs_count` badge and user-specific blog listing.
- `2026-05-30`: Profile sidebar share button now copies the canonical profile URL (`/@handle`) with toast feedback and a temporary copied state.
- `2026-05-30`: Added user-facing blog creation at `/blog/dang-bai`; blog feed create buttons now route there, and the form submits title/content/excerpt/tag IDs plus optional cover image to authenticated `POST /community/blogs`.
- `2026-05-30`: Blog feed filter bar now shows a desktop-only `Thêm` button and places search on the right from laptop/tablet width while keeping mobile search/tag layout compact.
- `2026-05-30`: Blog detail now shows a top cover-image block, moves blog tags into the breadcrumb, and renders post suggestions below the author bio: more posts by the same author and related posts sharing tags.
- `2026-05-29`: Community create post form now submits to the backend, supports optional image/video upload, validates required fields, and redirects to the created post detail page.
- `2026-05-29`: Community post card/detail overflow menus now switch options by ownership: own posts show pin/edit/privacy/archive/delete; other posts show save/report.
- `2026-05-29`: Community post detail now renders saved Markdown through `markdown-it` with Stacks-style prose styling instead of showing raw Markdown markers.
- `2026-05-29`: Community feed post excerpts now render Markdown, truncate by text with `...`, and support inline `Xem thêm` expansion for long content.
- `2026-05-29`: Community create post page now relies on `CommunityLayout` for community chrome and renders only the main create-post form content.
- `2026-05-29`: Blog routes are standalone `/blog` pages, not community-layout pages; community layout no longer contains blog-specific state or active checks.
- `2026-05-27`: Community create Stacks editor table toolbar now shows a single table control: insert table outside tables, and table-format dropdown when the selection is inside a table.
- `2026-05-27`: `StacksEditorWrapper` now syncs the Heading toolbar state with the active rich-text selection and shows `H1`/`H2`/`H3` only when the selected text is inside a heading.
- `2026-04-08`: Replaced scaffold with full user frontend audit. Added landing-page structure, neo-brutalist design assumptions, auth/session model, service conventions, env notes, and known gap inventory.
