# CI/CD cho Meshing_FE

## 1. Mục đích tài liệu

Tài liệu này mô tả chi tiết hệ thống CI/CD hiện tại của project `Meshing_FE`, bao gồm:

- Mục tiêu của pipeline
- Thành phần đang được sử dụng
- Cách luồng CI hoạt động
- Cách luồng CD hoạt động
- Các file cấu hình liên quan
- Các biến môi trường cần thiết
- Cách kiểm tra cục bộ trước khi push
- Cách vận hành trên GitHub
- Những giới hạn hiện tại và hướng mở rộng

Tài liệu này dành riêng cho project hiện tại, không phải mô tả CI/CD chung chung.

## 2. Tổng quan kiến trúc CI/CD

Project đang dùng mô hình:

- `CI` bằng GitHub Actions để kiểm tra chất lượng code
- `CD` bằng GitHub Actions để build và deploy frontend tĩnh lên GitHub Pages

Mô hình triển khai hiện tại phù hợp vì:

- Project là frontend-only
- Không có backend riêng trong repo
- Ứng dụng build ra thư mục tĩnh `dist/`
- GitHub Pages đủ để host một ứng dụng Vite/React dạng static

Luồng tổng quát:

1. Developer push code hoặc mở pull request.
2. GitHub Actions chạy pipeline CI.
3. Pipeline cài dependency, kiểm tra TypeScript và build project.
4. Nếu code được merge vào `main`, pipeline CD được kích hoạt.
5. CD build artifact phù hợp cho GitHub Pages.
6. Artifact được upload và deploy lên GitHub Pages.
7. Website được publish công khai qua URL Pages của repository.

## 3. Công cụ đang sử dụng

Hệ thống CI/CD hiện tại sử dụng:

- `GitHub Actions` để chạy workflow
- `npm ci` để cài dependency trong môi trường CI
- `TypeScript` để kiểm tra kiểu dữ liệu
- `Vite` để build frontend
- `GitHub Pages` để host bản build production

## 4. Các file liên quan trong repo

Các file chính của CI/CD:

```text
.github/workflows/ci.yml
.github/workflows/deploy-pages.yml
scripts/prepare-pages.mjs
package.json
vite.config.ts
tsconfig.json
tsconfig.node.json
.env.example
src/app/routes.ts
src/app/pages/Login.tsx
src/vite-env.d.ts
```

Vai trò từng file:

- `.github/workflows/ci.yml`: workflow kiểm tra code khi push/pull request
- `.github/workflows/deploy-pages.yml`: workflow build và deploy lên GitHub Pages
- `scripts/prepare-pages.mjs`: chuẩn bị artifact cho GitHub Pages
- `package.json`: khai báo script CI/CD
- `vite.config.ts`: cấu hình base path để deploy ở root path hoặc subpath
- `tsconfig.node.json`: hỗ trợ type-check cho file cấu hình Vite
- `.env.example`: mô tả các biến môi trường dùng khi deploy
- `src/app/routes.ts`: router dùng `basename` theo `BASE_URL`
- `src/app/pages/Login.tsx`: tính toán redirect URI phù hợp cho môi trường deploy
- `src/vite-env.d.ts`: khai báo type cho các biến `import.meta.env`

## 5. CI hiện tại hoạt động như thế nào

Workflow CI nằm trong:

```text
.github/workflows/ci.yml
```

### 5.1. Trigger

CI sẽ chạy trong hai trường hợp:

- Khi có `pull_request`
- Khi có `push` vào nhánh `main`

Điều này giúp:

- Pull request được kiểm tra trước khi merge
- Nhánh `main` luôn được xác minh sau mỗi lần cập nhật

### 5.2. Môi trường chạy

Workflow dùng:

- `ubuntu-latest`
- `Node.js 20`

Lý do:

- Ổn định, phổ biến và tương thích tốt với Vite/TypeScript
- Có cache `npm` để giảm thời gian cài dependency

### 5.3. Các bước trong CI

Pipeline CI hiện tại gồm các bước:

1. `Checkout source`
   - Lấy source code từ repository

2. `Setup Node.js`
   - Cài đúng phiên bản Node.js
   - Bật cache cho npm

3. `Install dependencies`
   - Chạy `npm ci`
   - Đảm bảo môi trường cài đặt chính xác theo `package-lock.json`

4. `Run type checks`
   - Chạy `npm run typecheck`
   - Bao gồm:
     - `tsc --noEmit`
     - `tsc --noEmit -p tsconfig.node.json`

5. `Build application`
   - Chạy `npm run build`
   - Xác minh project build được ở trạng thái production

### 5.4. Mục tiêu của CI

CI hiện tại đảm bảo tối thiểu 3 điều:

- Code TypeScript không lỗi
- Cấu hình Vite không lỗi
- Ứng dụng có thể build thành công

Đây là mức CI phù hợp với trạng thái hiện tại của repo vì project chưa có:

- unit test
- integration test
- lint workflow

## 6. CD hiện tại hoạt động như thế nào

Workflow CD nằm trong:

```text
.github/workflows/deploy-pages.yml
```

### 6.1. Trigger

CD sẽ chạy khi:

- Có `push` vào nhánh `main`
- Hoặc được chạy thủ công qua `workflow_dispatch`

Điều này cho phép:

- Tự động deploy sau khi merge
- Có thể bấm chạy lại deploy nếu cần

### 6.2. Permissions

Workflow deploy dùng các quyền:

- `contents: read`
- `pages: write`
- `id-token: write`

Các quyền này là cấu hình chuẩn để GitHub Actions có thể publish artifact lên GitHub Pages.

### 6.3. Concurrency

Workflow dùng:

```yaml
concurrency:
  group: github-pages
  cancel-in-progress: true
```

Ý nghĩa:

- Chỉ giữ một lần deploy Pages đang chạy tại một thời điểm
- Nếu có commit mới hơn, job deploy cũ sẽ bị hủy
- Giảm việc publish nhầm bản build cũ

### 6.4. Các job trong CD

CD hiện có 2 job:

- `build`
- `deploy`

#### Job build

Job này thực hiện:

1. Checkout source
2. Cấu hình GitHub Pages
3. Cài Node.js 20
4. Chạy `npm ci`
5. Chạy `npm run typecheck`
6. Chạy `npm run build:pages`
7. Upload artifact từ thư mục `dist`

#### Job deploy

Job này:

- Chờ `build` hoàn thành
- Gọi action `actions/deploy-pages@v4`
- Publish artifact vừa upload lên môi trường `github-pages`

## 7. Script CI/CD trong package.json

Project hiện có các script sau:

```json
"scripts": {
  "build": "vite build",
  "build:pages": "vite build && node ./scripts/prepare-pages.mjs",
  "ci:check": "npm run typecheck && npm run build",
  "dev": "vite",
  "typecheck": "tsc --noEmit && tsc --noEmit -p tsconfig.node.json"
}
```

### 7.1. `npm run typecheck`

Script này dùng để kiểm tra TypeScript cho hai nhóm:

- Code ứng dụng frontend
- File cấu hình Node/Vite

Nó quan trọng vì project có cả:

- code chạy trên browser
- file config chạy trong môi trường Node

### 7.2. `npm run build`

Build production thông thường bằng Vite:

- tạo thư mục `dist`
- dùng cho kiểm tra CI hoặc build local

### 7.3. `npm run build:pages`

Script này dùng cho deploy GitHub Pages.

Nó gồm hai phần:

1. `vite build`
2. `node ./scripts/prepare-pages.mjs`

Mục đích:

- build ứng dụng
- thêm các file đặc biệt để GitHub Pages phục vụ SPA đúng cách

### 7.4. `npm run ci:check`

Script này mô phỏng phần kiểm tra quan trọng nhất của CI ở local:

1. type-check
2. build

Developer nên chạy script này trước khi push các thay đổi lớn.

## 8. Tại sao cần `prepare-pages.mjs`

GitHub Pages không xử lý SPA routing giống như một web server có cấu hình rewrite đầy đủ.

Vấn đề thường gặp:

- Nếu người dùng truy cập trực tiếp vào `/dashboard`
- Hoặc reload trang đang ở route con
- GitHub Pages có thể trả về `404`

Để giảm vấn đề đó, script `prepare-pages.mjs` làm các việc sau:

### 8.1. Tạo `404.html`

Script copy nội dung của `dist/index.html` sang `dist/404.html`.

Ý nghĩa:

- Khi GitHub Pages không tìm thấy route vật lý
- Nó trả về `404.html`
- Vì `404.html` chứa chính shell của SPA, ứng dụng React vẫn có thể boot và xử lý route phía client

### 8.2. Tạo `.nojekyll`

GitHub Pages mặc định có thể chạy Jekyll.

`.nojekyll` giúp:

- tắt cơ chế xử lý Jekyll
- tránh việc một số file/thư mục tĩnh bị bỏ qua ngoài ý muốn

### 8.3. Tạo `CNAME` nếu có custom domain

Nếu biến `GITHUB_PAGES_CNAME` được cấu hình, script sẽ tạo file:

```text
dist/CNAME
```

Điều này cho phép:

- deploy cùng custom domain
- không cần chỉnh tay file `CNAME` sau mỗi lần build

## 9. Cấu hình deploy cho Vite và Router

Để CD thật sự deploy được, project đã được chỉnh để chạy đúng trên subpath.

### 9.1. `VITE_BASE_PATH` trong `vite.config.ts`

Vite dùng:

```ts
base: normalizeBasePath(process.env.VITE_BASE_PATH)
```

Điều này quyết định:

- prefix của asset path
- cách browser tải JS/CSS sau khi deploy

Ví dụ:

- local: `/`
- GitHub Pages repo `Meshing_FE`: `/Meshing_FE/`

### 9.2. `basename` trong React Router

Router dùng `basename` lấy từ `import.meta.env.BASE_URL`.

Ý nghĩa:

- route `/dashboard` sẽ được hiểu đúng dưới base path
- tránh lỗi điều hướng khi app không chạy ở root domain `/`

Ví dụ:

- local: `/dashboard`
- GitHub Pages: `/Meshing_FE/dashboard`

## 10. Cấu hình Google OAuth trong môi trường deploy

Trước đây `GOOGLE_REDIRECT_URI` bị hardcode về localhost.

Hiện tại project đã được đổi sang mô hình linh hoạt hơn:

- ưu tiên lấy từ `VITE_GOOGLE_REDIRECT_URI`
- nếu không có thì tự suy ra từ:
  - `window.location.origin`
  - `import.meta.env.BASE_URL`

Điều này giúp cùng một codebase có thể chạy ở:

- local
- GitHub Pages
- custom domain

### 10.1. Các biến môi trường liên quan

File mẫu:

```text
.env.example
```

Nội dung:

```env
VITE_BASE_PATH=/
VITE_GOOGLE_CLIENT_ID=
VITE_GOOGLE_REDIRECT_URI=
```

### 10.2. Biến dùng trong workflow deploy

Workflow deploy nhận các GitHub repository variables:

- `VITE_BASE_PATH`
- `VITE_GOOGLE_CLIENT_ID`
- `VITE_GOOGLE_REDIRECT_URI`
- `GITHUB_PAGES_CNAME`

### 10.3. Giá trị mặc định của `VITE_BASE_PATH`

Nếu `VITE_BASE_PATH` không được cấu hình, workflow deploy sẽ dùng mặc định:

```text
/<repository-name>/
```

Ví dụ repository tên `Meshing_FE` thì mặc định sẽ là:

```text
/Meshing_FE/
```

Đây là cấu hình phù hợp cho GitHub Pages kiểu:

```text
https://<username>.github.io/Meshing_FE/
```

## 11. Cách bật CI/CD trên GitHub

### 11.1. Bật GitHub Pages

Thực hiện trên GitHub:

1. Vào `Settings` của repository
2. Chọn `Pages`
3. Tại `Build and deployment`
4. Chọn `Source = GitHub Actions`

Lưu ý quan trọng:

- Nếu repository chưa bật Pages và muốn workflow tự bật bằng `actions/configure-pages@v5` với `enablement: true`, cần tạo secret `PAGES_ADMIN_TOKEN`.
- `GITHUB_TOKEN` mặc định thường không có đủ quyền để gọi API tạo Pages site, dẫn tới lỗi `Resource not accessible by integration`.
- `PAGES_ADMIN_TOKEN` nên là Fine-grained PAT có quyền tối thiểu:
  - `Administration: Read and write` (repository permission)
  - `Pages: Read and write` (repository permission)

### 11.2. Cấu hình repository variables

Vào:

```text
Settings > Secrets and variables > Actions > Variables
```

Nên tạo:

- `VITE_GOOGLE_CLIENT_ID`
- `VITE_GOOGLE_REDIRECT_URI`

Có thể tạo thêm:

- `VITE_BASE_PATH`
- `GITHUB_PAGES_CNAME`

Ngoài variables, cần thêm Actions secret nếu muốn tự động enable Pages:

- `PAGES_ADMIN_TOKEN`

Đường dẫn cấu hình:

```text
Settings > Secrets and variables > Actions > Secrets
```

### 11.3. Cấu hình Google Cloud Console

Nếu dùng login Google trên môi trường deploy, cần thêm callback URL tương ứng vào phần OAuth của Google Cloud.

Ví dụ:

- local:
  - `http://localhost:5173/auth/callback`
- GitHub Pages:
  - `https://<username>.github.io/Meshing_FE/auth/callback`
- custom domain:
  - `https://<your-domain>/auth/callback`

Nếu callback URL không được whitelist, flow login sẽ lỗi dù pipeline deploy thành công.

## 12. Quy trình làm việc khuyến nghị cho team

Quy trình đề xuất:

1. Tạo branch feature từ `main`
2. Code và test local
3. Chạy:

```bash
npm run ci:check
```

4. Push branch lên GitHub
5. Mở pull request
6. Chờ workflow `CI` pass
7. Merge vào `main`
8. Workflow `Deploy to GitHub Pages` tự chạy
9. Kiểm tra site sau deploy

Lợi ích của quy trình này:

- Giảm nguy cơ merge code lỗi build
- Đảm bảo deploy luôn đi từ code đã pass type-check
- Giữ `main` ở trạng thái sẵn sàng phát hành

## 13. Cách kiểm tra local trước khi push

### Kiểm tra CI

```bash
npm run ci:check
```

### Kiểm tra CD theo base path giống Pages

PowerShell:

```powershell
$env:VITE_BASE_PATH='/Meshing_FE/'
npm run build:pages
```

Sau khi chạy, cần kiểm tra:

- có thư mục `dist/`
- có `dist/index.html`
- có `dist/404.html`
- có `dist/.nojekyll`

## 14. Giải thích vì sao pipeline này phù hợp với project

Pipeline hiện tại được thiết kế theo đúng bản chất của project:

- Đây là Vite app, nên build artifact là static
- Không có backend riêng cần container hóa
- Không có database migration
- Không có server runtime cần SSH deploy
- GitHub Pages đủ để phục vụ landing, dashboard và toàn bộ static assets

Với trạng thái code hiện tại, việc dùng GitHub Pages là tối ưu vì:

- đơn giản
- miễn phí
- dễ tích hợp với GitHub Actions
- không cần hạ tầng riêng

## 15. Những gì CI/CD hiện tại chưa làm

Hiện tại pipeline chưa bao gồm:

- ESLint
- Unit test
- Integration test
- End-to-end test
- Preview deploy cho từng pull request
- Rollback tự động
- Semantic versioning hoặc release tagging
- Notification qua Slack/Discord/Email

Điều này là bình thường với một frontend project đang ở giai đoạn đồ án/prototype.

## 16. Hướng nâng cấp tiếp theo

Nếu muốn làm CI/CD mạnh hơn, có thể mở rộng theo các hướng sau:

### 16.1. Bổ sung lint

Thêm:

- ESLint
- script `npm run lint`
- step lint trong CI

### 16.2. Bổ sung test

Thêm:

- Vitest cho unit test
- React Testing Library cho UI
- Playwright cho end-to-end test

Khi đó CI có thể chạy:

1. lint
2. typecheck
3. unit test
4. build
5. e2e test

### 16.3. Preview deploy

Mỗi pull request có thể deploy ra một preview environment riêng bằng:

- Vercel Preview
- Netlify Deploy Preview
- hoặc một Pages artifact tạm

### 16.4. Bổ sung release workflow

Có thể thêm workflow riêng cho:

- tạo tag version
- tạo GitHub Release
- lưu artifact build

### 16.5. Tách môi trường staging và production

Nếu sau này có backend hoặc hạ tầng riêng, nên tách:

- `staging`
- `production`

với biến môi trường riêng cho từng môi trường.

## 17. Kết luận

CI/CD hiện tại của `Meshing_FE` đã đạt mức hoàn chỉnh và phù hợp với trạng thái project:

- có kiểm tra tự động trước khi merge
- có deploy tự động sau khi merge
- có hỗ trợ GitHub Pages cho SPA
- có cấu hình base path cho subpath deployment
- có hỗ trợ biến môi trường cho OAuth và custom domain

Nói ngắn gọn:

- `CI` giữ chất lượng và khả năng build của code
- `CD` đưa bản build mới nhất lên GitHub Pages một cách tự động

Đây là nền tảng đủ tốt để tiếp tục phát triển project mà không phải deploy thủ công sau mỗi lần cập nhật.
