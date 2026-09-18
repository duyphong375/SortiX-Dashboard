# KẾ HOẠCH TÁI CẤU TRÚC VÀ LỘ TRÌNH PHÁT TRIỂN HỆ THỐNG SORTIX DASHBOARD

> **Dự án**: SortiX Dashboard (Đồ án PBL3)  
> **Phiên bản kiến trúc**: Monorepo v2.6.0  
> **Trạng thái**: Đã hoàn thành Tái cấu trúc Monorepo, Tầng Shared, Backend độc lập, Xác thực đa lớp, Hệ thống An toàn Công nghiệp (E-Stop, Jam Detection, Bin Full, Temperature Warning, Device Offline Heartbeat, MQTT Disconnected Alert, Dynamic Bin Width/Capacity Sliders 5-50 SP, Dual-Mode Temperature Gauge Dial, Báo Cáo 1 Ngày Làm Việc Live Sync) & Bộ kiểm thử tự động toàn diện 108/108 tests PASS (100% - 15 Test Suites).

---

## 1. Mục Tiêu Tái Cấu Trúc (Refactoring Goals)

1. **Phân rã Monolithic Codebase**: Tách biệt dứt điểm giữa Frontend (Next.js 14 App Router), Backend (Node.js/Express + TypeScript) và Thư viện Dùng chung (`shared/`).
2. **Loại bỏ sự phụ thuộc quá mức vào LocalStorage**: Thiết lập kiến trúc dữ liệu phân tầng với API RESTful, file store bền vững (`data/users.json`, `data/notifications.json`), và bộ scripts migration sẵn sàng kết nối các hệ quản trị cơ sở dữ liệu lớn (SQLite, PostgreSQL, MySQL, MongoDB).
3. **Nâng cấp Hệ Thống Bảo Mật & Xác Thực Doanh Nghiệp**:
   - Chuyển đổi từ tài khoản cứng sang cơ chế xác thực Bcrypt băm mật khẩu 10 salt rounds.
   - Phân quyền RBAC chặt chẽ (Admin vs User), ngăn chặn Privilege Escalation.
   - Cơ chế cấp phát và kiểm chứng Mock OTP đặt lại mật khẩu với thời hạn 5 phút.
   - Ràng buộc an toàn: Không cho phép Admin tự xóa chính mình; Bắt buộc luôn duy trì tối thiểu 1 Admin.
4. **Hệ Thống An Toàn Công Nghiệp & Cô Lập Kiểm Thử (Industrial Safety & Simulation Isolation)**:
   - Dừng khẩn cấp E-Stop: Còi báo liên tục, banner toàn màn hình, mở khóa yêu cầu quyền Admin kèm lý do an toàn, chống loop echo 5s.
   - Cảnh báo Kẹt phôi (`jam_detected`): Cảm biến quang học #02 che khuất liên tục > 5s, MQTT `conveyor/sensor/jam`, chuyển hướng bằng piston khí nén, dọn khay chủ động bất kỳ lúc nào.
   - Cảnh báo Khay đầy (`bin_full`): Đạt ngưỡng dung lượng định mức từng khay (5 - 50 SP), topic MQTT `conveyor/storage/bin_status`, còi báo, nút dọn/thay khay reset bộ đếm và tự chạy lại.
   - Thanh trượt tùy chỉnh độ rộng / sức chứa khay (5 - 50 SP): Đồng bộ tức thời trên Canvas máng trượt, LiveHealthAndBinWidget, ConfigAndDiagnostics và LocalStorage.
   - Đồng hồ đo nhiệt độ bán nguyệt 2 chế độ: Thanh trượt ảo 30°C - 95°C trong Mô phỏng; Bảng telemetry cảm biến ESP32 DS18B20 trong Thực tế.
   - Cảnh báo Quá nhiệt (`temperature_warning`): Đo nhiệt độ động cơ/CPU, ngưỡng 75°C, topic MQTT `conveyor/telemetry/temp`, Gauge Chart đổi kim vùng đỏ.
   - Cảnh báo Mất kết nối Vi điều khiển (`device_offline`): Cơ chế nhịp tim ping `conveyor/heartbeat` mỗi 2s, watchdog timeout > 6s tự động phát hiện mất nguồn/WiFi, severity `ERROR`.
   - Cảnh báo Mất kết nối MQTT Broker (`mqtt_disconnected`): Debounce 5s, còi báo, đổi huy hiệu TopHeader sang đỏ chớp nháy, auto-reconnect backoff 3s -> 5s -> 10s.
   - Báo cáo 1 ngày làm việc (`shift_summary`): Đồng bộ trực tiếp số lượng 3 khay, số bản ghi đạt/lỗi, số lần E-Stop, xuất CSV UTF-8 BOM chuẩn tiếng Việt.
   - Cô lập triệt để: Mọi nút test giả lập (E-Stop, Kẹt phôi, Khay đầy, Quá nhiệt, Offline ESP32, Test ngắt MQTT) chỉ hiển thị và hoạt động ở chế độ Mô Phỏng, hoàn toàn bị ẩn và chặn ở chế độ Thực Tế.
5. **Bảo toàn và Mở rộng Kiểm Thử Tự Động (Quality Gate)**:
   - Đảm bảo 100% các bộ test hồi quy luôn chạy tự động và đạt tỷ lệ Pass 100% (**108/108 tests PASS - 15 Test Suites**).
   - Kiểm tra kiểu dữ liệu nghiêm ngặt qua TypeScript Strict Mode (0 errors, 0 warnings) và ESLint (0 errors).

---

## 2. Nhật Ký Tiến Độ Thực Thi (Execution Progress)

### ✅ Giai Đoạn 1: Tách Tầng Dùng Chung (Shared Layer) & Schema Hardening
- [x] **Task 1.1**: Tạo không gian làm việc `shared/` (`types/`, `schemas/`, `constants/`).
- [x] **Task 1.2**: Định nghĩa các Interface dữ liệu cốt lõi (`TelemetryData`, `VisionDetection`, `SorterConfig`, `ClassificationRecord`, `AlertEvent`, `User`, `SafeUser`, `EmergencyStopPayload`, `JamDetectedPayload`, `BinFullPayload`, `TemperatureWarningPayload`, `DeviceOfflinePayload`, `HeartbeatPayload`, `ShiftSummaryPayload`, `MqttDisconnectedPayload`).
- [x] **Task 1.3**: Xây dựng bộ Zod Schemas với cơ chế `.passthrough()` đảm bảo tính tương thích với firmware ESP32-C5.
- [x] **Task 1.4**: Cấu hình TypeScript path alias `@shared/*` trong `tsconfig.json`.

### ✅ Giai Đoạn 2: Phân Rã Giao Diện Frontend (Frontend Modularization)
- [x] **Task 2.1**: Phân rã tệp `src/app/page.tsx` từ 988 dòng xuống ~90 dòng với các subcomponents độc lập (`KpiStatGrid.tsx`, `LiveHealthAndBinWidget.tsx`, `CalendarWidget.tsx`, `RecentActivityList.tsx`, `TemperatureGaugeWidget.tsx`).
- [x] **Task 2.2**: Chuẩn hóa cụm điều khiển Băng Tải trong `src/components/conveyor/` (`ConveyorControls.tsx`, `QuickFeedBar.tsx`, `BinTrays.tsx`).
- [x] **Task 2.3**: Xây dựng các Modal giao diện bảo mật & an toàn (`ForgotPasswordModal.tsx`, `ChangePasswordModal.tsx`, `ExportDialog.tsx`, `EmergencyConfirmModal.tsx`, `EmergencyUnlockToast.tsx`, `JamUnlockToast.tsx`, `BinFullToast.tsx`, `TemperatureWarningToast.tsx`, `DeviceOfflineToast.tsx`, `ShiftSummaryModal.tsx`, `ShiftSummaryToast.tsx`, `MqttDisconnectedToast.tsx`).

### ✅ Giai Đoạn 3: Xây Dựng Tầng Backend Độc Lập & Xác Thực Đa Lớp
- [x] **Task 3.1**: Thiết lập máy chủ Express độc lập tại `backend/src/server.ts` (Port 5000).
- [x] **Task 3.2**: Xây dựng tầng Điều khiển & Nghiệp vụ (Controllers & Services: `user`, `config`, `history`, `stats`, `alertNotification`, `safetyService`, `safetyController`, `mqttService`, `sseService`).
- [x] **Task 3.3**: Quản lý dữ liệu bền vững và Seeder (`data/users.json`, `data/notifications.json`, `seed_admins.ts`, `seed_admins.sql`).
- [x] **Task 3.4**: Chuẩn bị DDL Migrations cho đa hệ quản trị cơ sở dữ liệu (SQLite, PostgreSQL, MySQL, MongoDB).

### ✅ Giai Đoạn 4: Hệ Thống An Toàn Công Nghiệp, SSE & Cô Lập Mô Phỏng
- [x] **Task 4.1**: Thiết lập `safetyService.ts`, `safetyController.ts`, `safetyRoutes.ts`, `apiSafetyClient.ts`.
- [x] **Task 4.2**: Xây dựng tính năng Dừng Khẩn Cấp (E-Stop): ngắt băng chuyền, còi hú liên tục, banner đỏ toàn màn hình, mở khóa an toàn Admin Only và chống loop echo 5s.
- [x] **Task 4.3**: Xây dựng tính năng Cảnh Báo Kẹt Phôi (`jam_detected`): topic MQTT `conveyor/sensor/jam`, Toast cảnh báo đỏ, cơ cấu piston đẩy thay servo gạt, nút dọn khay chủ động bất kỳ lúc nào.
- [x] **Task 4.4**: Thiết lập luồng Stream thời gian thực Server-Sent Events (`backend/src/services/sseService.ts` & `/api/events`).
- [x] **Task 4.5**: Tạo kho dữ liệu thông báo bền vững `data/notifications.json` và `notificationModel.ts`.
- [x] **Task 4.6**: Gắn nhãn định danh chế độ trong Email & Telegram cảnh báo (`🧪 Chế độ Giả Lập` / `🔴 Phần cứng Thực Tế`).
- [x] **Task 4.7**: Cô lập triệt để các chức năng test giả lập (chỉ xuất hiện và hoạt động ở chế độ Mô phỏng, hoàn toàn bị ẩn và chặn ở chế độ Thực tế).
- [x] **Task 4.8**: Xây dựng tính năng Cảnh Báo Khay Đầy (`bin_full`): topic MQTT `conveyor/storage/bin_status`, Severity `warning`, Toast & Banner vàng cam bền vững, thanh tiến trình 100%, icon nhấp nháy, nút "Xác nhận đã thay khay mới" reset về 0.
- [x] **Task 4.9**: Xây dựng tính năng Cảnh Báo Quá Nhiệt Động Cơ / CPU Edge AI (`temperature_warning`): topic MQTT `conveyor/telemetry/temp`, Severity `warning`, Toast cảnh báo vàng cam, Đồng hồ đo nhiệt độ bán nguyệt (Gauge Chart) trên Dashboard tự động đổi kim vào vùng đỏ.
- [x] **Task 4.10**: Xây dựng tính năng Cảnh Báo Thiết Bị Phần Cứng / ESP32 Ngoại Tuyến (`device_offline`): Cơ chế nhịp tim ping `conveyor/heartbeat` chu kỳ 2s, watchdog phát hiện gián đoạn > 6s, Severity `ERROR`, Toast đỏ góc màn hình.
- [x] **Task 4.11**: Xây dựng tính năng Báo Cáo 1 Ngày Làm Việc (`shift_summary`): Event Code `shift_summary`, Severity `INFO`, trigger tự động lúc 17:00 hàng ngày hoặc bấm nút "Báo cáo 1 ngày làm việc" trên TopHeader, Toast xanh `[BÁO CÁO 1 NGÀY LÀM VIỆC]`, Modal bảng thống kê trực quan, nút Tải báo cáo CSV UTF-8 BOM chuẩn tiếng Việt và in báo cáo.
- [x] **Task 4.12**: Xây dựng thanh trượt điều chỉnh mức số lượng độc lập cho từng khay (Khay 1, Khay 2, Khay 3) với biên độ 0 - 50 SP, nút preset nhanh (0 Rỗng, 25 Nửa khay, 50 Đầy), đồng bộ tức thời dữ liệu sang LocalStorage, state toàn hệ thống, widget giám sát, băng chuyền trực quan và chẩn đoán cấu hình.
- [x] **Task 4.13**: Xây dựng cảnh báo "Mất kết nối máy chủ tin nhắn MQTT Broker" (`mqtt_disconnected`): Event Code `mqtt_disconnected`, Severity `CRITICAL`, watchdog mất kết nối quá 5 giây, huy hiệu Header đổi `MQTT: ONLINE (Xanh)` sang `MQTT: DISCONNECTED (Đỏ chớp nháy)`, Toast nổi, cơ chế auto-reconnect backoff 3s, 5s, 10s, Toast phục hồi xanh `[ĐÃ PHỤC HỒI] Kết nối MQTT Broker thành công`, nút demo "Ngắt kết nối MQTT Client" / "Khôi phục kết nối MQTT" trong trang Cấu hình và Thiết bị.
- [x] **Task 4.14**: Xây dựng thanh trượt điều chỉnh độ rộng / sức chứa khay (5 - 50 SP): Cho phép đặt sức chứa định mức riêng biệt cho từng khay (ví dụ chỉnh Khay 1 là 30 thì chỉ chứa tối đa 30 sản phẩm là báo đầy), đồng bộ hóa toàn diện qua `useSorterData.ts`, `ConveyorVisualizer.tsx`, `BinTrays.tsx`, `LiveHealthAndBinWidget.tsx`, `ConfigAndDiagnostics.tsx` và lưu trữ bền vững trên `localStorage ('sortix_bin_capacities')`.
- [x] **Task 4.15**: Xây dựng Đồng Hồ Nhiệt Độ Bán Nguyệt 2 Chế Độ (`TemperatureGaugeWidget.tsx`): Chế độ Mô phỏng cung cấp thanh trượt ảo (30°C - 95°C) và các nút preset (42.5°C, 72.0°C, 78.5°C); Chế độ Thực tế tự động ẩn thanh trượt giả lập, hiển thị bảng telemetry cảm biến phần cứng thật (ESP32 DS18B20) với cờ `[PHẦN CỨNG THẬT]`.
- [x] **Task 4.16**: Chuẩn hóa nhãn "BÁO CÁO 1 NGÀY LÀM VIỆC" và luồng đồng bộ trực tiếp số liệu: Kết nối live số lượng từ 3 khay chứa, số sản phẩm đạt/lỗi, thời gian vận hành và số lần dừng khẩn cấp vào Modal báo cáo, file xuất CSV và template in ấn.

### ✅ Giai Đoạn 5: Đảm Bảo Chất Lượng & Kiểm Thử Toàn Diện (108/108 Tests PASS - 15 Suites)
- [x] **Task 5.1**: `tests/history.test.cjs` (9 tests PASS): Bounded buffer, migration, normalization.
- [x] **Task 5.2**: `tests/api_schemas.test.cjs` (3 tests PASS): Schema validation, passthrough.
- [x] **Task 5.3**: `tests/users.test.cjs` (14 tests PASS): Bcrypt, OTP, RBAC, Privilege Escalation, Admin deletion constraints.
- [x] **Task 5.4**: `tests/estop_safety.test.cjs` (5 tests PASS): Dừng khẩn cấp, admin unlock, chống loop echo 5s.
- [x] **Task 5.5**: `tests/jam_detection.test.cjs` (6 tests PASS): Cảm biến quang kẹt phôi, broadcast SSE, MQTT topic.
- [x] **Task 5.6**: `tests/simulation_mode_guard.test.cjs` (3 tests PASS): Phân định và cô lập chế độ Mô phỏng và Thực tế.
- [x] **Task 5.7**: `tests/jam_simulation_audio.test.cjs` (5 tests PASS): Kiểm thử còi báo kẹt phôi, còi khay đầy và UI Guard.
- [x] **Task 5.8**: `tests/bin_full.test.cjs` (7 tests PASS): Schema validation, MQTT topic `conveyor/storage/bin_status`, SafetyService warning record, SSE broadcast, Controller.
- [x] **Task 5.9**: `tests/temperature_warning.test.cjs` (8 tests PASS): Schema validation, MQTT topic `conveyor/telemetry/temp`, SafetyService warning record, SSE broadcast, Controller, Edge AI label handling.
- [x] **Task 5.10**: `tests/device_offline.test.cjs` (10 tests PASS): Schema validation, default values, heartbeat ping schema, MQTT topic `conveyor/heartbeat`, Watchdog 6s evaluation, SafetyService trigger/recover, SSE broadcast, Controller.
- [x] **Task 5.11**: `tests/shift_summary.test.cjs` (8 tests PASS): Schema validation, default fallback values, SafetyService INFO record, SSE broadcast, Controller handler, UTF-8 BOM CSV export logic, Admin role gate.
- [x] **Task 5.12**: `tests/bin_sliders_sync.test.cjs` (8 tests PASS): LocalStorage persistence độc lập cho từng khay, clamp logic [5, 50], hook contract useSorterData, DashboardLayout Context provider, LiveHealthAndBinWidget sliders, ConveyorVisualizer chute sliders, ConfigAndDiagnostics simulation sliders.
- [x] **Task 5.13**: `tests/mqtt_disconnected.test.cjs` (12 tests PASS): Schema validation, 5s watchdog threshold, auto-reconnect backoff 3s-5s-10s, trigger/recover SafetyService, SSE broadcast, Header badge toggle, audio alarm/chime, toast message contracts.
- [x] **Task 5.14**: `tests/temperature_gauge_simulation_vs_real.test.cjs` (4 tests PASS): Kiểm thử chuyển đổi giao diện và logic giữa Mô phỏng và Thực tế của TemperatureGaugeWidget.
- [x] **Task 5.15**: `tests/daily_report_sync.test.cjs` (6 tests PASS): Kiểm thử nhãn chuẩn hóa "BÁO CÁO 1 NGÀY LÀM VIỆC" và luồng đồng bộ trực tiếp số liệu từ khay chứa và lịch sử phân loại.

---

## 3. Lộ Trình Phát Triển Tiếp Theo (Future Roadmap)

### 📌 Giai Đoạn 6: Kết Nối Cơ Sở Dữ Liệu Thực Tế & Docker Hóa (Upcoming)
1. **Tích hợp Database Driver**:
   - Cung cấp tùy chọn cấu hình `DB_DIALECT=sqlite|postgres|mysql` trong `.env` để tự động chuyển từ JSON File Store sang ORM/Query Builder (Prisma hoặc Drizzle ORM).
2. **Đóng Gói Docker & Orchestration**:
   - Viết `Dockerfile` tối ưu hóa đa tầng (multi-stage build) cho Frontend Next.js và Backend Express.
   - Tạo `docker-compose.yml` tích hợp sẵn EMQX MQTT Broker, Backend API, Frontend Dashboard và cơ sở dữ liệu PostgreSQL.
3. **Thực Nghiệm Phần Cứng IoT ESP32-C5**:
   - Tiến hành kiểm thử áp lực (stress test) truyền nhận 100 gói tin telemetry/giây trên băng chuyền thật.
   - Hiệu chỉnh độ trễ xử lý piston khí nén khi nhận diện sản phẩm ở vận tốc băng tải cao nhất (100%).
