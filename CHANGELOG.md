# NHẬT KÝ THAY ĐỔI HỆ THỐNG (CHANGELOG.md)

Tất cả các thay đổi về kiến trúc, tính năng, sửa lỗi và nâng cấp chất lượng của dự án **SortiX Dashboard** được ghi lại tại tài liệu này theo tiêu chuẩn [Keep a Changelog](https://keepachangelog.com/).

---

## [2.1.0] - 2026-09-18 (Hệ Thống Xác Thực Đa Lớp, Phân Quyền RBAC & Database Migrations)

### 🚀 Added (Thêm mới)
- **Hệ Thống Xác Thực & Quản Trị Người Dùng (Auth & RBAC)**:
  - `backend/src/services/userService.ts`: Nghiệp vụ băm mật khẩu Bcrypt (10 salt rounds), cấp phát và kiểm chứng Mock OTP (6 chữ số, thời hạn 5 phút), phân quyền RBAC và kiểm soát an toàn tài khoản.
  - `backend/src/controllers/userController.ts`: Tiếp nhận và điều phối các endpoint đăng ký, đăng nhập, đổi mật khẩu, quên mật khẩu OTP và quản trị người dùng.
  - `backend/src/routes/authRoutes.ts` & `backend/src/routes/userRoutes.ts`: Định tuyến RESTful API độc lập cho backend server.
  - `backend/src/models/userModel.ts`: Quản lý nạp và lưu trữ dữ liệu người dùng bền vững trên file `data/users.json`.
  - `data/users.json`: Lưu trữ thông tin tài khoản an toàn với mật khẩu băm Bcrypt.
- **Khởi Tạo Admin & Cơ Sở Dữ Liệu (Migrations & Seeds)**:
  - `backend/database/seeds/seed_admins.ts` & `seed_admins.sql`: Tự động khởi tạo 4 tài khoản Ban Quản trị đại diện nhóm đề tài PBL3 (`admin1`, `admin2`, `admin3`, `admin4`).
  - `backend/database/migrations/`: 4 tệp DDL tạo bảng người dùng chuẩn hóa cho đa hệ quản trị CSDL:
    - `001_create_users_table_sqlite.sql` (SQLite)
    - `001_create_users_table_postgres.sql` (PostgreSQL)
    - `001_create_users_table_mysql.sql` (MySQL)
    - `001_create_users_mongodb.js` (MongoDB)
- **Giao Diện & Trải Nghiệm Người Dùng (Frontend UI)**:
  - `frontend/src/app/users/page.tsx`: Giao diện quản trị thành viên trực quan, phân quyền theo vai trò (Admin / User), tạo mới và khóa tài khoản.
  - `frontend/src/app/login/page.tsx`: Nâng cấp giao diện đăng nhập với liên kết mở Modal Quên mật khẩu.
  - `frontend/src/components/ui/ForgotPasswordModal.tsx`: Hộp thoại yêu cầu mã OTP và đặt lại mật khẩu mới.
  - `frontend/src/components/ui/ChangePasswordModal.tsx`: Hộp thoại đổi mật khẩu với xác thực độ phức tạp.
- **Bộ Kiểm Thử Bảo Mật & RBAC Mới**:
  - `tests/users.test.cjs`: Bổ sung 14 bài kiểm thử hồi quy tự động kiểm tra toàn bộ luồng bảo mật (Admin Seeder, băm Bcrypt, Mock OTP, chống Privilege Escalation, chặn 403 Forbidden, chặn Admin tự xóa mình, bảo vệ tối thiểu 1 Admin).

### 🛡️ Security & Reliability (Bảo mật & Độ tin cậy)
- Ngăn chặn triệt để tấn công leo thang đặc quyền: Đăng ký tài khoản tự do luôn bị ép cứng `role: 'user'`.
- Chặn khôi phục mật khẩu từ bên ngoài màn hình Login đối với các tài khoản Quản trị viên (Admin).
- Chặn thao tác xóa Admin nếu số lượng Admin trong hệ thống chỉ còn 1 người.
- Bộ kiểm thử tự động đạt mốc **26/26 Tests PASS (100%)** trên toàn hệ thống.

---

## [2.0.0] - 2026-09-17 (Tái Cấu Trúc Monorepo Frontend / Backend / Shared)

### 🚀 Added (Thêm mới)
- **Tầng Dùng Chung (`shared/`)**:
  - `shared/types/index.ts`: Toàn bộ TypeScript interfaces chuẩn (`TelemetryData`, `VisionDetection`, `SorterConfig`, `ClassificationRecord`, `AlertEvent`).
  - `shared/schemas/index.ts`: Schemas Zod có `.passthrough()` đảm bảo tính tương thích với firmware ESP32-C5.
  - `shared/constants/index.ts`: Hằng số MQTT topics, mã màu 3 khay, vai trò người dùng (RBAC).
- **Tầng Backend Độc Lập (`backend/`)**:
  - `backend/src/controllers/`: `configController`, `historyController`, `statsController`, `alertController`.
  - `backend/src/routes/`: `configRoutes`, `historyRoutes`, `statsRoutes`, `alertRoutes`.
  - `backend/src/services/`: `configService`, `historyService`, `statsService`, `alertNotificationService`.
  - `backend/src/models/`: `configModel`, `historyModel` (quản lý in-memory tối đa 1000 bản ghi an toàn).
  - `backend/src/middlewares/`: `validateMiddleware.ts` (xác thực Zod), `errorMiddleware.ts`.
  - `backend/src/server.ts`: HTTP Server độc lập cổng 5000 chuẩn RESTful, có sẵn CORS và `/api/health`.
- **Tầng Frontend Services (`src/services/`)**:
  - `apiConfigClient.ts`: Fetch wrapper gọi REST API cấu hình.
  - `apiHistoryClient.ts`: Fetch wrapper gọi REST API lịch sử (hỗ trợ phân trang, lọc).
  - `apiStatsClient.ts`: Fetch wrapper gọi REST API thống kê KPI.
- **Tài Liệu & Tự Động Hóa**:
  - `docs/architecture.md`: Tài liệu kiến trúc phân tầng, phân định Simulation vs Live Hardware.
  - `docs/api.md`: Đặc tả chi tiết toàn bộ các RESTful API endpoints.
  - `scripts/dev.ps1`: Script PowerShell khởi động hệ thống nhanh.
  - `scripts/test.ps1`: Script PowerShell chạy toàn bộ bộ kiểm tra chất lượng tự động.
  - `tests/api_schemas.test.cjs`: Kiểm thử tự động cho các Zod Schemas.
  - `.env.example`: Mẫu cấu hình môi trường chuẩn hóa cho toàn hệ thống.

### 🔄 Changed (Cải tiến & Tái cấu trúc)
- **Phân rã Monolithic Component**:
  - Tách `src/app/page.tsx` từ 988 dòng (47KB) xuống ~90 dòng, đưa các khối giao diện thành 4 subcomponents độc lập:
    - `src/components/overview/KpiStatGrid.tsx`
    - `src/components/overview/LiveHealthAndBinWidget.tsx`
    - `src/components/overview/CalendarWidget.tsx`
    - `src/components/overview/RecentActivityList.tsx`
- **Subcomponents Băng Tải**:
  - Chuẩn hóa các thành phần điều khiển trong `src/components/conveyor/` (`ConveyorControls.tsx`, `QuickFeedBar.tsx`, `BinTrays.tsx`).
- **Tương thích ngược an toàn (Backward Compatibility)**:
  - `src/lib/types.ts` và `src/lib/schemas.ts` re-export trực tiếp từ `shared/`, giúp toàn bộ code cũ không bị đứt gãy.
  - Cập nhật cấu hình `tsconfig.json` hỗ trợ path alias `@shared/*`.

---

## [1.0.0] - 2026-09-15 (Phiên Bản Khởi Động Ban Đầu)
- Khởi tạo dự án SortiX Dashboard trên nền Next.js 14 App Router, TailwindCSS, Recharts, Lucide Icons.
- Mô phỏng băng tải vật lý 60fps trên HTML5 Canvas qua `useConveyorPhysics.ts`.
- Bộ tổng hợp âm thanh công nghiệp qua Web Audio API thuần (`audioService.ts`).
- Kết nối MQTT broker qua WebSocket cho thiết bị vi điều khiển ESP32-C5 (`mqttClient.ts`).
- Quản lý lịch sử và cấu hình phân loại trên LocalStorage trình duyệt.
