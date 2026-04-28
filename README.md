# Meshing_FE

React/Vite frontend for the Meshing 2D platform. It provides the interactive canvas, geometry primitive forms, mesh configuration, quality dashboard, project snapshots, export actions, and Quick FEA workflow.

## Capabilities

- Sketch workspace: draw outer boundaries and holes, close shapes, select/move points, pan, wheel zoom, undo one step, reset geometry.
- Geometry primitive forms: rectangle, circle, triangle, polygon CRUD through backend geometry endpoints.
- Meshing controls: T3 Delaunay and Q4 mapped mesh, `theta_min`, `r/l`, maximum edge length, and Q4 `nx/ny`.
- Dashboard: topology counts, DOF, backend quality metrics, distribution chart, connectivity matrix previews, console log.
- Project and export flow: save/load/delete snapshots, export `json`, `dat`, `csv`, `csv_zip`, and `shape`.
- Quick FEA: detects cantilever edges, sends material/load/BC to backend, and displays solver summary plus benchmark payload when available.

## Quick Start

```bash
npm install
cp .env.example .env
# Edit VITE_GOOGLE_CLIENT_ID and VITE_GOOGLE_REDIRECT_URI
npm run dev
```

App URL: `http://localhost:5173`

Backend must be running at the configured API base URL for auth, persistence, meshing, export, snapshots, and FEA.

## Environment

Common local `.env` values:

```env
VITE_BASE_PATH=/
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
VITE_GOOGLE_REDIRECT_URI=http://localhost:5173/auth/callback
VITE_API_BASE_URL=http://localhost:8000/api
```

Never commit real `.env` files.

## Validation Commands

```bash
npm run typecheck
npm run build
```

Recommended full release check with backend:

1. Start backend and database.
2. Start frontend dev server.
3. Login or use a local test token in a controlled dev environment.
4. Run through: primitive/draw -> mesh T3/Q4 -> snapshot -> Quick FEA -> export all formats.
5. Check backend benchmark report: `../Meshing_BE/docs/cantilever-benchmark-report-2026-04-28.md`.

## Main Source Layout

```txt
src/app/           pages and dashboard UI components
src/hooks/         backend API orchestration hooks
src/infrastructure auth/canvas utilities
src/modules/       geometry, meshing, analysis, workspace domain logic
src/services/      API client and wire contracts
src/store/         mesh/geometry id store
src/styles/        global styling
```

## API Integration Notes

- Auth uses Google OAuth callback -> backend JWT -> local token storage.
- All protected backend calls use bearer tokens and retry once after refresh on `401`.
- Geometry primitive forms map directly to backend rectangle/circle/triangle/polygon endpoints.
- Mesh preview renders backend nodes/elements and dashboard metrics when available.
- Quick FEA uses the current backend mesh id; generate or load a mesh before running it.

## GitHub Hygiene

Commit source, docs, and `.env.example`. Do not commit `node_modules`, `dist`, local `.env`, logs, caches, or TypeScript build info.
