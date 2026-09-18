# THIẾT KẾ KIẾN TRÚC HỆ THỐNG (SORTIX SYSTEM ARCHITECTURE)

> **Tài liệu Kỹ Thuật Đồ Án PBL3**: Hệ thống điều khiển, giám sát và phân loại sản phẩm trên băng chuyền tự động thông minh tích hợp vi điều khiển IoT (ESP32-C5) & Thị giác máy tính (Vision AI) với kiến trúc 1-Codebase đa nền tảng (Desktop Web, Android APK & iOS PWA).

---

## 📌 Mục Lục
1. [Tổng Quan Kiến Trúc (High-Level Architecture)](#1-tổng-quan-kiến-trúc-high-level-architecture)
2. [Phân Tích Chi Tiết Từng Tầng (Layer Breakdown)](#2-phân-tích-chi-tiết-từng-tầng-layer-breakdown)
   - 2.1. Shared Layer (`shared/`)
   - 2.2. Backend Layer (`backend/`)
   - 2.3. Frontend Web Layer (`frontend/`)
   - 2.4. Mobile Shell Layer (Capacitor Android & iOS PWA)
3. [Các Luồng Dữ Liệu Cốt Lõi (Core Data Flows)](#3-các-luồng-dữ-liệu-cốt-lõi-core-data-flows)
4. [Kiến Trúc Luồng Sự Kiện Thời Gian Thực (SSE & MQTT Architecture)](#4-kiến-trúc-luồng-sự-kiện-thời-gian-thực-sse--mqtt-architecture)
5. [Kiến Trúc Lưu Trữ & Chuyển Đổi Dữ Liệu (Persistence & Migrations)](#5-kiến-trúc-lưu-trữ--chuyển-đổi-dữ-liệu-persistence--migrations)
6. [Mô Hình Bảo Mật & Ràng Buộc An Toàn (Security Architecture)](#6-mô-hình-bảo-mật--ràng-buộc-an-toàn-security-architecture)
7. [Kiến Trúc Kiểm Thử & Cổng Chất Lượng (Quality Gates & Testing)](#7-kiến-trúc-kiểm-thử--cổng-chất-lượng-quality-gates--testing)

---

## 1. Tổng Quan Kiến Trúc (High-Level Architecture)

Hệ thống **SortiX Dashboard** được thiết kế theo mô hình kiến trúc phân tầng chuyên biệt (**Layered Architecture**) và quản lý mã nguồn dưới dạng **Monorepo (npm workspaces)**. Kiến trúc phân định 5 khối chức năng liên kết chặt chẽ:

1. **Frontend Web (Giao diện Client)**: Ứng dụng Next.js 14 App Router, chịu trách nhiệm trực quan hóa đồ họa Canvas 60fps, âm thanh công nghiệp tổng hợp qua Web Audio API, đồng hồ nhiệt độ bán nguyệt 2 chế độ, các thanh trượt điều chỉnh dung lượng khay (5-50 SP) và tương tác người dùng.
2. **Mobile Shell Layer (Ứng Dụng Di Động)**: Vỏ bọc Hybrid đa nền tảng sử dụng **Capacitor 8** để đóng gói thành ứng dụng **Android APK** native và hỗ trợ **iOS PWA Standalone** toàn màn hình từ cùng 1 codebase.
3. **Backend API Server**: Máy chủ Express/Node.js độc lập xử lý xác thực, phân quyền RBAC, giám sát an toàn công nghiệp (E-Stop, Kẹt phôi, Khay đầy, Quá nhiệt, Thiết bị offline, Mất kết nối MQTT, Báo cáo 1 ngày làm việc), broadcast SSE và lưu trữ dữ liệu bền vững.
4. **Shared Layer (Tầng Dùng Chung)**: Định nghĩa kiểu dữ liệu (Types), Zod Schemas và hằng số hệ thống dùng chung giữa Frontend, Mobile và Backend.
5. **IoT & Vision Gateway**: Cầu nối truyền thông hai chiều thời gian thực giữa vi điều khiển ESP32-C5, cụm cảm biến/cơ cấu piston đẩy và MQTT Broker qua Wi-Fi 6.

```
      ┌────────────────────────────────────────────────────────┐
      │               CROSS-PLATFORM CLIENTS                   │
      │  ┌──────────────────┐            ┌──────────────────┐  │
      │  │ Desktop Browser  │            │ Android App (APK)│  │
      │  │ Chrome/Edge/Brave│            │ Capacitor Bridge │  │
      │  └────────┬─────────┘            └────────┬─────────┘  │
      │           │    ┌──────────────────┐       │            │
      │           └───>│  iOS PWA Safari  │<──────┘            │
      │                │  Standalone Mode │                    │
      │                └────────┬─────────┘                    │
      └─────────────────────────┼──────────────────────────────┘
                                │
                                ▼
      ┌────────────────────────────────────────────────────────┐
      │                 FRONTEND (Next.js 14 App Router)       │
      │  TailwindCSS • HTML5 Canvas 60fps Physics Piston Loop  │
      │  Web Audio Industrial Sound • Dynamic Bin Capacities   │
      │  Dual-Mode Gauge Dial • Báo Cáo 1 Ngày Làm Việc        │
      │  Mobile Drawer Sidebar • Header Quick-Toggle Pill      │
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
Đóng vai trò là nguồn sự thật duy nhất (Single Source of Truth) giữa Client và Server:
- **`types/index.ts`**:
  - `TelemetryData`: Vận tốc encoder, nhiệt độ vi điều khiển, trạng thái cảm biến S1–S3.
  - `VisionDetection`: Nhãn sản phẩm (`brand_c`, `brand_p`, `brand_r`, `brand_a`), độ tin cậy confidence (0.0 – 1.0), timestamp.
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
  - `authToken.ts`: Quản lý ký và kiểm tra tính hợp lệ của token phiên làm việc.
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

### 2.3. Frontend Web Layer (`frontend/`)
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

### 2.4. Mobile Shell Layer (Capacitor Android & iOS PWA)
- **Mô hình 1-Codebase Hybrid Bridge**:
  - Đóng gói giao diện Next.js 14 thành ứng dụng Native Android qua **Capacitor 8**.
  - Không sử dụng chế độ tĩnh `output: 'export'` tĩnh để bảo vệ toàn vẹn 18 dynamic API routes và SSE stream `/api/events`.
  - Kết nối thông qua cấu hình `server.url` linh hoạt:
    - Máy ảo Android Studio: `http://10.0.2.2:3000` (địa chỉ loopback máy host).
    - Thiết bị thật qua Wi-Fi cục bộ: `http://192.168.1.4:3000` (LAN IP).
    - Triển khai Cloud: URL Vercel / Custom Domain.
  - Trang dự phòng ngoại tuyến `frontend/out/index.html` bảo đảm app không bị sập khi chưa có kết nối mạng.
- **Cấu hình Quyền & Mạng (`AndroidManifest.xml`)**:
  - Kích hoạt `android:usesCleartextTraffic="true"` cho phép giao tiếp HTTP nội bộ trong quá trình phát triển và kết nối vi điều khiển qua IP cục bộ.
  - Cấp các quyền mạng cần thiết: `INTERNET`, `ACCESS_NETWORK_STATE`.
- **Tối ưu Viewport & Giao Diện Cảm Ứng Di Động**:
  - Tích hợp chuẩn Next.js 14 `Viewport` trong `frontend/src/app/layout.tsx`:
    - `viewportFit: "cover"`: Tràn viền thích ứng tai thỏ và đảo Dynamic Island trên thiết bị mới.
    - `maximumScale: 1, userScalable: false`: Vô hiệu hóa tính năng zoom vô tình làm biến dạng Canvas 60fps khi người dùng chạm thao tác nhanh trên băng tải.
    - `themeColor: "#070b14"`: Đồng bộ màu sắc thanh trạng thái điện thoại với theme tối công nghiệp.
- **Điều Hướng & Chuyển Đổi Chế Độ Trên Màn Hình Nhỏ**:
  - **TopHeader Quick-Toggle Pill**: Nút bấm nhỏ gọn dạng viên nang trên thanh tiêu đề di động (`flex shrink-0 sm:hidden`) cho phép Admin chuyển đổi nhanh chế độ Mô phỏng / Thực tế chỉ bằng một chạm.
  - **Sidebar Drawer Switcher**: Ngăn kéo menu trượt từ cạnh trái (kích hoạt qua nút Hamburger) bố trí khối "CHẾ ĐỘ VẬN HÀNH" kích thước lớn, trực quan ngay đầu danh mục điều hướng.

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
 [Web & Mobile Frontend]
            ├──> Cập nhật tọa độ & kích hoạt piston đẩy trên Canvas 60fps
            ├──> Phát âm thanh khí nén / cảm biến qua Web Audio API
            ├──> Kiểm tra sức chứa từng khay (5 - 50 SP) -> Cảnh báo nếu đầy khay
            └──> Ghi nhận vào Lịch sử phân loại (Frontend/Backend History)
```

### 3.2. Luồng Dừng Khẩn Cấp (E-Stop) & Mở Khóa An Toàn (Safe Unlock)
```
[Nút E-Stop Vật Lý (IO10) / Web UI / Mobile App]
            │
            ├──> Dừng ngay lập tức băng chuyền (isRunning = false)
            ├──> Bật còi báo động hú liên tục (Continuous Alarm)
            ├──> Hiển thị Banner khóa toàn màn hình (is_locked = true)
            │
            ▼ (POST /api/safety/estop)
     [Safety Service]
            ├──> Lưu trữ sự cố vào data/notifications.json
            ├──> Gửi Email & Telegram cảnh báo
            └──> Broadcast SSE: event "emergency_stop" tới tất cả Clients (Web & Mobile)
            
                        ═════════════════════════════
                        
[Admin Xác Thực Mở Khóa (POST /api/safety/unlock)]
            │
            ├──> Kiểm tra quyền Quản trị viên (Admin RBAC Gate)
            ├──> Ghi nhận lý do mở khóa vào lịch sử sự cố
            ├──> Thiết lập thời gian ân hạn 5 giây chống lặp echo tín hiệu
            ├──> Tắt còi báo động và ẩn Banner khóa
            └──> Broadcast SSE: event "safety_unlocked"
```

---

## 4. Kiến Trúc Luồng Sự Kiện Thời Gian Thực (SSE & MQTT Architecture)

Hệ thống kết hợp cả hai mô hình truyền thông thời gian thực:
1. **MQTT qua WebSocket**: Dành cho dữ liệu telemetry cao tần (60fps, tọa độ cảm biến, nhận diện camera).
2. **Server-Sent Events (SSE)**: Dành cho các sự kiện trạng thái hệ thống, cảnh báo an toàn và đồng bộ đa màn hình từ máy chủ xuống client.

```
[IoT Hardware / Controller] ──(MQTT)──> [MQTT Broker] ──(WSS)──> [Web & Mobile Clients]
                                                                        ▲
[Backend Safety Engine] ─────(SSE /api/events Broadcast)────────────────┘
```

---

## 5. Kiến Trúc Lưu Trữ & Chuyển Đổi Dữ Liệu (Persistence & Migrations)

Hệ thống cung cấp cơ chế lưu trữ hai tầng linh hoạt:
- **Tầng 1 (Mặc định - Zero Setup)**: Lưu trữ bền vững trên JSON file store (`data/users.json`, `data/notifications.json`).
- **Tầng 2 (Doanh Nghiệp - Production)**: Bộ migrations chuẩn hóa trong `backend/database/migrations/` sẵn sàng triển khai trên:
  - SQLite: `001_create_users_table_sqlite.sql`
  - PostgreSQL: `001_create_users_table_postgres.sql`
  - MySQL: `001_create_users_table_mysql.sql`
  - MongoDB: `001_create_users_mongodb.js`

---

## 6. Mô Hình Bảo Mật & Ràng Buộc An Toàn (Security Architecture)

1. **Mật khẩu an toàn**: Mọi mật khẩu được băm bằng thuật toán `bcrypt` với `10 salt rounds`.
2. **Phiên làm việc ký số**: Token phiên làm việc được ký số bảo mật, xác thực người dùng và vai trò qua `authToken.ts`.
3. **Phân quyền vai trò chặt chẽ (RBAC)**:
   - Chỉ người dùng có vai trò `admin` mới được truy cập các tài nguyên quản trị máy, xóa lịch sử, thay đổi quy tắc phân loại và mở khóa E-Stop.
4. **Ngăn ngừa leo thang đặc quyền**: Luồng đăng ký tài khoản tự do luôn bị ép cứng vai trò `user`.
5. **Ràng buộc sinh tồn Admin**:
   - Admin không thể tự xóa tài khoản của chính mình khi đang đăng nhập.
   - Không thể xóa tài khoản Admin nếu chỉ còn duy nhất 1 Quản trị viên trong hệ thống.
6. **Mã Mock OTP 6 chữ số**: Thời hạn hiệu lực 5 phút (300 giây), vô hiệu hóa ngay sau khi sử dụng và chặn khôi phục từ bên ngoài đối với các tài khoản Admin.

---

## 7. Kiến Trúc Kiểm Thử & Cổng Chất Lượng (Quality Gates & Testing)

Dự án áp dụng quy trình kiểm định chất lượng phần mềm nghiêm ngặt với 15 bộ test suites tự động bảo đảm **108/108 tests PASS (100%)**:

```
tests/
├── api_schemas.test.cjs               # Zod validation & passthrough
├── bin_full.test.cjs                  # Sự cố đầy khay & cảnh báo
├── bin_sliders_sync.test.cjs          # Đồng bộ dung lượng khay (5-50 SP)
├── daily_report_sync.test.cjs         # Chuẩn hóa Báo Cáo 1 Ngày Làm Việc
├── device_offline.test.cjs            # Watchdog mất kết nối ESP32 (6s)
├── estop_safety.test.cjs              # Dừng khẩn cấp E-Stop & mở khóa
├── history.test.cjs                   # Quản lý bộ nhớ đệm lịch sử
├── jam_detection.test.cjs             # Sự cố kẹt phôi cảm biến quang
├── jam_simulation_audio.test.cjs      # Âm thanh còi hú & UI Guard
├── mqtt_disconnected.test.cjs         # Watchdog mất kết nối MQTT (5s)
├── shift_summary.test.cjs             # Tổng kết ca & xuất báo cáo CSV
├── simulation_mode_guard.test.cjs     # Cô lập chế độ Mô phỏng & Thực tế
├── temperature_gauge_simulation_vs_real.test.cjs # Đồng hồ nhiệt độ 2 chế độ
├── temperature_warning.test.cjs       # Cảnh báo quá nhiệt động cơ/CPU
└── users.test.cjs                     # Bảo mật tài khoản, Bcrypt & RBAC
```
