# NHẬT KÝ THAY ĐỔI HỆ THỐNG (CHANGELOG.md)

Tất cả các thay đổi về kiến trúc, tính năng, sửa lỗi và nâng cấp chất lượng của dự án **SortiX Dashboard** được ghi lại tại tài liệu này theo tiêu chuẩn [Keep a Changelog](https://keepachangelog.com/).

## [2.3.0] - 2026-09-18 (Dung Lượng Khay Động 5-50 SP, Đồng Hồ Nhiệt Độ 2 Chế Độ, Báo Cáo 1 Ngày Làm Việc & MQTT Watchdog)

### 🚀 Added (Thêm mới)
- **Thanh Trượt Điều Chỉnh Độ Rộng / Sức Chứa Khay (Dynamic Bin Capacities 5 - 50 SP)**:
  - Cho phép người dùng tùy chỉnh định mức chứa từ 5 đến 50 sản phẩm riêng biệt cho từng khay (Khay 1, Khay 2, Khay 3).
  - Tự động đồng bộ hóa tức thời trên máng trượt Canvas 60fps (`ConveyorVisualizer.tsx`, `BinTrays.tsx`), widget giám sát (`LiveHealthAndBinWidget.tsx`), chẩn đoán (`ConfigAndDiagnostics.tsx`), `useSorterData.ts` và lưu trữ bền vững trên `localStorage ('sortix_bin_capacities')`.
  - Cơ chế tự động kẹp giá trị an toàn (Clamping [5, 50] SP).
- **Phân Định Rõ Ràng: Đầy Khay (`bin_full`) vs Kẹt Phôi (`jam_detected`)**:
  - `bin_full`: Kích hoạt khi số lượng đạt tới sức chứa định mức của khay (`current_count >= max_capacity`, ví dụ 30/30 hoặc 50/50 SP), hiển thị banner vàng cam, còi báo đầy khay và nút "Xác nhận đã thay khay mới" reset khay về 0.
  - `jam_detected`: Kích hoạt khi cảm biến quang học che khuất liên tục > 5 giây tại Cảm biến #02 / Zone A, dừng băng tải tức thì, còi hú báo kẹt và hiển thị banner đỏ kẹt phôi.
- **Đồng Hồ Đo Nhiệt Độ Bán Nguyệt 2 Chế Độ (Dual-Mode Temperature Gauge Dial)**:
  - `TemperatureGaugeWidget.tsx`: Tự động phân định giao diện theo chế độ vận hành:
    - *Chế độ Mô phỏng*: Hiển thị thanh trượt nhiệt độ ảo (30°C - 95°C) và các nút preset (42.5°C, 72.0°C, 78.5°C) để thử nghiệm phản ứng quá nhiệt.
    - *Chế độ Thực tế*: Tự động ẩn thanh trượt giả lập, hiển thị bảng telemetry cảm biến phần cứng thật (ESP32 DS18B20) với cờ `[PHẦN CỨNG THẬT]` và kim đo phản ánh dữ liệu cảm biến thực tế.
- **Giám Sát Mất Kết Nối MQTT Broker (`mqtt_disconnected`)**:
  - Watchdog 5 giây debounce chống nhấp nháy mạng ngắn hạn.
  - Tự động chuyển đổi huy hiệu trên TopHeader: `MQTT: ONLINE (Xanh)` <-> `MQTT: DISCONNECTED (Đỏ chớp nháy)`.
  - Phát âm thanh cảnh báo ngắt kết nối và lịch trình tự động kết nối lại theo chu kỳ backoff (3s -> 5s -> 10s).
  - Toast phục hồi màu xanh kèm âm thanh chime khi kết nối lại thành công.
  - Nút thử nghiệm "Ngắt kết nối MQTT Client" / "Khôi phục kết nối MQTT" trong trang Cấu hình và Thiết bị (chỉ hoạt động ở chế độ Mô phỏng).
- **Báo Cáo 1 Ngày Làm Việc (Shift Summary / Daily Work Report)**:
  - Chuẩn hóa tên gọi thành **`[BÁO CÁO 1 NGÀY LÀM VIỆC]`**.
  - Tự động đồng bộ hóa trực tiếp số liệu thời gian thực từ 3 khay chứa, số sản phẩm đạt/lỗi, thời gian vận hành và số lần dừng khẩn cấp.
  - Modal trực quan hóa số liệu, nút Tải báo cáo CSV có UTF-8 BOM hiển thị tiếng Việt chuẩn trên Excel, và mẫu in ấn chuẩn.
- **Nâng Cấp Bộ Kiểm Thử Tự Động Toàn Diện**:
  - Bổ sung 9 bộ test suites mới:
    - `tests/bin_sliders_sync.test.cjs` (8 tests)
    - `tests/mqtt_disconnected.test.cjs` (12 tests)
    - `tests/temperature_gauge_simulation_vs_real.test.cjs` (4 tests)
    - `tests/daily_report_sync.test.cjs` (6 tests)
    - `tests/temperature_warning.test.cjs` (8 tests)
    - `tests/device_offline.test.cjs` (10 tests)
    - `tests/shift_summary.test.cjs` (8 tests)
    - `tests/bin_full.test.cjs` (7 tests)
    - `tests/jam_simulation_audio.test.cjs` (5 tests)
  - Toàn bộ hệ thống đạt mốc kiểm thử kỷ lục: **108/108 Tests PASS (100% - 15 Test Suites)**.

---

## [2.2.0] - 2026-09-18 (Hệ Thống An Toàn E-Stop, Cảnh Báo Kẹt Phôi, SSE & Cô Lập Mô Phỏng)

### 🚀 Added (Thêm mới)
- **Hệ Thống Dừng Khẩn Cấp (Industrial E-Stop Safety System)**:
  - `backend/src/services/safetyService.ts`: Quản lý trạng thái an toàn hệ thống (`is_locked`), lưu trữ sự cố khẩn cấp, xác thực mở khóa chỉ dành cho Admin và cơ chế chống kẹt loop echo 5s.
  - `backend/src/controllers/safetyController.ts` & `backend/src/routes/safetyRoutes.ts`: Endpoints `/api/safety/estop`, `/api/safety/unlock`, `/api/safety/status`.
  - `frontend/src/components/layout/EmergencyStopBanner.tsx`: Banner cảnh báo toàn màn hình khi băng chuyền bị khóa khẩn cấp.
  - `frontend/src/components/ui/EmergencyConfirmModal.tsx`: Hộp thoại xác nhận kích hoạt dừng khẩn cấp từ Web.
  - `frontend/src/components/ui/EmergencyUnlockToast.tsx`: Giao diện mở khóa an toàn yêu cầu quyền Quản trị viên và nhập lý do hiện trường.
- **Hệ Thống Cảnh Báo Kẹt Phôi (Jam Detection System)**:
  - `conveyor/sensor/jam`: Topic MQTT phát hiện vật thể đứng yên/che khuất liên tục quá 5 giây tại Cảm biến quang học #02 (Zone A).
  - `/api/safety/jam`: Endpoint ghi nhận sự cố kẹt phôi và lưu trữ bền vững.
  - Toast thông báo màu đỏ cảnh báo kẹt phôi kèm hướng dẫn xử lý và dừng băng tải.
  - Cơ cấu chuyển hướng nâng cấp: Đổi sang kiểu **Piston đẩy thụt ra thụt vô** thay vì servo gạt xoay truyền thống.
  - Tính năng **Dọn khay chủ động**: Bấm dọn khay bất kỳ lúc nào ngay trên máng trượt (không cần chờ đủ định mức 50 SP).
- **Server-Sent Events (SSE Real-time Event Stream)**:
  - `backend/src/services/sseService.ts` & `/api/events`: Stream sự kiện thời gian thực (E-Stop, Jam Detected, Safety Unlocked) tới tất cả các client đang mở.
- **Kho Dữ Liệu Thông Báo Bền Vững (Notifications Persistence)**:
  - `data/notifications.json` & `backend/src/models/notificationModel.ts`: Lưu trữ vĩnh viễn các thông báo dừng khẩn cấp và kẹt phôi với trạng thái `unprocessed` / `processed`.
- **Gắn Nhãn Chế Độ Trong Cảnh Báo Tự Động**:
  - Email (SMTP) và Telegram Bot tự động kèm nhãn định danh: `🧪 Chế độ Giả Lập` hoặc `🔴 Phần cứng Thực Tế`.
- **3 Bộ Kiểm Thử Mới**:
  - `tests/estop_safety.test.cjs`: 5 tests kiểm tra toàn bộ luồng E-Stop, thông báo và phân quyền mở khóa.
  - `tests/jam_detection.test.cjs`: 6 tests kiểm tra sự cố kẹt phôi, Zod validation, SSE broadcast và topic MQTT.
  - `tests/simulation_mode_guard.test.cjs`: 3 tests kiểm tra cô lập kiểm thử giữa Mô phỏng và Thực tế.

### 🛡️ Security & Reliability (Bảo mật & Độ tin cậy)
- **Cô lập Tuyệt đối Chế độ Mô phỏng (Strict Simulation Isolation)**:
  - Các nút test giả lập kẹt phôi, giả lập E-Stop, nạp phôi mẫu, tạo dữ liệu demo hoàn toàn bị ẩn và bị chặn thực thi khi ở chế độ Thực tế (Real Hardware Mode).
  - Động cơ vật lý canvas không tự sinh kẹt phôi giả khi đang kết nối máy thật; 100% dữ liệu dựa trên cảm biến quang học thật qua MQTT.
- Chống kẹt lặp bản tin E-Stop: Bỏ qua các tín hiệu dừng lặp lại trong thời gian ân hạn 5 giây sau khi Admin đã mở khóa an toàn.
- Toàn bộ hệ thống nâng mốc kiểm thử tự động từ 26 lên **40/40 Tests PASS (100%)**.

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
