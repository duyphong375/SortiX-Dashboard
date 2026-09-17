# KẾ HOẠCH TÁI CẤU TRÚC VÀ LỘ TRÌNH PHÁT TRIỂN HỆ THỐNG SORTIX DASHBOARD

> **Dự án**: SortiX Dashboard (Đồ án PBL3)  
> **Phiên bản kiến trúc**: Monorepo v2.1.0  
> **Trạng thái**: Đã hoàn thành tái cấu trúc Monorepo, Tầng Shared, Backend độc lập, Xác thực đa lớp & Bộ kiểm thử toàn diện 26/26 tests PASS.

---

## 1. Mục Tiêu Tái Cấu Trúc (Refactoring Goals)

1. **Phân rã Monolithic Codebase**: Tách biệt dứt điểm giữa Frontend (Next.js 14 App Router), Backend (Node.js/Express + TypeScript) và Thư viện Dùng chung (`shared/`).
2. **Loại bỏ sự phụ thuộc quá mức vào LocalStorage**: Thiết lập kiến trúc dữ liệu phân tầng với API RESTful, file store bền vững (`data/users.json`), và bộ scripts migration sẵn sàng kết nối các hệ quản trị cơ sở dữ liệu lớn (SQLite, PostgreSQL, MySQL, MongoDB).
3. **Nâng cấp Hệ Thống Bảo Mật & Xác Thực Doanh Nghiệp**:
   - Chuyển đổi từ tài khoản cứng sang cơ chế xác thực Bcrypt băm mật khẩu 10 salt rounds.
   - Phân quyền RBAC chặt chẽ (Admin vs User), ngăn chặn Privilege Escalation.
   - Cơ chế cấp phát và kiểm chứng Mock OTP đặt lại mật khẩu với thời hạn 5 phút.
   - Ràng buộc an toàn: Không cho phép Admin tự xóa chính mình; Bắt buộc luôn duy trì tối thiểu 1 Admin.
4. **Bảo toàn và Mở rộng Kiểm Thử Tự Động (Quality Gate)**:
   - Đảm bảo 100% các bộ test hồi quy luôn chạy tự động và đạt tỷ lệ Pass 100%.
   - Kiểm tra kiểu dữ liệu nghiêm ngặt qua TypeScript Strict Mode (0 errors).

---

## 2. Nhật Ký Tiến Độ Thực Thi (Execution Progress)

### ✅ Giai Đoạn 1: Tách Tầng Dùng Chung (Shared Layer) & Schema Hardening
- [x] **Task 1.1**: Tạo không gian làm việc `shared/` (`types/`, `schemas/`, `constants/`).
- [x] **Task 1.2**: Định nghĩa các Interface dữ liệu cốt lõi (`TelemetryData`, `VisionDetection`, `SorterConfig`, `ClassificationRecord`, `AlertEvent`, `User`, `SafeUser`).
- [x] **Task 1.3**: Xây dựng bộ Zod Schemas với cơ chế `.passthrough()` đảm bảo tính tương thích với firmware ESP32-C5.
- [x] **Task 1.4**: Cấu hình TypeScript path alias `@shared/*` trong `tsconfig.json`.

### ✅ Giai Đoạn 2: Phân Rã Giao Diện Frontend (Frontend Modularization)
- [x] **Task 2.1**: Phân rã tệp `src/app/page.tsx` từ 988 dòng (47KB) xuống ~90 dòng, đưa vào các subcomponents độc lập:
  - `src/components/overview/KpiStatGrid.tsx`
  - `src/components/overview/LiveHealthAndBinWidget.tsx`
  - `src/components/overview/CalendarWidget.tsx`
  - `src/components/overview/RecentActivityList.tsx`
- [x] **Task 2.2**: Chuẩn hóa cụm điều khiển Băng Tải trong `src/components/conveyor/`:
  - `ConveyorControls.tsx`: Cụm nút Run / Pause / E-Stop và thanh trượt tốc độ.
  - `QuickFeedBar.tsx`: Dải nút nạp nhanh mẫu chai/lon mô phỏng.
  - `BinTrays.tsx`: Máng trượt 3 khay và cảnh báo khi khay đầy.
- [x] **Task 2.3**: Xây dựng các Modal giao diện bảo mật:
  - `ForgotPasswordModal.tsx`: Giao diện nhập email, nhận OTP và đặt lại mật khẩu.
  - `ChangePasswordModal.tsx`: Giao diện đổi mật khẩu bên trong hệ thống.
  - `ExportDialog.tsx`: Xuất báo cáo lịch sử phân loại dạng CSV.

### ✅ Giai Đoạn 3: Xây Dựng Tầng Backend Độc Lập & Xác Thực Đa Lớp
- [x] **Task 3.1**: Thiết lập máy chủ Express độc lập tại `backend/src/server.ts` (Port 5000).
- [x] **Task 3.2**: Xây dựng tầng Điều khiển & Nghiệp vụ (Controllers & Services):
  - `userController.ts` & `userService.ts`: Nghiệp vụ đăng ký, đăng nhập, đổi mật khẩu, OTP, quản trị người dùng.
  - `configController.ts` & `configService.ts`: Quản lý cấu hình phân loại và versioning.
  - `historyController.ts` & `historyService.ts`: Quản lý lịch sử và phân trang.
  - `statsController.ts` & `statsService.ts`: Tổng hợp chỉ số KPI sản xuất.
  - `alertController.ts` & `alertNotificationService.ts`: Cảnh báo Email SMTP và Telegram Bot.
- [x] **Task 3.3**: Quản lý dữ liệu bền vững và Seeder:
  - Tạo `data/users.json` lưu trữ thông tin người dùng an toàn.
  - Viết `seed_admins.ts` / `seed_admins.sql` khởi tạo 4 tài khoản Admin mặc định cho nhóm đồ án.
- [x] **Task 3.4**: Chuẩn bị DDL Migrations cho đa hệ quản trị cơ sở dữ liệu:
  - SQLite: `001_create_users_table_sqlite.sql`
  - PostgreSQL: `001_create_users_table_postgres.sql`
  - MySQL: `001_create_users_table_mysql.sql`
  - MongoDB: `001_create_users_mongodb.js`

### ✅ Giai Đoạn 4: Đảm Bảo Chất Lượng & Kiểm Thử Toàn Diện (26/26 Tests PASS)
- [x] **Task 4.1**: `tests/history.test.cjs` (9 tests PASS):
  - Khởi tạo rỗng an toàn, cô lập dữ liệu giả lập, migration LocalStorage, chuẩn hóa counter hỏng.
- [x] **Task 4.2**: `tests/api_schemas.test.cjs` (3 tests PASS):
  - Xác thực SorterConfigSchema, ClassificationRecordSchema và HistoryQuerySchema.
- [x] **Task 4.3**: `tests/users.test.cjs` (14 tests PASS):
  - Admin Seeder 4 tài khoản với mật khẩu băm Bcrypt.
  - Validate schema cập nhật profile, đổi mật khẩu, đăng ký.
  - Chống leo thang đặc quyền (Privilege Escalation) khi đăng ký tự do.
  - Kiểm tra phân quyền RBAC (chặn 403 cho tài khoản `user`).
  - Ràng buộc an toàn: Không cho Admin tự xóa chính mình; Bắt buộc còn tối thiểu 1 Admin.
  - Xác thực Mock OTP 6 số, thời hạn 5 phút, chống dùng lại OTP.
  - Chặn Admin đặt lại mật khẩu từ ngoài màn hình Login.

---

## 3. Lộ Trình Phát Triển Tiếp Theo (Future Roadmap)

### 📌 Giai Đoạn 5: Kết Nối Cơ Sở Dữ Liệu Thực Tế & Docker Hóa (Upcoming)
1. **Tích hợp Database Driver**:
   - Cung cấp tùy chọn cấu hình `DB_DIALECT=sqlite|postgres|mysql` trong `.env` để tự động chuyển từ JSON File Store sang ORM/Query Builder (Prisma hoặc Drizzle ORM).
2. **Đóng Gói Docker & Orchestration**:
   - Viết `Dockerfile` tối ưu hóa đa tầng (multi-stage build) cho Frontend Next.js và Backend Express.
   - Tạo `docker-compose.yml` tích hợp sẵn EMQX MQTT Broker, Backend API, Frontend Dashboard và cơ sở dữ liệu PostgreSQL.
3. **Thực Nghiệm Phần Cứng IoT ESP32-C5**:
   - Tiến hành kiểm thử áp lực (stress test) truyền nhận 100 gói tin telemetry/giây trên băng chuyền thật.
   - Hiệu chỉnh độ trễ xử lý servo khi nhận diện sản phẩm ở vận tốc băng tải cao nhất (100%).
