# Meshing_FE

`Meshing_FE` là frontend demo cho bài toán phác thảo hình học 2D, chuẩn hóa miền, sinh preview mesh và hiển thị thống kê trực quan phục vụ học tập, mô phỏng và thuyết trình ý tưởng liên quan đến meshing/FEM.

Project tập trung vào trải nghiệm tương tác trên trình duyệt:

- Vẽ outer boundary và hole trực tiếp trên canvas.
- Chỉnh sửa nhanh bằng chọn điểm, kéo điểm, xóa stroke và undo.
- Sinh preview mesh từ hình học đã đóng.
- Hiển thị thống kê như số node, số cạnh, số phần tử ước lượng và DOF.
- Tổ chức mã nguồn theo hướng tách `app`, `application`, `domain`, `infrastructure`.

## 1. Mục tiêu project

Project này được xây dựng như một giao diện frontend cho quy trình làm việc sau:

1. Người dùng đăng nhập vào hệ thống.
2. Người dùng vẽ biên ngoài của miền tính toán.
3. Người dùng thêm các lỗ bên trong miền.
4. Hệ thống chuẩn hóa dữ liệu hình học và kiểm tra điều kiện tối thiểu.
5. Hệ thống sinh preview mesh để người dùng quan sát nhanh cấu trúc lưới.
6. Dashboard hiển thị các chỉ số phân tích và biểu đồ phân bố để phục vụ đánh giá sơ bộ.

## 2. Tính năng hiện có

- Landing page giới thiệu hệ thống và điều hướng đến phần đăng nhập hoặc workspace.
- Đăng nhập bằng Google qua flow frontend và callback route.
- Route guard cơ bản cho `/dashboard`.
- Dashboard tương tác với canvas để vẽ hình học 2D.
- Tool vẽ `Outer Boundary`.
- Tool vẽ `Hole`.
- Tool `Select` để chọn và kéo điểm.
- Tool `Eraser` để xóa các đoạn draft stroke.
- Zoom in, zoom out, reset zoom.
- `Close Shape` để đóng miền đang vẽ.
- `Undo` để quay lại thao tác gần nhất.
- `Delete Shape` để xóa biên ngoài hoặc lỗ đang chọn.
- `Reset Geometry` để xóa toàn bộ workspace.
- Sinh preview mesh với hai loại phần tử `T3` và `Q4`.
- Hiển thị console log ngay trong dashboard.
- Hiển thị thống kê topology và phân bố dữ liệu bằng biểu đồ.
- Lazy loading cho các page và panel nặng.

## 3. Công nghệ sử dụng

- React 18
- TypeScript
- Vite 6
- React Router 7
- Tailwind CSS 4
- Radix UI
- Recharts
- Motion
- Lucide React
- HTML Canvas API

## 4. Cấu trúc thư mục chính

```text
src/
|-- app/
|   |-- components/
|   |-- pages/
|   |-- App.tsx
|   `-- routes.ts
|-- infrastructure/
|   |-- auth/
|   `-- canvas/
|-- modules/
|   |-- analysis/
|   |-- geometry/
|   |-- meshing/
|   `-- workspace/
|-- styles/
`-- main.tsx
```

Ý nghĩa từng phần:

- `src/app`: tầng UI, routing, page composition và các component hiển thị.
- `src/infrastructure`: các phần phụ thuộc môi trường trình duyệt như `localStorage`, canvas renderer, chuyển đổi tọa độ.
- `src/modules/geometry`: kiểu dữ liệu hình học, chuẩn hóa orientation, kiểm tra và xử lý miền.
- `src/modules/meshing`: logic sinh preview mesh và các chiến lược theo loại phần tử.
- `src/modules/analysis`: tính toán thống kê, DOF và dữ liệu biểu đồ.
- `src/modules/workspace`: state chính của dashboard, command xử lý thao tác người dùng và orchestration cho toàn bộ workspace.

## 5. Kiến trúc và design pattern

Project hiện tại đã có một số pattern rõ ràng:

- `Layered / Clean-ish architecture`: tách UI, application logic, domain logic và infrastructure.
- `State machine`: workspace dùng event + reducer để chuyển trạng thái vẽ, chọn, xóa, meshing.
- `Strategy pattern`: chọn cách tính theo loại phần tử `T3` hoặc `Q4`.
- `Command-like functions`: các thao tác như `close shape`, `undo`, `move point`, `erase stroke` được tách thành các hàm xử lý riêng.
- `Facade/ViewModel hook`: `useDashboardWorkspace()` gom state, action và dữ liệu cho toàn bộ dashboard.
- `Renderer separation`: logic vẽ canvas nằm riêng khỏi component React.

Điểm mạnh của cách tổ chức này:

- UI không ôm quá nhiều business logic.
- Domain logic có thể tái sử dụng và test độc lập dễ hơn.
- Workspace dễ mở rộng thêm tool hoặc quy tắc mới.
- Canvas rendering không bị trộn trực tiếp vào JSX.

## 6. Luồng hoạt động của ứng dụng

Luồng tổng quát:

1. Người dùng vào `/`.
2. Chọn đăng nhập tại `/login`.
3. Sau callback, trạng thái đăng nhập được lưu trong `localStorage`.
4. Người dùng vào `/dashboard`.
5. Dashboard gọi `useDashboardWorkspace()` để quản lý trạng thái toàn cục của workspace.
6. Người dùng vẽ biên ngoài và lỗ.
7. Khi nhấn `Generate Mesh`, ứng dụng thực hiện:
   - Chuẩn hóa dữ liệu thành `PSLG`.
   - Kiểm tra hình học tối thiểu.
   - Sinh preview mesh từ miền kín.
   - Tính toán dữ liệu thống kê và biểu đồ.
8. Kết quả được hiển thị lại trên canvas và panel bên phải.

Luồng sinh preview mesh hiện tại:

1. `buildPSLG()` chuẩn hóa orientation cho outer loop và hole loops.
2. `validateGeometry()` kiểm tra mỗi loop có đủ số điểm tối thiểu.
3. `previewRefinement()` lấy mẫu điểm bên trong miền và dựng các cạnh lân cận để hiển thị preview.
4. `analyzeMesh()` tạo dữ liệu thống kê và phân bố phục vụ dashboard.

## 7. Hướng dẫn cài đặt và chạy project

### Yêu cầu môi trường

- Node.js
- npm

### Cài đặt dependencies

```bash
npm install
```

### Chạy môi trường development

```bash
npm run dev
```

Sau khi chạy, Vite thường phục vụ ứng dụng tại:

```text
http://localhost:5173
```

### Build production

```bash
npm run build
```

Output build sẽ được tạo trong thư mục `dist/`.

## 8. Scripts hiện có

```bash
npm run dev
npm run build
```

Hiện tại project chưa cấu hình script riêng cho:

- test
- lint
- preview

## 9. Cấu hình đăng nhập Google

Flow đăng nhập hiện nằm hoàn toàn ở frontend.

Hai hằng số quan trọng được khai báo trực tiếp trong:

```text
src/app/pages/Login.tsx
```

Giá trị hiện có:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_REDIRECT_URI`

Khi đổi môi trường chạy hoặc deploy sang domain khác, cần cập nhật lại `GOOGLE_REDIRECT_URI` cho khớp với URL callback thực tế.

Lưu ý quan trọng:

- Callback hiện kiểm tra sự hiện diện của một số query params thành công và lưu trạng thái vào `localStorage`.
- Project chưa có backend để verify token hoặc trao đổi code lấy access token an toàn.
- Cách làm này phù hợp cho demo frontend hoặc prototype, không phù hợp để dùng như một hệ thống xác thực production-ready.

## 10. Hướng dẫn sử dụng dashboard

Quy trình sử dụng khuyến nghị:

1. Mở dashboard sau khi đăng nhập.
2. Chọn tool `Outer Boundary`.
3. Giữ chuột trái và kéo để vẽ stroke.
4. Nhấn `Close Shape` hoặc phím `Enter` để đóng miền ngoài.
5. Chọn tool `Hole` nếu cần vẽ lỗ bên trong.
6. Tiếp tục vẽ và đóng từng lỗ.
7. Chọn `Generate Mesh` để sinh preview mesh.
8. Quan sát canvas, thông số topology và biểu đồ ở panel bên phải.

Tác vụ hỗ trợ:

- `Esc`: hủy stroke hiện tại.
- `Enter`: đóng shape hiện tại nếu đủ số điểm.
- `Delete` hoặc `Backspace`: hủy draft hoặc xóa shape đang chọn tùy ngữ cảnh.
- `Undo`: xóa thao tác gần nhất.
- `Select`: chọn và kéo điểm của biên ngoài hoặc lỗ.
- `Eraser`: cắt bỏ các đoạn của draft stroke.

## 11. Các module nghiệp vụ chính

### Geometry

Chịu trách nhiệm cho:

- kiểu dữ liệu `Point`, `Loop`, `PSLG`
- chuẩn hóa orientation của polygon
- kiểm tra miền hợp lệ ở mức tối thiểu
- xử lý phép đo và kiểm tra điểm nằm trong polygon

### Meshing

Chịu trách nhiệm cho:

- nhận dữ liệu hình học đã chuẩn hóa
- sinh preview mesh từ miền đầu vào
- áp dụng strategy theo loại phần tử `T3` hoặc `Q4`

### Analysis

Chịu trách nhiệm cho:

- tính DOF
- xây dựng số liệu thống kê
- tạo dữ liệu biểu đồ phân bố

### Workspace

Chịu trách nhiệm cho:

- quản lý state toàn bộ dashboard
- điều phối tool hiện hành
- xử lý command từ người dùng
- đồng bộ trạng thái canvas, log và mesh preview

## 12. Những điểm đã làm tốt trong codebase

- Tách domain logic ra khỏi UI tương đối rõ ràng.
- Phần dashboard đã được gom qua `useDashboardWorkspace()` nên page component không bị quá nặng về điều phối.
- Canvas renderer được đặt ngoài React component, dễ đọc và dễ bảo trì hơn.
- Dữ liệu thống kê và loại phần tử được tổ chức thành module độc lập.
- Router có lazy loading và loading fallback.

## 13. Giới hạn hiện tại

Đây là các giới hạn cần nêu rõ khi sử dụng hoặc trình bày project:

- Phần mesh hiện là preview mesh phục vụ trực quan hóa, chưa phải bộ sinh lưới FEM hoàn chỉnh.
- Hàm sinh lưới hiện dựa trên sampling/proxy logic trong miền, không phải một cài đặt Delaunay refinement đầy đủ cho production.
- `thetaMin` và `rlRatio` hiện có slider trên UI nhưng chưa được đưa vào pipeline sinh mesh thực tế.
- `maxLength` đang là tham số ảnh hưởng trực tiếp đến mật độ preview mesh.
- `Export Later` mới là placeholder giao diện, chưa có chức năng export.
- Validation hình học hiện ở mức cơ bản, chưa bao phủ đầy đủ các trường hợp tự cắt, suy biến hoặc topology phức tạp.
- Xác thực Google hiện ở mức demo frontend và không nên dùng nguyên trạng cho production.
- Chưa có test tự động trong repo.

## 14. Hướng phát triển tiếp theo

Nếu muốn nâng cấp project, đây là các hướng nên ưu tiên:

- Đưa cấu hình Google OAuth sang `.env`.
- Bổ sung backend xác thực callback an toàn.
- Thay preview meshing bằng thuật toán meshing thực sự phù hợp với FEM.
- Kết nối `thetaMin` và `rlRatio` vào pipeline sinh lưới.
- Bổ sung export dữ liệu mesh và hình học.
- Viết unit test cho `domain services`, `use cases` và reducer/state machine.
- Thêm linting và CI cơ bản.
