---
name: frontend-user-style
description: Soft neo-brutalism style guide for CKC IT Club user-facing frontend (frontend/user). Use when adding or changing UI so new screens match existing tokens, layouts, motion, and assets.
---

# CKC User Frontend Style

Use this skill whenever you work inside `frontend/user`. It captures the current soft neo-brutalism look: thick black outlines, pastel fills, playful motion, and bold Vietnamese typography.

## Quick Start

- Import `src/index.css` so Tailwind + design tokens are available.
- Build sections with `neo-section` + `neo-container`; keep `--section-padding` and `--content-max` intact.
- Reuse primitives: `neo-card` (2px border, brutalist shadow), `neo-card-static` (for cards that should not zoom on hover), `neo-btn` (`neo-btn-primary` green, `neo-btn-secondary` white), `neo-tag`, `section-divider`, `fade-in-up`, `animate-float`.
- Stick to fonts: headings `Be Vietnam Pro` (700–800), body `Inter`. Both loaded in `index.html`.
- Default text color black; muted text `#6b7280`; backgrounds mostly white or surface `#f9fafb`.

## Design Tokens (from `src/index.css`)

- Brand: primary `#A3E635`, primary-dark `#84CC16`, secondary `#35D399`.
- Base surfaces: background `#fff`, surface `#f9fafb`, border/text `#111`; dark mode tokens exist but are unused in UI.
- Pastels: green `#D2FAE5`, blue `#BFD9FE`, pink `#FFDEDE`, yellow `#FEF3C8`, amber `#FBBF25`, purple `#FAE9FF`/`#F5D1FE`, orange `#FFF3E0`.
- Neo styling: border `2px solid #111`, shadow `4px 4px 0 #111` (hover `6px 6px 0`), radius `14px` (cards) / `10px` (buttons).
- Spacing: `--section-padding: 5rem 0`; container max width 1280px.

## Layout & Rhythm

- Section wrapper: `section.neo-section` with `padding-left/right: 1.5rem`; pair with `div.neo-container` for centered 1280px width.
- Headlines use `font-extrabold`, tight leading, sometimes wrapped with a primary highlight box (2px border + shadow).
- Grids: 3-col for action cards, 2x2 for values, 1/2 split for text + imagery. Switch to single column on mobile via Tailwind (`grid-cols-1` + `md:grid-cols-*`).
- Maintain 2px dividers (`border-b-2 border-black`) for list rows (e.g., leaderboard) and a thin black bar at section bottoms when present.

## Components to Reuse

- **Cards**: apply `neo-card` and a pastel `background`. If a card should keep static size on hover (e.g. long forms), add `neo-card-static` together with `neo-card`.
- **Buttons**: `neo-btn` plus variant. Primary = green fill, secondary = white. Use bold heading font, small uppercase optional; hover/active rely on built-in shadow shifts.
- **Tags/Badges**: `neo-tag` for uppercase microcopy; for pill badges use rounded-full with border-2 + shadow `2px 2px 0 #111`.
- **Stats**: numbers use font-heading, often with `WebkitTextStroke: 1px #111` and primary color fill; labels uppercase xs.
- **Tables/Rows**: leaderboard rows use `border-b-2 border-black`, avatars have `border-2 border-black` and fallback to ui-avatars.
- **Nav/Footer**: fixed top nav with border-2 + shadow, mobile drawer; footer on black background, white text, lime accent.

## Motion & Effects

- Entrance: add `fade-in-up` to elements and toggle `visible` via IntersectionObserver (see any LandingPage section for the pattern). Keep stagger by inline `transitionDelay`.
- Floating accents: add `animate-float` or custom `animationDelay` to SVG blobs in `public/assets/svg/`.
- Shadows: prefer `var(--neo-shadow)`; on hover scale slightly and reduce shadow (`neo-card:hover`, `neo-btn:hover`). Use `neo-card-static` to disable card zoom when needed.
- Scroll helpers: `BackToTop` uses fixed brutalist pill; reuse if long pages.

## Imagery & Iconography

- Icons: use `lucide-react`; size 16–24px; stroke defaults; pair with text in bold font.
- Avatars: prefer DiceBear (`https://api.dicebear.com/9.x/avataaars/svg?seed=`) with pastel backgrounds; fall back to `ui-avatars` with primary color.
- Emojis: keep in cards and stats for warmth (see ACTIONS/VALUES lists).
- Backgrounds: hero gradient `linear-gradient(#9de8f0,#d6f2f6 35%,#eafdff 55%)`; wavy overlay via `.hero_bg`, `.home_wave` + `light_curve-image` with black bottom bar.

## Implementation Checklist

- [ ] Import `index.css` once; avoid duplicating token definitions.
- [ ] Wrap new sections in `neo-section` + `neo-container`; respect existing padding.
- [ ] Use `neo-card/neo-btn/neo-tag` before inventing new variants; keep 2px black borders and 4–6px shadows.
- [ ] If a card must not hover-zoom (forms, dense content), pair `neo-card` with `neo-card-static`.
- [ ] Colors come from CSS variables; avoid ad-hoc hex except for approved pastels.
- [ ] Add `fade-in-up` + observer for scroll-in effects; apply small delays to create stagger.
- [ ] Keep text Vietnamese-friendly: headings bold, body 14–16px with `text-gray-600`; links hover to lime or white depending on background.
- [ ] Ensure mobile: collapse grids to single column, nav toggles via hamburger, buttons full-width when narrow.

## File Pointers

- Tokens and utilities: `frontend/user/src/index.css` and `App.css` (line clamp, scroll helpers).
- Example patterns: landing sections under `frontend/user/src/components/landing-page/*.tsx`, layout in `layouts/MainLayout.tsx`, nav/footer/back-to-top in `components/partials/`.
