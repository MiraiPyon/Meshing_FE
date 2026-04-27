# Manual Release Test Report - 2026-04-27

Release target: Meshing 2D FE/BE submission build.

## Automated Evidence

| Check | Command / Scenario | Result | Notes |
|---|---|---:|---|
| Backend regression | `.venv/bin/python -m pytest -q` | PASS | 103 passed, 1 skipped |
| Backend lint | `.venv/bin/ruff check app tests` | PASS | All checks passed |
| Frontend typecheck | `npm run typecheck` | PASS | TypeScript clean |
| Frontend build | `npm run build` | PASS | Vite production build completed |
| Browser smoke | Playwright + real backend on localhost | PASS | Triangle primitive, T3 mesh, wheel zoom, shape.dat mesh, snapshot, Quick FEA, JSON export |

## Manual Checklist

| ID | Precondition | Steps | Expected | Actual | Status | Evidence / Notes |
|---|---|---|---|---|---:|---|
| G-PSLG-01 | Backend running | Build PSLG with reversed outer and reversed hole | Outer normalized CCW, hole normalized CW, duplicate/collinear points removed | Backend tests verify orientation and segment generation | PASS | `test_pslg_normalization_enforces_outer_ccw_and_hole_cw` |
| G-VAL-01 | Backend running | Submit bowtie/self-intersecting polygon | Reject invalid boundary before meshing | Backend raises self-intersection validation error | PASS | `test_pslg_rejects_self_intersection` |
| G-RECT-01 | Logged in | Create rectangle primitive from UI/API | Record appears and canvas can load rectangle | Existing primitive CRUD + API regression pass | PASS | Geometry endpoints covered |
| G-CIRC-01 | Logged in | Create circle primitive from UI/API | Record appears and canvas approximates circle | Existing primitive CRUD + API regression pass | PASS | Circle maps to 64-point loop |
| G-TRI-01 | Logged in | Create triangle primitive from UI | Record appears with geometry type `triangle` | Browser smoke created triangle record | PASS | Playwright smoke |
| G-POLY-01 | Logged in | Create polygon primitive with 3+ points | Record appears and canvas loads polygon | Existing primitive CRUD path retained | PASS | Polygon validation and API covered |
| G-LIST-01 | Logged in | Refresh geometry records | Backend records sync to UI | List endpoint and UI records work | PASS | Browser/API smoke |
| G-GET-01 | Logged in | Load geometry by id | Canvas uses backend detail | Geometry detail handler maps rectangle/circle/triangle/polygon | PASS | UI load path retained |
| G-DEL-01 | Logged in | Delete geometry by id | Record removed; active workspace resets if needed | Delete handler clears active state and mesh ids | PASS | Existing CRUD behavior retained |
| M-T3-01 | Valid PSLG/shape.dat | Generate T3 Delaunay mesh | Native BuildDelaunay creates triangles and refinement metrics | Backend generated mesh in smoke and tests | PASS | Quad-edge D&C path, no SciPy Delaunay import in engine |
| M-Q4-01 | Rectangle geometry | Generate Q4 mapped mesh | Structured Q4 mesh with nx/ny | Backend Q4 tests pass; FE exposes nx/ny controls | PASS | `test_quad_mesh_generates_ccw_elements` |
| M-HOLE-01 | Wrench-like model with holes | Generate Delaunay mesh | Completes without infinite loop and preserves domain holes | Backend test passes | PASS | `test_delaunay_stability_for_wrench_like_polygon_with_holes` |
| Q-01 | Mesh generated | Inspect dashboard quality | DOF, min angle, r/l, empty circumcircle, matrices visible | FE now consumes backend `dashboard` and `connectivity_matrices` | PASS | Browser smoke saw metrics/matrices |
| Q-02 | Mesh generated | Inspect connectivity matrices | Nodes, edges, tris matrix preview visible | Matrix preview renders first rows | PASS | Browser smoke |
| E-EXPORT-01 | Backend mesh exists | Export json/dat/csv/csv_zip/shape | Downloadable solver formats | JSON browser export passes; backend tests cover CSV and CSV ZIP; service supports dat/shape | PASS | Export endpoints retained |
| E2E-01 | Logged in | shape.dat -> mesh -> dashboard -> export | Mesh renders and dashboard updates | Browser smoke passed | PASS | Real backend localhost |
| UX-01 | Dashboard open | Toggle Guide and keybindings | Guide does not block canvas when hidden | Previously verified by Playwright smoke | PASS | Guide button + `H` shortcut |
| UX-02 | Draw multiple strokes | Press Undo once | Only one step is undone, not reset | Undo command removes latest draft stroke first, reopens closed outer as draft | PASS | Command logic verified |
| UX-03 | Canvas focused | Mouse wheel over canvas | Zoom changes smoothly | Browser smoke `100% -> 125%` | PASS | Playwright smoke |
| UX-04 | Select mode | Drag empty canvas | Canvas pans without altering geometry | Pan transform retained in renderer | PASS | Prior pixel smoke + current build |
| FEA-01 | Backend mesh exists | Run Quick FEA | Solver returns displacement/stress summary | Backend FEA suite passes | PASS | FEA regression tests |

## Release Notes

- Native `BuildDelaunay` path is now backend-owned, uses quad-edge divide-and-conquer with InCircle checks, and does not call SciPy/Qhull for triangulation.
- PostgreSQL enum upgrade guard adds `TRIANGLE` automatically during `init_db()` for old local databases.
- Canvas-scale sketch meshing now scales frontend `maxLength` before calling the backend, while backend density logic keeps small `shape.dat` models refined by `resolution`.
- Current native Delaunay path is correct but slower than the previous SciPy path; full backend suite completed in 66.81s on this machine.
