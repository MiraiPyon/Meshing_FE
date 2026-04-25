# Meshing_FE

Frontend cho nền tảng Web mô phỏng **Meshing 2D đa phương thức** và **Dashboard quản lý chất lượng phần tử hữu hạn**.

---

## Tính năng

### Khởi tạo mô hình hình học
- **Vẽ tay tự do (Sketch → PSLG)**: vẽ outer boundary và holes trực tiếp trên canvas
- **Select & Drag**: chọn và kéo điểm để chỉnh hình
- **Eraser**: cắt bỏ draft strokes
- **Undo/Reset**: quay lại thao tác hoặc xóa toàn bộ workspace
- Tự động chuẩn hóa orientation (CCW cho outer, CW cho holes)

### Động cơ chia lưới
- **T3** (Tam giác 3 nút) — Delaunay triangulation qua Backend
- **Q4** (Tứ giác 4 nút) — Structured grid qua Backend
- Hỗ trợ **polygon có holes** (lỗ thủng)
- Cấu hình: Min Angle, R/L Ratio, Grid Spacing, nx×ny
- **Fallback**: nếu chưa đăng nhập, dùng local preview mesh

### Dashboard phân tích chất lượng
- **Topology Snapshot**: Nodes, Edges, Elements, DOF
- **Distribution Preview**: biểu đồ phân bố kích thước phần tử (Recharts)
- **Execution Time**: thời gian tạo lưới
- **Console log**: hiển thị quá trình meshing real-time

### Quản lý dự án & Xuất dữ liệu
- **Export**: JSON / DAT (MATLAB format) / CSV — download trực tiếp từ Dashboard
- **Auth**: Google OAuth2 → JWT, auto-refresh khi token hết hạn
- **Logout**: revoke refresh token trên Backend

---

## Quick Start

```bash
# 1. Cài dependencies
npm install

# 2. Tạo .env
cp .env.example .env
# Sửa VITE_GOOGLE_CLIENT_ID với Google Client ID của bạn

# 3. Chạy dev server
npm run dev
```

Mở: `http://localhost:5173`

> **Lưu ý**: Cần chạy Backend (`Meshing_BE`) để có đầy đủ tính năng (mesh generation, export, auth).

---

## Cấu trúc thư mục

```
src/
├── app/
│   ├── components/
│   │   ├── auth/                    # LogoutConfirmDialog
│   │   ├── dashboard/               # Header, Sidebar, Panels, Canvas, Footer
│   │   ├── landing/                 # Landing page components
│   │   └── ui/                      # Skeleton, Dialog, etc.
│   ├── pages/
│   │   ├── AuthCallback.tsx         # Google OAuth callback → JWT
│   │   ├── Dashboard.tsx            # Main workspace
│   │   ├── Landing.tsx              # Landing page
│   │   └── Login.tsx                # Login page
│   ├── App.tsx
│   └── routes.ts
├── hooks/
│   └── useMeshAPI.ts                # Backend mesh integration hook
├── infrastructure/
│   ├── auth/
│   │   └── local-storage-auth.ts    # Token management (access, refresh, profile)
│   └── canvas/
│       └── coordinates.ts           # Screen → canvas coordinate transform
├── modules/
│   ├── analysis/                    # DOF, mesh stats, quality distribution
│   ├── geometry/                    # Point, Loop, PSLG, orientation, point-in-polygon
│   ├── meshing/                     # Preview refinement, strategy pattern (T3/Q4)
│   └── workspace/                   # State machine, commands, selectors
├── services/
│   └── apiClient.ts                 # Full API client (auth, geometry, mesh, FEA, export)
├── store/
│   └── meshStore.ts                 # Mesh ID state (geometry_id, mesh_id)
└── styles/
```

---

## Kiến trúc & Design Patterns

| Pattern | Ở đâu |
|---------|-------|
| **Layered Architecture** | `app/` → `modules/` → `infrastructure/` |
| **Strategy Pattern** | `T3MeshingStrategy` / `Q4MeshingStrategy` |
| **State Machine** | `workspace-machine.ts` — mode transitions |
| **Command Pattern** | `close-shape`, `undo`, `move-point`, `erase-stroke` |
| **Facade/ViewModel** | `useDashboardWorkspace()` — gom toàn bộ state |
| **Observer** | React state updates → Dashboard panels re-render |
| **Factory** | `getMeshingStrategy(elementType)` |

---

## Auth Flow (Google OAuth2 → JWT)

```
[Login page] ──redirect──▶ [Google OAuth]
                                │
                    redirect back to /auth/callback?code=xxx
                                │
              POST /api/auth/callback {code, redirect_uri}
                                │
              ◀── {access_token, refresh_token}
                                │
              localStorage: access_token, refresh_token, profile
                                │
[Dashboard] ── all API calls use Bearer token ──▶ [Backend]
                                │
              auto-refresh on 401 using refresh_token
```

---

## API Integration

Frontend gọi Backend qua `src/services/apiClient.ts`:

| Category | Methods |
|----------|---------|
| **Auth** | `exchangeAuthCode`, `getMe`, `logout` |
| **Geometry** | `createRectangle`, `createCircle`, `listGeometries`, `deleteGeometry` |
| **Mesh** | `createMeshFromSketch`, `createDelaunayMesh`, `createQuadMesh`, `getMesh`, `listMeshes`, `deleteMesh`, `exportMesh` |
| **FEA** | `solveFEA` |

Auto-refresh: khi nhận HTTP 401, tự động gọi `/api/auth/refresh` rồi retry request.

---

## Mesh Generation Flow

```
[User draws shape] → Close Shape → Generate Mesh
                                         │
                          ┌── Logged in? ─┤
                          │               │
                     [Backend]       [Local preview]
                          │               │
          POST /api/mesh/from-sketch      previewRefinement()
                          │               │
              BE returns nodes[]         FE sampling
              + elements[]              + neighbor edges
                          │               │
                    ┌─────┴─────┐         │
                    ▼           ▼         ▼
              Canvas render   Stats    Canvas render
```

---

## Scripts

```bash
npm run dev          # Dev server (Vite)
npm run build        # Production build
npm run typecheck    # TypeScript check
npm run build:pages  # Build for GitHub Pages
npm run ci:check     # Full CI check
```

---

## Biến môi trường

```env
VITE_BASE_PATH=/
VITE_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
VITE_GOOGLE_REDIRECT_URI=http://localhost:5173/auth/callback
```

---

## Công nghệ

- React 18 + TypeScript
- Vite 6
- React Router 7
- Tailwind CSS 4
- Recharts (biểu đồ)
- Radix UI (dialogs)
- Motion (animations)
- Lucide React (icons)
- HTML Canvas API (mesh rendering)

---

## License

MIT
