# KIẾN TRÚC HỆ THỐNG SORTIX DASHBOARD (SYSTEM ARCHITECTURE)

> **Tài liệu Kỹ Thuật Đồ Án PBL3**: Hệ thống điều khiển, giám sát và phân loại sản phẩm trên băng chuyền tự động thông minh tích hợp IoT (ESP32-C5) & Vision AI.

---

## 1. Tổng Quan Kiến Trúc (High-Level Architecture)

Hệ thống **SortiX Dashboard** được thiết kế theo mô hình kiến trúc phân tầng chuyên biệt (**Layered Architecture**) và quản lý mã nguồn dưới dạng **Monorepo**. Kiến trúc phân định rạch ròi 4 khối chính:

1. **Frontend (Giao diện Client)**: Ứng dụng Next.js 14 App Router, chịu trách nhiệm trực quan hóa đồ họa 60fps, âm thanh công nghiệp thuần, hiển thị đồng hồ đo nhiệt độ, các thanh trượt điều chỉnh dung lượng khay (5-50 SP) và tương tác người dùng.
2. **Backend (Máy chủ Dịch vụ API)**: Máy chủ Express/Node.js độc lập xử lý xác thực, phân quyền RBAC, giám sát an toàn (E-Stop, Kẹt phôi, Khay đầy, Quá nhiệt, Thiết bị offline, Mất kết nối MQTT, Báo cáo 1 ngày làm việc), broadcast SSE và lưu trữ dữ liệu bền vững.
3. **Shared Layer (Tầng Dùng Chung)**: Định nghĩa kiểu dữ liệu (Types), Zod Schemas và hằng số hệ thống dùng chung cho cả Frontend và Backend.
4. **IoT & Vision Gateway**: Cầu nối truyền thông hai chiều thời gian thực giữa vi điều khiển ESP32-C5, cụm cảm biến/cơ cấu piston đẩy và MQTT Broker qua Wi-Fi 6.

```
                  ┌────────────────────────────────────────────────────────┐
                  │                 FRONTEND (Client / UI)                 │
                  │  Next.js 14 App Router • TailwindCSS • Recharts       │
                  │  Web Audio Industrial Sound Synthesizer                │
                  │  HTML5 Canvas 60fps Physics & Piston Sorter Loop       │
                  │  Dynamic Bin Capacities (5 - 50 SP) Sync Sliders       │
                  │  Dual-Mode Temperature Gauge Dial (Sim vs Real)        │
                  │  Báo Cáo 1 Ngày Làm Việc (Shift Summary Live Sync)     │
                  │  Banners: E-Stop, Jam Incident, Bin Full Incident      │
                  │  Auth Context, Profile & Safety State Management       │
                  └───────────┬───────────────────┬────────────┬───────────┘
                              │ Fetch REST API    │ SSE Stream │ WSS (Browser)
                              │ (via Clients)     │ /api/events│
                              ▼                   ▼            ▼
┌─────────────────────────────────────────────┐   ┌────────────────────────┐
│            BACKEND (Server Layer)           │   │    MQTT BROKER / IoT   │
│  - Routes: /api/auth, /api/safety, ...      │   │  (EMQX / Mosquitto)    │
│  - Controllers: safetyController, user, ... │   │  Topics:               │
│  - Services: safetyService, sseService, ... │   │  - sorter/01/telemetry │
│  - Models: notificationModel, userModel     │   │  - sorter/01/vision    │
│  - Security: Bcrypt, OTP, RBAC Middleware   │   │  - sorter/01/control   │
│  - Multi-DB Migrations (SQL / NoSQL)        │   │  - sorter/01/estop     │
│  - Email (SMTP) & Telegram Bot Integration  │   │  - conveyor/sensor/jam │
│  - MQTT Watchdog (5s Debounce, Backoff)     │   │  - conveyor/storage/*  │
│  - Device Heartbeat Watchdog (6s Timeout)   │   │  - conveyor/heartbeat  │
│  - In-Memory Rate Limiting & Safe Bounding  │   │  - conveyor/telemetry/*│
└──────────────────────┬──────────────────────┘   └───────────▲────────────┘
                       │                                      │ Wi-Fi 6
                       ▼                          ┌───────────┴────────────┐
┌─────────────────────────────────────────────┐   │     ESP32-C5 Hardware  │
│          PERSISTENCE & DATA STORE           │   │ (Sensors S1-S3, Piston)│
│  - data/users.json (User Accounts Store)    │   └────────────────────────┘
│  - data/notifications.json (Safety Events)  │
│  - SQLite / PostgreSQL / MySQL / MongoDB    │
└─────────────────────────────────────────────┘
```

---

## 2. Phân Tích Chi Tiết Từng Tầng (Layer Breakdown)

### 2.1. Shared Layer (`shared/`)
Đóng vai trò là "nguồn sự thật duy nhất" (Single Source of Truth) giữa Client và Server:
- **`types/index.ts`**:
  - `TelemetryData`: Vận tốc encoder, nhiệt độ vi điều khiển, trạng thái cảm biến S1–S3.
  - `VisionDetection`: Nhãn sản phẩm (brand_c, brand_p, brand_r, brand_a), độ tin cậy confidence (0.0 – 1.0), timestamp.
  - `SorterConfig`: Cấu hình quy tắc phân loại nhãn vào 3 khay chứa, versioning và cơ chế áp dụng.
  - `ClassificationRecord`: Bản ghi phân loại lịch sử (id, product_id, brand, khay đích, khay thực tế, trạng thái).
  - `User`, `SafeUser`, `AuthCredentials`: Kiểu dữ liệu xác thực và quản lý tài khoản.
  - Payloads sự cố an toàn: `EmergencyStopPayload`, `JamDetectedPayload`, `BinFullPayload`, `TemperatureWarningPayload`, `DeviceOfflinePayload`, `HeartbeatPayload`, `ShiftSummaryPayload`, `MqttDisconnectedPayload`.
- **`schemas/index.ts`**:
  - Toàn bộ validation schemas viết bằng **Zod**.
  - **Quy tắc `.passthrough()`**: Tất cả schema tương tác với thiết bị và sự kiện ngoại vi đều kích hoạt `.passthrough()` để firmware ESP32-C5 có thể bổ sung các trường chẩn đoán mới mà không gây crash ứng dụng.
- **`constants/index.ts`**:
  - Danh sách MQTT Topics (`TELEMETRY`, `VISION`, `CONTROL`, `ESTOP`, `JAM`, `BIN_STATUS`, `TEMP`, `HEARTBEAT`).
  - Mã màu khay chuẩn hóa (Khay 1: Xanh lá, Khay 2: Xanh dương, Khay 3: Cam/Vàng).
  - Định mức dung lượng mặc định (50 SP, dải điều chỉnh [5, 50]).

### 2.2. Backend Layer (`backend/`)
Được thiết kế theo mô hình MVC thu gọn (Model - Controller - Service - Route):
- **Controllers (`backend/src/controllers/`)**:
  - `safetyController.ts`: Tiếp nhận và xử lý sự cố dừng khẩn cấp E-Stop, kẹt phôi, khay đầy, quá nhiệt, thiết bị ngoại tuyến, nhịp tim ping, báo cáo 1 ngày làm việc, mất/phục hồi MQTT, mở khóa an toàn và truy vấn thông báo.
  - `userController.ts`: Đăng ký, đăng nhập, đổi mật khẩu, quên mật khẩu OTP, quản lý danh sách người dùng.
  - `configController.ts`: Tiếp nhận và xuất bản cấu hình phân loại.
  - `historyController.ts`: Lọc, phân trang và dọn dẹp lịch sử phân loại.
  - `statsController.ts`: Tổng hợp số liệu KPI và tỷ lệ phân loại thành công.
  - `alertController.ts`: Xử lý gửi email cảnh báo và thông báo Telegram Bot.
- **Services (`backend/src/services/`)**:
  - `safetyService.ts`: Quản lý trạng thái khóa an toàn (`is_locked`), lưu trữ sự cố vào `notifications.json`, kiểm tra phân quyền mở khóa chỉ dành cho Admin, cơ chế chống kẹt loop echo 5s, và xử lý toàn bộ các sự kiện cảnh báo đa kênh.
  - `sseService.ts`: Quản lý danh sách kết nối SSE clients, broadcast sự kiện khẩn cấp thời gian thực tức thời qua `/api/events`.
  - `userService.ts`: Logic nghiệp vụ băm mật khẩu Bcrypt, cấp phát mã Mock OTP 6 chữ số (thời hạn 5 phút), kiểm tra phân quyền RBAC và ràng buộc an toàn (chặn tự xóa Admin, bảo vệ tối thiểu 1 Admin).
  - `alertNotificationService.ts`: Tích hợp Nodemailer (SMTP) và Telegram Bot API kèm gắn nhãn định danh chế độ (`🧪 Chế độ Giả Lập` / `🔴 Phần cứng Thực Tế`) và Rate Limiting chống spam.
  - `historyService.ts` & `configService.ts`: Quản lý nghiệp vụ lịch sử và cấu hình.
- **Models (`backend/src/models/`)**:
  - `notificationModel.ts`: Lưu trữ bền vững các sự cố an toàn vào file `data/notifications.json`.
  - `userModel.ts`: Thao tác dữ liệu người dùng bền vững trên file `data/users.json`, tích hợp sẵn Admin Seeder khởi tạo 4 tài khoản Ban Quản trị.
  - `historyModel.ts` & `configModel.ts`: Quản lý bộ nhớ đệm an toàn (Bounded Buffer tối đa 1000 bản ghi), loại trừ nguy cơ tràn RAM.
- **Middlewares (`backend/src/middlewares/`)**:
  - `authMiddleware.ts`: Kiểm tra Bearer Token, kiểm tra quyền hạn `requireAdmin`.
  - `validateMiddleware.ts`: Kiểm định đầu vào JSON qua Zod Schema trước khi chạm tới Controller.
  - `errorMiddleware.ts`: Bắt và định dạng lỗi ngoại lệ đồng nhất (`{ success: false, message: ... }`).

### 2.3. Frontend Layer (`frontend/`)
Xây dựng trên nền tảng Next.js 14 App Router với hiệu năng tối ưu:
- **Trực quan hóa vật lý 60fps & Piston Chuyển Hướng (`useConveyorPhysics.ts`)**:
  - Vòng lặp `requestAnimationFrame` tính toán tọa độ di chuyển của vật thể trên băng chuyền.
  - Mô phỏng cơ cấu **Piston đẩy thụt ra thụt vô** (Piston Stroke IO23, IO24) đẩy sản phẩm vào đúng máng trượt Khay 1, Khay 2 hoặc đi thẳng vào Khay 3.
  - Cho phép người dùng **dọn khay chủ động bất kỳ lúc nào** ngay trên giao diện mà không cần đợi đủ định mức.
- **Độ Rộng & Sức Chứa Khay Linh Hoạt (Dynamic Bin Capacities 5 - 50 SP)**:
  - Cung cấp 3 thanh trượt điều chỉnh độ rộng/sức chứa riêng biệt cho từng khay trên `ConveyorVisualizer.tsx`, `BinTrays.tsx`, `LiveHealthAndBinWidget.tsx` và `ConfigAndDiagnostics.tsx`.
  - Tự động lưu trữ và đồng bộ hóa trạng thái qua `useSorterData.ts` và `localStorage ('sortix_bin_capacities')`.
  - Khi số lượng đạt định mức của từng khay, hệ thống kích hoạt cảnh báo đầy khay tương ứng.
- **Đồng Hồ Nhiệt Độ Bán Nguyệt 2 Chế Độ (`TemperatureGaugeWidget.tsx`)**:
  - *Mô phỏng*: Hiển thị thanh trượt nhiệt độ ảo (30°C - 95°C) kèm preset buttons (42.5°C, 72.0°C, 78.5°C) để kiểm thử cảnh báo quá nhiệt.
  - *Thực tế*: Ẩn toàn bộ thanh trượt ảo, hiển thị bảng telemetry phần cứng (ESP32 DS18B20) với cờ `[PHẦN CỨNG THẬT]`.
- **Báo Cáo 1 Ngày Làm Việc (`ShiftSummaryModal.tsx`, `ShiftSummaryToast.tsx`)**:
  - Nút bấm trực tiếp trên `TopHeader.tsx` ("Báo cáo 1 ngày làm việc") và tự động nhắc nhở lúc 17:00.
  - Đồng bộ hóa trực tiếp số liệu thời gian thực từ khay chứa, số sản phẩm đạt/lỗi, thời gian vận hành và số lần E-Stop.
  - Hỗ trợ xuất file CSV có UTF-8 BOM chuẩn tiếng Việt cho Excel và mẫu in báo cáo chuẩn.
- **Giám Sát Mất Kết Nối MQTT (`MqttDisconnectedToast.tsx`, `TopHeader.tsx`)**:
  - Debounce 5 giây chống nhấp nháy mạng ngắn hạn.
  - Tự động đổi huy hiệu trạng thái trên TopHeader: `MQTT: ONLINE (Xanh)` <-> `MQTT: DISCONNECTED (Đỏ chớp nháy)`.
  - Lịch trình tự động kết nối lại (auto-reconnect backoff: 3s -> 5s -> 10s) và Toast phục hồi màu xanh.
- **Bộ tổng hợp âm thanh (`audioService.ts`)**:
  - Ứng dụng Web Audio API thuần của trình duyệt để sinh sóng âm công nghiệp (Sine/Square Oscillator).
  - Hỗ trợ còi báo động khẩn cấp E-Stop hú liên tục, còi báo kẹt phôi, còi báo đầy khay, còi cảnh báo quá nhiệt, âm cảnh báo mất kết nối MQTT và chime phục hồi kết nối.

---

## 3. Các Luồng Dữ Liệu Cốt Lõi (Core Data Flows)

### 3.1. Luồng Giám Sát & Phân Loại Sản Phẩm (Telemetry & Vision Flow)
```
[Camera AI / Cảm biến S1-S3]
            │
            ▼ (MQTT Publish: vision/telemetry)
     [MQTT Broker]
            │
            ▼ (WebSocket Subscribe)
      [Dashboard Frontend]
            ├──> Cập nhật tọa độ & kích hoạt piston đẩy trên Canvas 60fps
            ├──> Phát âm thanh khí nén / cảm biến qua Web Audio API
            ├──> Kiểm tra sức chứa từng khay (5 - 50 SP) -> Cảnh báo nếu đầy khay
            └──> Ghi nhận vào Lịch sử phân loại (Frontend/Backend History)
```

### 3.2. Luồng Dừng Khẩn Cấp (E-Stop) & Mở Khóa An Toàn (Safe Unlock)
```
[Nút E-Stop Vật Lý (IO10) / Web UI]
            │
            ├──> Dừng ngay lập tức băng chuyền (isRunning = false)
            ├──> Bật còi báo động hú liên tục (Continuous Alarm)
            ├──> Hiển thị Banner khóa toàn màn hình (is_locked = true)
            │
            ▼
     [POST /api/safety/estop]
            ├──> Lưu thông báo sự cố vào data/notifications.json
            ├──> Gửi Email SMTP & Telegram Bot (gắn nhãn Mô phỏng / Thực tế)
            └──> Broadcast sự kiện SSE tới toàn bộ client qua /api/events
            │
            ▼
  [Yêu cầu Mở Khóa: POST /api/safety/unlock]
            ├──> Kiểm tra quyền Quản trị viên (Admin Only - Chặn 403 đối với User)
            ├──> Bắt buộc nhập ghi chú xác nhận an toàn hiện trường
            ├──> Áp dụng thời gian ân hạn 5 giây chống lặp echo từ MQTT/SSE
            └──> Tắt còi hú, gỡ bỏ banner khóa, cho phép băng tải tái khởi động
```

### 3.3. Luồng Phân Định: Kẹt Phôi (`jam_detected`) vs Đầy Khay (`bin_full`)
```
[Vật cản che khuất > 5s tại Sensor #02]     [Khay chứa đạt định mức (vd: 30/30 hoặc 50/50 SP)]
                 │                                                │
                 ▼                                                ▼
     [SỰ CỐ KẸT PHÔI]                                 [CẢNH BÁO ĐẦY KHAY]
  - MQTT: conveyor/sensor/jam                      - MQTT: conveyor/storage/bin_status
  - Dừng băng tải ngay lập tức                     - Băng tải vẫn tiếp tục hoặc tạm dừng nạp
  - Còi hú gián đoạn báo kẹt                       - Còi chuông cảnh báo đầy khay
  - Banner đỏ kẹt phôi (JamIncidentBanner)         - Banner vàng cam (BinFullIncidentBanner)
  - Phôi trên Canvas đổi sang đỏ chớp nháy         - Toast thông báo nhắc thay khay mới
  - Nút "Xác nhận gỡ kẹt" gỡ lỗi                   - Nút "Xác nhận đã thay khay mới" reset khay
```

### 3.4. Luồng Giám Sát Nhiệt Độ & Gauge Dial 2 Chế Độ
```
                      [Chế Độ Hoạt Động]
                      /                \
           (Mô phỏng)                   (Thực tế)
               │                            │
               ▼                            ▼
   [Thanh Trượt Ảo 30°C - 95°C]      [Cảm biến ESP32 DS18B20]
   [Presets: 42.5°C, 72°C, 78.5°C]    [Telemetry qua MQTT: conveyor/telemetry/temp]
               │                            │
               └─────────────┬──────────────┘
                             ▼
              [Đồng Hồ Bán Nguyệt (Gauge Dial)]
              - < 70°C: Vùng xanh an toàn
              - 70°C - 75°C: Vùng vàng chú ý
              - > 75°C: Vùng đỏ QUÁ NHIỆT (Temperature Warning)
                             │
                             ▼ (Nếu > 75°C)
              - Gửi cảnh báo: POST /api/safety/temp-warning
              - Toast vàng cam & còi báo quá nhiệt
```

### 3.5. Luồng Giám Sát Mất Kết Nối MQTT Broker
```
[Client Socket / TCP Disconnected]
            │
            ▼ (Bắt đầu bộ đếm thời gian mất kết nối)
   [Debounce Watchdog 5 Giây]
            │ (Nếu mất kết nối liên tục >= 5s)
            ▼
    [Kích Hoạt Cảnh Báo CRITICAL: mqtt_disconnected]
            ├──> TopHeader đổi huy hiệu sang: "MQTT: DISCONNECTED" (Đỏ chớp nháy)
            ├──> Hiển thị MqttDisconnectedToast với số lần thử kết nối
            ├──> Phát còi cảnh báo mất kết nối (Web Audio API)
            └──> Gửi POST /api/safety/mqtt-disconnected lưu notifications.json
            │
            ▼ (Lịch trình Auto-Reconnect Backoff: 3s -> 5s -> 10s)
[Kết Nối Thành Công Trở Lại]
            ├──> TopHeader phục hồi: "MQTT: ONLINE" (Xanh)
            ├──> Phát chime âm thanh phục hồi
            ├──> Hiển thị Toast thông báo phục hồi thành công
            └──> Gửi POST /api/safety/mqtt-connected cập nhật trạng thái
```

### 3.6. Luồng Đồng Bộ Báo Cáo 1 Ngày Làm Việc (Shift Summary)
```
[Tự động lúc 17:00 HOẶC Nhấn nút "Báo cáo 1 ngày làm việc" trên TopHeader]
            │
            ▼
   [Tổng hợp dữ liệu thời gian thực từ Sorter Data]
   - Số lượng từng khay: Khay 1 (Coca), Khay 2 (Pepsi), Khay 3 (Lỗi/Khác)
   - Tổng sản phẩm = Tổng 3 khay
   - Tỷ lệ đạt = (Khay 1 + Khay 2) / Tổng * 100%
   - Số lần E-Stop ghi nhận trong ca
   - Thời gian vận hành băng tải
            │
            ▼
   [Đồng bộ sang Backend: POST /api/safety/shift-summary]
            ├──> Lưu bản ghi [BÁO CÁO 1 NGÀY LÀM VIỆC] vào notifications.json
            ├──> Broadcast sự kiện SSE shift_summary tới các client
            │
            ▼
   [Hiển thị Modal & Hỗ trợ Xuất dữ liệu]
   - ShiftSummaryModal: Biểu đồ trực quan và bảng số liệu
   - Nút "Xuất file CSV": Xuất file UTF-8 BOM hiển thị chuẩn tiếng Việt
   - Nút "In báo cáo": Mẫu in tiêu chuẩn A4
```

---

## 4. Cơ Chế Độ Tin Cậy & An Toàn Hệ Thống

1. **Bộ Đệm Lịch Sử Giới Hạn (Bounded Store Pattern)**:
   - Bộ nhớ máy chủ giới hạn lưu trữ tối đa 1000 bản ghi phân loại và 100 sự kiện cảnh báo.
   - Khi vượt ngưỡng, các bản ghi cũ nhất tự động được giải phóng (FIFO eviction) để bảo vệ bộ nhớ RAM.
2. **Kẹp Giới Hạn Sức Chứa Khay (Clamping [5, 50] SP)**:
   - Sức chứa định mức của mỗi khay được kiểm soát an toàn trong khoảng từ 5 đến 50 sản phẩm.
   - Mọi giá trị nhập vào vượt biên đều được tự động kẹp về cận an toàn gần nhất.
3. **Ngăn Ngừa Tấn Công Leo Thang Đặc Quyền (Privilege Escalation Prevention)**:
   - Endpoint đăng ký tự do (`/api/auth/register`) luôn gán cứng quyền `role: 'user'` bất kể dữ liệu gửi lên.
   - Chỉ duy nhất Admin đã đăng nhập mới có quyền thay đổi role hoặc tạo tài khoản Admin mới qua `/api/users`.
4. **Bảo Vệ Tính Toàn Vẹn Của Ban Quản Trị**:
   - Hệ thống từ chối mọi yêu cầu xóa tài khoản Admin nếu số lượng Admin còn lại $\le 1$.
   - Admin không được phép tự xóa tài khoản của chính mình khi phiên làm việc đang kích hoạt.
5. **Cơ Chế Chống Kẹt Lặp Tín Hiệu Dừng Khẩn Cấp (Anti-Echo Grace Period)**:
   - Sau khi Admin mở khóa an toàn thành công, hệ thống tự động kích hoạt bộ đếm thời gian ân hạn 5 giây.
   - Trong khoảng thời gian này, mọi tín hiệu dừng khẩn cấp gửi từ MQTT hoặc SSE đều bị bỏ qua để tránh việc hệ thống bị tái khóa ngoài ý muốn do độ trễ mạng.
6. **Cô Lập Kiểm Thử Tuyệt Đối Giữa Mô Phỏng & Thực Tế (Strict Simulation Isolation)**:
   - Toàn bộ các nút kiểm thử giả lập (test kẹt phôi, giả lập E-Stop, nạp phôi mẫu, tạo dữ liệu demo, ngắt thử MQTT, thanh trượt nhiệt độ ảo) **chỉ hiển thị ở chế độ Mô phỏng (`isSimulation === true`)**.
   - Khi chuyển sang chế độ Thực tế (`isSimulation === false`):
     - Giao diện ẩn hoàn toàn tất cả các nút bấm và thanh trượt giả lập thử nghiệm.
     - Hiển thị bảng telemetry cảm biến phần cứng thật (ESP32 DS18B20).
     - Các hàm xử lý kẹt phôi / nạp phôi ảo đều kiểm tra và chặn các thao tác có nguồn gốc từ người dùng hoặc động cơ vật lý canvas ảo.
     - Đảm bảo 100% dữ liệu thống kê sản xuất và cảnh báo sự cố phản ánh chính xác tín hiệu từ phần cứng ESP32-C5 và camera thật.
