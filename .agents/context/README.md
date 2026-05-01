# CKC IT Club Project Context

## Purpose
- This directory is the centralized project knowledge base for AI agents working in this repository.
- Canonical project context lives here.
- Folder-local `AGENTS.md` files elsewhere in the repo are intentionally thin entrypoints that route agents to the right file in this directory.

## Context Files
- `backend.md`: Laravel backend context and backend-specific operating rules.
- `frontend-admin.md`: admin frontend context and frontend-admin operating rules.
- `frontend-user.md`: user-facing frontend context and frontend-user operating rules.

## Routing Rule
- If working under `backend/`, read `.agents/context/backend.md`.
- If working under `frontend/admin/`, read `.agents/context/frontend-admin.md`.
- If working under `frontend/user/`, read `.agents/context/frontend-user.md`.
- If work spans multiple apps, read all relevant files before planning changes.

## Maintenance Rule
- Any agent changing behavior or operational assumptions in any app MUST update the relevant file in this directory before finishing.
- Update context when changing:
- routes
- auth or authorization
- data contracts
- schema or relationships
- environment variables
- deployment flow
- architectural boundaries
- important conventions or source-of-truth files

## Repository Map
- `backend/`: Laravel API backend.
- `frontend/admin/`: React + TypeScript admin dashboard.
- `frontend/user/`: React + TypeScript public/user-facing frontend.
- `.agents/skills/`: project-specific skills and workflows for Codex.

## Documentation Trust Rule
- Do not assume the root `README.md` or package `README.md` files are fully current.
- Prefer code and the context files in this directory when documentation conflicts.

## Change Log
- `2026-04-07`: Centralized project context introduced under `.agents/context`. Root and app-local `AGENTS.md` files converted to routing stubs.
