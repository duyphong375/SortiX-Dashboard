# KẾ HOẠCH TÁI CẤU TRÚC VÀ LỘ TRÌNH PHÁT TRIỂN SORTIX-MED (REFACTORING PLAN)

> **Dự án**: SortiX-Med — Hệ Thống Tự Động Phân Loại Dụng Cụ Y Tế & Chuẩn Bị Khử Trùng Phòng Mổ (Đồ án PBL3 Biomedical & Industrial IoT)  
> **Kiến trúc**: Monorepo Workspaces (Frontend, Backend, Shared, Data, Scripts, Tests)  
> **Trạng thái**: Các giai đoạn cốt lõi trong kế hoạch lịch sử đã được đánh dấu hoàn thành. Script `npm test` hiện chạy 16 file; xem ma trận cập nhật ở mục 3 và báo cáo kiểm chứng hiện tại.

---

## 📌 Mục Lục
1. [Mục Tiêu Tái Cấu Trúc Toàn Diện](#1-mục-tiêu-tái-cấu-trúc-toàn-diện)
2. [Tiến Độ Thực Thi Từng Giai Đoạn](#2-tiến-độ-thực-thi-từng-giai-đoạn)
3. [Tổng Hợp Ma Trận Kiểm Thử Tự Động (Quality Matrix)](#3-tổng-hợp-ma-trận-kiểm-thử-tự-động-quality-matrix)
4. [Lộ Trình Triển Khai Mở Rộng Tiếp Theo](#4-lộ-trình-triển-khai-mở-rộng-tiếp-theo)

---

## 1. Mục Tiêu Tái Cấu Trúc Toàn Diện

1. **Phân rã Monolithic Codebase**: Tách biệt dứt điểm giữa Frontend (Next.js 14 App Router), Backend (Node.js `node:http` + TypeScript) và Thư viện Dùng chung (`shared/`).
2. **Loại bỏ sự phụ thuộc quá mức vào LocalStorage**: Thiết lập kiến trúc dữ liệu phân tầng với API RESTful, file store bền vững (`data/users.json`, `data/notifications.json`), và bộ scripts migration sẵn sàng kết nối các hệ quản trị cơ sở dữ liệu lớn (SQLite, PostgreSQL, MySQL, MongoDB).
3. **Nâng cấp Hệ Thống Bảo Mật & Xác Thực Doanh Nghiệp**:
   - Chuyển đổi từ tài khoản cứng sang cơ chế xác thực Bcrypt băm mật khẩu 10 salt rounds.
   - Phân quyền RBAC chặt chẽ (Admin vs User), ngăn chặn Privilege Escalation.
   - Cơ chế cấp phát và kiểm chứng Mock OTP đặt lại mật khẩu với thời hạn 5 phút.
   - Ràng buộc an toàn: Không cho phép Admin tự xóa chính mình; Bắt buộc luôn duy trì tối thiểu 1 Admin.
4. **Hệ Thống An Toàn Y Sinh, Công Nghiệp & Cô Lập Kiểm Thử**:
   - Nhận diện 4 nhóm dụng cụ y tế phòng mổ: Bơm kim tiêm / Dao mổ (`med_syringe`), Kẹp phẫu thuật Pean (`med_forceps`), Kéo phẫu thuật (`med_scissors`), Lọ thuốc / Ống nghiệm (`med_vial`).
   - Phân luồng 3 khay chứa y tế: Khay 1 (Thùng vật sắc nhọn lây nhiễm - Servo 1 IO23), Khay 2 (Khay hấp tiệt trùng Autoclave - Servo 2 IO24), Khay 3 (Khay vật tư y tế & Phục hồi / Máng trượt trọng lực cuối băng tải).
   - Cơ chế an toàn sinh học Fail-safe: Tự động đưa về Khay 3 khi độ tin cậy nhận diện `< 60%`.
   - Dừng khẩn cấp E-Stop: Còi báo liên tục, banner toàn màn hình, mở khóa yêu cầu quyền Admin kèm lý do an toàn, chống loop echo 5s.
   - Cảnh báo Kẹt phôi (`jam_detected`): Cảm biến quang học #02 che khuất liên tục > 5s, MQTT `conveyor/sensor/jam`, cơ cấu gạt servo, dọn khay chủ động bất kỳ lúc nào.
   - Cảnh báo Khay đầy (`bin_full`): Đạt ngưỡng dung lượng định mức từng khay (5 - 50 SP), topic MQTT `conveyor/storage/bin_status`, còi báo, nút dọn/thay khay reset bộ đếm và tự chạy lại.
   - Thanh trượt tùy chỉnh độ rộng / sức chứa khay (5 - 50 SP): Đồng bộ tức thời trên Canvas máng trượt, LiveHealthAndBinWidget, ConfigAndDiagnostics và LocalStorage.
   - Đồng hồ đo nhiệt độ bán nguyệt 2 chế độ: Thanh trượt ảo 30°C - 95°C trong Mô phỏng; Bảng telemetry cảm biến ESP32 DS18B20 trong Thực tế.
   - Cảnh báo Quá nhiệt (`temperature_warning`): Đo nhiệt độ động cơ/CPU, ngưỡng 75°C, topic MQTT `conveyor/telemetry/temp`, Gauge Chart đổi kim vùng đỏ.
   - Cảnh báo Mất kết nối Vi điều khiển (`device_offline`): Cơ chế nhịp tim ping `conveyor/heartbeat` mỗi 2s, watchdog timeout > 6s tự động phát hiện mất nguồn/WiFi, severity `ERROR`.
   - Cảnh báo Mất kết nối MQTT Broker (`mqtt_disconnected`): Debounce 5s, còi báo, đổi huy hiệu TopHeader sang đỏ chớp nháy, auto-reconnect backoff 3s -> 5s -> 10s.
   - Báo cáo 1 ngày làm việc (`shift_summary`): Đồng bộ trực tiếp số lượng 3 khay, số bản ghi đạt/lỗi, số lần E-Stop, xuất CSV UTF-8 BOM chuẩn tiếng Việt.
   - Cô lập triệt để: Mọi nút test giả lập (E-Stop, Kẹt phôi, Khay đầy, Quá nhiệt, Offline ESP32, Test ngắt MQTT) chỉ hiển thị và hoạt động ở chế độ Mô Phỏng, hoàn toàn bị ẩn và chặn ở chế độ Thực Tế.
5. **Bảo toàn và Mở rộng Kiểm Thử Tự Động (Quality Gate)**:
   - Đảm bảo tất cả file test trong script root `npm test` đạt PASS; script hiện nối 16 file, ngoài ra còn file test chưa nối vào script.
   - Kiểm tra TypeScript Strict Mode bằng `npx tsc --noEmit --pretty false` và Next.js build; lint hiện còn một warning `react-hooks/exhaustive-deps` tại `DashboardLayout.tsx`.

---

## 2. Tiến Độ Thực Thi Từng Giai Đoạn

### ✅ Giai Đoạn 1: Tách Tầng Dùng Chung (Shared Layer) & Schema Hardening
- [x] **Task 1.1**: Tạo không gian làm việc `shared/` (`types/`, `schemas/`, `constants/`).
- [x] **Task 1.2**: Định nghĩa các Interface dữ liệu cốt lõi (`TelemetryData`, `VisionDetection`, `SorterConfig`, `ClassificationRecord`, `AlertEvent`, `User`, `SafeUser`, payloads an toàn).
- [x] **Task 1.3**: Xây dựng bộ Zod Schemas với cơ chế `.passthrough()` đảm bảo tính tương thích mở rộng cho firmware ESP32-C5.
- [x] **Task 1.4**: Cấu hình TypeScript path alias `@shared/*` trong `tsconfig.json`.

### ✅ Giai Đoạn 2: Phân Rã Giao Diện Frontend (Frontend Modularization)
- [x] **Task 2.1**: Phân rã tệp `src/app/page.tsx` từ 988 dòng xuống component tinh gọn với các subcomponents độc lập (`KpiStatGrid.tsx`, `LiveHealthAndBinWidget.tsx`, `CalendarWidget.tsx`, `RecentActivityList.tsx`, `TemperatureGaugeWidget.tsx`).
- [x] **Task 2.2**: Chuẩn hóa cụm điều khiển Băng Tải trong `src/components/conveyor/` (`ConveyorControls.tsx`, `QuickFeedBar.tsx`, `BinTrays.tsx`).
- [x] **Task 2.3**: Xây dựng các Modal và Toast thông báo an toàn (`ForgotPasswordModal.tsx`, `ChangePasswordModal.tsx`, `ExportDialog.tsx`, `EmergencyConfirmModal.tsx`, `EmergencyUnlockToast.tsx`, `JamUnlockToast.tsx`, `BinFullToast.tsx`, `TemperatureWarningToast.tsx`, `DeviceOfflineToast.tsx`, `ShiftSummaryModal.tsx`, `ShiftSummaryToast.tsx`, `MqttDisconnectedToast.tsx`).

### ✅ Giai Đoạn 3: Xây Dựng Tầng Backend Độc Lập & Xác Thực Đa Lớp
- [x] **Task 3.1**: Thiết lập máy chủ `node:http` độc lập tại `backend/src/server.ts` (Port 5000).
- [x] **Task 3.2**: Xây dựng tầng Điều khiển & Nghiệp vụ (`userController`, `configController`, `historyController`, `statsController`, `alertController`, `safetyController`, `safetyService`, `mqttService`, `sseService`).
- [x] **Task 3.3**: Quản lý dữ liệu bền vững và Seeder (`data/users.json`, `data/notifications.json`, `seed_admins.ts`, `seed_admins.sql`).
- [x] **Task 3.4**: Chuẩn bị DDL Migrations cho đa hệ quản trị cơ sở dữ liệu (SQLite, PostgreSQL, MySQL, MongoDB).

### ✅ Giai Đoạn 4: Hệ Thống An Toàn Công Nghiệp, SSE & Cô Lập Mô Phỏng
- [x] **Task 4.1**: Thiết lập `safetyService.ts`, `safetyController.ts`, `safetyRoutes.ts`, `apiSafetyClient.ts`.
- [x] **Task 4.2**: Xây dựng tính năng Dừng Khẩn Cấp (E-Stop): ngắt băng chuyền, còi hú liên tục, banner đỏ toàn màn hình, mở khóa an toàn Admin Only và chống loop echo 5s.
- [x] **Task 4.3**: Xây dựng tính năng Cảnh Báo Kẹt Phôi (`jam_detected`): topic MQTT `conveyor/sensor/jam`, Toast cảnh báo đỏ, cơ cấu servo gạt, nút dọn khay chủ động bất kỳ lúc nào.
- [x] **Task 4.4**: Thiết lập luồng Stream thời gian thực Server-Sent Events (`backend/src/services/sseService.ts` & `/api/events`).
- [x] **Task 4.5**: Tạo kho dữ liệu thông báo bền vững `data/notifications.json` và `notificationModel.ts`.
- [x] **Task 4.6**: Gắn nhãn định danh chế độ trong Email & Telegram cảnh báo (`🧪 Chế độ Giả Lập` / `🔴 Phần cứng Thực Tế`).
- [x] **Task 4.7**: Cô lập triệt để các chức năng test giả lập (chỉ xuất hiện và hoạt động ở chế độ Mô phỏng, hoàn toàn bị ẩn và chặn ở chế độ Thực tế).
- [x] **Task 4.8**: Xây dựng tính năng Cảnh Báo Khay Đầy (`bin_full`): topic MQTT `conveyor/storage/bin_status`, Severity `warning`, Toast & Banner vàng cam bền vững, nút "Xác nhận đã thay khay mới" reset về 0.
- [x] **Task 4.9**: Xây dựng tính năng Cảnh Báo Quá Nhiệt Động Cơ / CPU Edge AI (`temperature_warning`): topic MQTT `conveyor/telemetry/temp`, Gauge Chart đổi kim vào vùng đỏ.
- [x] **Task 4.10**: Xây dựng tính năng Cảnh Báo Thiết Bị Phần Cứng / ESP32 Ngoại Tuyến (`device_offline`): Cơ chế nhịp tim ping `conveyor/heartbeat` chu kỳ 2s, watchdog phát hiện gián đoạn > 6s.
- [x] **Task 4.11**: Xây dựng tính năng Báo Cáo 1 Ngày Làm Việc (`shift_summary`): Event Code `shift_summary`, Severity `INFO`, trigger tự động lúc 17:00 hàng ngày hoặc bấm nút trên TopHeader, xuất CSV UTF-8 BOM chuẩn tiếng Việt và in báo cáo.
- [x] **Task 4.12**: Xây dựng thanh trượt điều chỉnh dung lượng từng khay (5 - 50 SP), đồng bộ tức thời sang LocalStorage, state toàn hệ thống, widget giám sát, băng chuyền trực quan và chẩn đoán cấu hình.
- [x] **Task 4.13**: Xây dựng cảnh báo Mất kết nối MQTT Broker (`mqtt_disconnected`): Watchdog mất kết nối quá 5 giây, huy hiệu Header đổi đỏ chớp nháy, cơ chế auto-reconnect backoff 3s, 5s, 10s.
- [x] **Task 4.14**: Xây dựng Đồng Hồ Nhiệt Độ Bán Nguyệt 2 Chế Độ (`TemperatureGaugeWidget.tsx`): Mô phỏng với thanh trượt ảo 30°C - 95°C; Thực tế với bảng telemetry cảm biến DS18B20 thật.

### ✅ Giai Đoạn 5: Tích Hợp Toàn Diện, Mobile Capacitor & Kiểm Thử QA
- [x] **Task 5.1**: Tích hợp build script backend tự động vá alias module `@shared/*` (`backend/scripts/patch-dist-aliases.cjs`).
- [x] **Task 5.2**: Chuẩn hóa script chạy đồng thời `npm run dev:all` (`scripts/dev-all.cjs`).
- [x] **Task 5.3**: Bổ sung xác thực session token an toàn qua `authToken.ts` và chuẩn hóa endpoint logout.
- [x] **Task 5.4**: Xác thực toàn bộ 16 file test hiện được nối trong `npm test`.
- [x] **Task 5.5**: Typecheck 0 lỗi (`npx tsc --noEmit --pretty false`) và production build Next.js hoàn tất; số lượng route phụ thuộc App Router hiện tại.
- [x] **Task 5.6**: Đóng gói Mobile Native App bằng **Capacitor 8**, xuất file `SortiX-Dashboard.apk` (4.1MB) và tối ưu Viewport di động.
- [x] **Task 5.7**: Có asset QR `SortiX_Dashboard.png`; URL LAN cần cấu hình theo máy chủ hiện tại thay vì coi IP cũ là mặc định.

---

## 3. Tổng Hợp Ma Trận Kiểm Thử Tự Động (Quality Matrix)

| Test Suite | Số lượng Tests | Trạng thái | Nội dung kiểm tra |
| :--- | :---: | :---: | :--- |
| `tests/history.test.cjs` | 9 | ✅ PASS | Bộ đệm giới hạn 1000 bản ghi, phân trang, migration |
| `tests/api_schemas.test.cjs` | 3 | ✅ PASS | Zod schema validation & thuộc tính `.passthrough()` |
| `tests/users.test.cjs` | 14 | ✅ PASS | Bcrypt, OTP, RBAC, chống leo thang đặc quyền, xóa Admin |
| `tests/estop_safety.test.cjs` | 5 | ✅ PASS | Dừng khẩn cấp, admin unlock, chống loop echo 5s |
| `tests/jam_detection.test.cjs` | 6 | ✅ PASS | Cảm biến quang kẹt phôi, broadcast SSE, MQTT topic |
| `tests/jam_simulation_audio.test.cjs` | 5 | ✅ PASS | Còi báo kẹt phôi, còi khay đầy và UI Guard |
| `tests/bin_full.test.cjs` | 7 | ✅ PASS | Cảnh báo đầy khay, topic bin_status, SSE broadcast |
| `tests/temperature_warning.test.cjs` | 8 | ✅ PASS | Quá nhiệt thiết bị, topic telemetry/temp, nhãn Edge AI |
| `tests/device_offline.test.cjs` | 10 | ✅ PASS | ESP32 offline watchdog 6s, heartbeat ping 2s |
| `tests/shift_summary.test.cjs` | 8 | ✅ PASS | Tổng kết ca, CSV UTF-8 BOM, phân quyền tải báo cáo |
| `tests/bin_sliders_sync.test.cjs` | 8 | ✅ PASS | Thanh trượt dung lượng 5-50 SP, clamp logic, đồng bộ UI |
| `tests/mqtt_disconnected.test.cjs` | 12 | ✅ PASS | Mất kết nối MQTT 5s, auto-reconnect backoff, âm thanh báo |
| `tests/temperature_gauge_simulation_vs_real.test.cjs` | 4 | ✅ PASS | Chuyển đổi giao diện Mô phỏng vs Thực tế |
| `tests/daily_report_sync.test.cjs` | 6 | ✅ PASS | Đồng bộ số liệu live Báo Cáo 1 Ngày Làm Việc |
| `tests/simulation_mode_guard.test.cjs` | 3 | ✅ PASS | Cô lập tuyệt đối chế độ Mô phỏng và Thực tế |
| `tests/cross_device_sync.test.cjs` | 7 | ✅ PASS | Đồng bộ mode, running, speed, khay và SSE giữa nhiều client |
| **TỔNG CỘNG trong script root** | **115** | **PASS** | **16 file test; chưa gồm các file test bổ sung ngoài script** |

---

## 4. Lộ Trình Triển Khai Mở Rộng Tiếp Theo

### 📌 Giai Đoạn 6: Đóng Gói Docker & Triển Khai Thực Nghiệm Bệnh Viện
1. **Tích hợp Database Driver Chính Thức**:
   - Cung cấp tùy chọn chuyển đổi cấu hình `DB_TYPE=sqlite|postgres|mysql` trong `.env`.
   - Kết nối Prisma / Drizzle ORM tới cơ sở dữ liệu vật lý dựa trên các tệp DDL migrations đã chuẩn bị sẵn.
2. **Đóng Gói Docker & Orchestration**:
   - Xây dựng `Dockerfile` tối ưu hóa đa tầng (multi-stage build) cho Frontend Next.js và Backend `node:http`.
   - Viết `docker-compose.yml` tích hợp sẵn EMQX MQTT Broker, Backend API, Frontend Dashboard và PostgreSQL.
3. **Thực Nghiệm Phần Cứng IoT ESP32-C5 & Stress Testing Trong Phòng Mổ**:
   - Kiểm thử áp lực truyền nhận 100 gói tin telemetry/giây trên băng chuyền vật lý thực tế.
   - Đo lường độ trễ mạng Wi-Fi 6 trong môi trường phòng phẫu thuật bệnh viện.
