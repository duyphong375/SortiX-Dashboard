# SortiX Dashboard — Hệ Thống Giám Sát & Phân Loại Sản Phẩm Thông Minh (IoT Sorter)

> **Đồ án PBL3 / Capstone Project**: Hệ thống điều khiển, giám sát và phân loại sản phẩm theo thời gian thực trên băng tải công nghiệp tích hợp IoT (ESP32-C5), thị giác máy tính và ứng dụng quản trị phân tầng.

---

## 📌 Mục Lục
1. [Giới Thiệu Tổng Quan](#1-giới-thiệu-tổng-quan)
2. [Kiến Trúc Hệ Thống (Monorepo Architecture)](#2-kiến-trúc-hệ-thống-monorepo-architecture)
3. [Công Nghệ Sử Dụng](#3-công-nghệ-sử-dụng)
4. [Tài Khoản Mặc Định & Phân Quyền (RBAC)](#4-tài-khoản-mặc-định--phân-quyền-rbac)
5. [Cài Đặt & Khởi Chạy](#5-cài-đặt--khởi-chạy)
6. [Chế Độ Vận Hành: Mô Phỏng vs. Máy Thật](#6-chế-độ-vận-hành-mô-phỏng-vs-máy-thật)
7. [Các Trang Chức Năng Chính](#7-các-trang-chức-năng-chính)
8. [Hệ Thống An Toàn, Giám Sát & Cảnh Báo](#8-hệ-thống-an-toàn-giám-sát--cảnh-báo)
9. [Hệ Thống Xác Thực & Bảo Mật](#9-hệ-thống-xác-thực--bảo-mật)
10. [Kiểm Thử & Đảm Bảo Chất Lượng (QA)](#10-kiểm-thử--đảm-bảo-chất-lượng-qa)
11. [Biến Môi Trường (Environment Variables)](#11-biến-môi-trường-environment-variables)
12. [Xử Lý Sự Cố Thường Gặp (Troubleshooting)](#12-xử-lý-sự-cố-thường-gặp-troubleshooting)

---

## 1. Giới Thiệu Tổng Quan

**SortiX Dashboard** là nền tảng quản trị và vận hành toàn diện cho dây chuyền phân loại sản phẩm tự động. Hệ thống kết nối đồng bộ giữa vi điều khiển IoT (**ESP32-C5**), camera nhận diện thương hiệu/nhãn chai lọ, cụm cảm biến hồng ngoại & quang học, cơ cấu phân loại piston khí nén 3 khay và giao diện Dashboard giám sát 60fps trên nền tảng Web.

### Tính năng nổi bật:
- 🚀 **Trực quan hóa vật lý 60fps (HTML5 Canvas)**: Mô phỏng hành vi di chuyển của phôi chai/lon trên băng tải, qua cảm biến phát hiện và kích hoạt piston đẩy vào đúng khay theo thời gian thực.
- 🎚️ **Độ Rộng & Sức Chứa Khay Tùy Chỉnh (Dynamic Bin Capacities 5 - 50 SP)**: Mỗi khay cho phép tùy chỉnh định mức chứa từ 5 đến 50 sản phẩm qua thanh trượt mượt mà; tự động đồng bộ tức thời giữa thanh trượt máng trượt Canvas, Widget giám sát, trang Cấu hình và LocalStorage.
- 🌡️ **Đồng Hồ Đo Nhiệt Độ Bán Nguyệt (Dual-Mode Temperature Gauge)**: 
  - *Chế độ Mô phỏng*: Cung cấp thanh trượt ảo (30°C - 95°C) và các nút đặt nhanh (42.5°C, 72.0°C, 78.5°C) để thử nghiệm phản ứng quá nhiệt.
  - *Chế độ Thực tế*: Tự động ẩn thanh trượt giả lập, hiển thị bảng telemetry phần cứng (cảm biến DS18B20 / ESP32) với nhãn "Phần cứng đo trực tiếp" và kim đo nhảy theo telemetry thực.
- 📡 **Giám Sát Kết Nối IoT & Mạng Đa Tầng**:
  - Tự động phát hiện mất kết nối MQTT Broker quá 5 giây (`mqtt_disconnected`), đổi huy hiệu Header sang đỏ chớp nháy, phát còi cảnh báo và tự động kết nối lại theo lịch trình (3s -> 5s -> 10s).
  - Watchdog 6 giây giám sát nhịp tim định kỳ 2 giây (`conveyor/heartbeat`), cảnh báo tức thì khi vi điều khiển ESP32 ngoại tuyến (`device_offline`).
- 📋 **Báo Cáo 1 Ngày Làm Việc (Shift Summary)**:
  - Đồng bộ trực tiếp dữ liệu phân loại thực tế: số lượng 3 khay chứa, số sản phẩm đạt/lỗi, tỷ lệ chính xác, số lần dừng khẩn cấp và thời gian vận hành.
  - Hỗ trợ xem Modal thống kê, xuất báo cáo CSV có UTF-8 BOM hiển thị tiếng Việt chuẩn trên Excel, và mẫu in ấn / xuất PDF chuyên nghiệp.
- 🔊 **Âm thanh công nghiệp thuần (Web Audio API)**: Bộ phát âm thanh tổng hợp tín hiệu âm thanh cảnh báo còi hú, còi khay đầy, còi quá nhiệt, còi mất kết nối, tiếng piston nén khí và nạp phôi mà không phụ thuộc file âm thanh ngoài.
- 👥 **Quản lý người dùng & Phân quyền chặt chẽ (RBAC)**: Đầy đủ các luồng Đăng ký, Đăng nhập, Đổi mật khẩu, Quên mật khẩu OTP, Khóa/Mở tài khoản và chống leo thang đặc quyền.
- 🚨 **Cảnh báo đa kênh & An toàn công nghiệp**:
  - Tự động gửi Email (SMTP) và tin nhắn khẩn cấp qua Telegram Bot kèm nhãn định danh chế độ vận hành (`🧪 Chế độ Giả Lập` / `🔴 Phần cứng Thực Tế`).
  - Hệ thống **Dừng khẩn cấp (E-Stop)**: Dừng băng chuyền lập tức, còi hú liên tục, banner khóa an toàn, chỉ Admin có quyền mở khóa kèm lý do hiện trường và cơ chế chống kẹt loop echo 5s.
  - Phân định rõ ràng **Đầy khay (`bin_full`)** vs **Kẹt phôi (`jam_detected`)**: Đầy khay khi số lượng đạt định mức (ví dụ 30/30 hoặc 50/50 SP); Kẹt phôi khi cảm biến quang học #02 che khuất liên tục > 5 giây.
- 🔒 **Cô lập Chế độ Vận hành**: Toàn bộ nút giả lập thử nghiệm (test kẹt phôi, test E-Stop, nạp phôi ảo, tạo dữ liệu demo, ngắt thử kết nối) chỉ xuất hiện ở chế độ Mô phỏng, hoàn toàn bị ẩn và chặn ở chế độ Thực tế để bảo vệ dữ liệu phần cứng.

---

## 2. Kiến Trúc Hệ Thống (Monorepo Architecture)

Mã nguồn được tổ chức theo chuẩn **Monorepo (npm workspaces)** với sự phân định rạch ròi giữa Frontend, Backend độc lập và tầng Thư viện Dùng chung:

```
SortiX-Dashboard/
├── backend/                  # Standalone Backend Server (Node.js/Express + TypeScript)
│   ├── database/             # File migrations (SQLite, PostgreSQL, MySQL, MongoDB) & Seeds
│   │   ├── migrations/       # SQL scripts tạo bảng Users & Schema
│   │   └── seeds/            # Khởi tạo 4 tài khoản Quản trị viên ban đầu
│   ├── src/
│   │   ├── config/           # Cấu hình biến môi trường (env.ts)
│   │   ├── controllers/      # Điều phối nghiệp vụ (user, config, history, stats, alert, safety)
│   │   ├── middlewares/      # Auth JWT/Bearer, Zod validator, Error Handler
│   │   ├── models/           # Quản lý tầng dữ liệu (userModel, historyModel, configModel, notificationModel)
│   │   ├── routes/           # RESTful API endpoints (/api/auth, /api/users, /api/safety, ...)
│   │   ├── services/         # Logic nghiệp vụ (safetyService, sseService, alertNotificationService, mqttService, ...)
│   │   ├── utils/            # Tiện ích chuyển đổi dữ liệu và định dạng thông báo
│   │   └── server.ts         # Điểm khởi động HTTP Express Server (Port 5000)
│   ├── package.json
│   └── tsconfig.json
├── frontend/                 # Client UI Next.js 14 App Router
│   ├── public/               # Tài nguyên tĩnh, hình ảnh giao diện
│   ├── src/
│   │   ├── app/              # 9 Trang App Router & API routes nội bộ (/api/safety, /api/events, ...)
│   │   │   ├── page.tsx      # Trang Tổng Quan Dashboard
│   │   │   ├── conveyor/     # Trang Giám Sát Băng Tải Canvas 60fps
│   │   │   ├── config/       # Trang Cấu Hình Quy Tắc Phân Loại & Dung Lượng Khay
│   │   │   ├── analytics/    # Trang Phân Tích Số Liệu & Biểu Đồ Recharts
│   │   │   ├── devices/      # Trang Giám Sát Thiết Bị & Telemetry IoT
│   │   │   ├── history/      # Trang Bảng Lịch Sử Phân Loại & Xuất CSV
│   │   │   ├── alerts/       # Trang Quản Lý Cảnh Báo Sự Cố
│   │   │   ├── users/        # Trang Quản Trị Thành Viên & Phân Quyền (Admin Only)
│   │   │   └── login/        # Trang Đăng Nhập, Đăng Ký & Quên Mật Khẩu
│   │   ├── components/       # Components mô-đun hóa
│   │   │   ├── conveyor/     # BinTrays.tsx, ConveyorControls.tsx, QuickFeedBar.tsx
│   │   │   ├── layout/       # DashboardLayout, TopHeader, Sidebar, EmergencyStopBanner, JamIncidentBanner, BinFullIncidentBanner
│   │   │   ├── overview/     # KpiStatGrid, LiveHealthAndBinWidget, CalendarWidget, RecentActivityList
│   │   │   ├── ui/           # TemperatureGaugeWidget, ShiftSummaryModal, ShiftSummaryToast, MqttDisconnectedToast, EmergencyConfirmModal, EmergencyUnlockToast, JamUnlockToast, BinFullToast, TemperatureWarningToast, DeviceOfflineToast, ChangePasswordModal, ForgotPasswordModal, ExportDialog, Toast
│   │   │   ├── ConfigAndDiagnostics.tsx # Chẩn đoán & cấu hình thiết bị
│   │   │   └── ConveyorVisualizer.tsx    # Khối trực quan băng chuyền 60fps
│   │   ├── contexts/         # React Contexts (AuthContext, Theme, DashboardContext)
│   │   ├── hooks/            # useConveyorPhysics, useMQTT, useSorterData
│   │   ├── lib/              # Client utilities, Audio Service, Data Processor, CSV Exporter
│   │   └── services/         # API Clients (apiSafetyClient, apiConfigClient, apiHistoryClient, apiStatsClient)
│   ├── package.json
│   └── tsconfig.json
├── shared/                   # Tầng dùng chung giữa Frontend và Backend
│   ├── constants/            # Hằng số toàn hệ thống (Topics MQTT, mã màu khay, role, default configs)
│   ├── schemas/              # Zod validation schemas (.passthrough() linh hoạt cho firmware)
│   ├── types/                # TypeScript interfaces chuẩn mực
│   └── package.json
├── data/                     # Dữ liệu cục bộ bền vững (users.json, notifications.json)
├── docs/                     # Tài liệu kỹ thuật chi tiết
│   ├── architecture.md       # Thiết kế kiến trúc phân tầng, data flows & an toàn
│   ├── api.md                # Đặc tả toàn bộ RESTful API endpoints & SSE
│   └── REFACTOR_PLAN.md      # Kế hoạch & lộ trình nâng cấp hệ thống
├── tests/                    # Bộ kiểm thử tự động toàn diện (108/108 Tests PASS 100% - 15 Suites)
│   ├── api_schemas.test.cjs           # Kiểm thử schema Zod (Config, Record, Query)
│   ├── bin_full.test.cjs              # Kiểm thử cảnh báo đầy khay chứa (50/50 SP hoặc định mức)
│   ├── bin_sliders_sync.test.cjs      # Kiểm thử đồng bộ thanh trượt độ rộng / dung lượng khay (5-50 SP)
│   ├── daily_report_sync.test.cjs     # Kiểm thử đồng bộ dữ liệu Báo Cáo 1 Ngày Làm Việc
│   ├── device_offline.test.cjs        # Kiểm thử mất kết nối ESP32 và nhịp tim ping
│   ├── estop_safety.test.cjs          # Kiểm thử dừng khẩn cấp E-Stop & mở khóa an toàn
│   ├── history.test.cjs               # Kiểm thử lưu trữ, phân trang & dọn dẹp lịch sử
│   ├── jam_detection.test.cjs         # Kiểm thử cảnh báo kẹt phôi & cảm biến quang học
│   ├── jam_simulation_audio.test.cjs  # Kiểm thử âm thanh còi báo kẹt phôi & khay đầy
│   ├── mqtt_disconnected.test.cjs     # Kiểm thử mất kết nối Broker 5s & auto-reconnect
│   ├── shift_summary.test.cjs         # Kiểm thử tổng kết ca làm việc & xuất file báo cáo
│   ├── simulation_mode_guard.test.cjs # Kiểm thử cô lập giữa chế độ Mô phỏng và Thực tế
│   ├── temperature_gauge_simulation_vs_real.test.cjs # Kiểm thử đồng hồ nhiệt độ 2 chế độ
│   ├── temperature_warning.test.cjs   # Kiểm thử cảnh báo quá nhiệt động cơ / CPU AI
│   └── users.test.cjs                 # Kiểm thử bảo mật tài khoản, Bcrypt, OTP & RBAC
├── .env.example              # Mẫu biến môi trường cho Frontend Next.js
└── package.json              # Root package quản lý Monorepo Workspaces
```

---

## 3. Công Nghệ Sử Dụng

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, TailwindCSS, Lucide React, Recharts.
- **Backend**: Node.js, Express.js, TypeScript, Bcryptjs, Nodemailer, Telegram Bot API.
- **Dữ liệu & Xác thực**: Zod, JSON Store bền vững (`data/users.json`, `data/notifications.json`), Sẵn sàng kết nối SQLite / PostgreSQL / MySQL / MongoDB.
- **Truyền thông IoT**: MQTT over WebSocket (MQTT.js), Giao thức kết nối vi điều khiển ESP32-C5 qua Wi-Fi 6.
- **Đồ họa & Âm thanh**: HTML5 Canvas API (Physics Loop 60fps), Web Audio API (Chíp âm công nghiệp tổng hợp đa tầng).

---

## 4. Tài Khoản Mặc Định & Phân Quyền (RBAC)

Hệ thống được khởi tạo sẵn **4 tài khoản Quản trị viên (Admin)** đại diện cho các thành viên phát triển đề tài PBL3 và tài khoản Người dùng (User):

| Họ và tên | Username / Email | Mật khẩu mặc định | Vai trò | Quyền hạn |
| :--- | :--- | :--- | :--- | :--- |
| **Nguyễn Tá Duy Phong** | `admin1` / `admin1@gmail.com` | `123456` | **Quản trị viên (Admin)** | Toàn quyền cấu hình máy, xóa dữ liệu, dừng khẩn cấp, mở khóa an toàn, quản lý thành viên |
| **Nguyễn Nhật Minh** | `admin2` / `admin2@gmail.com` | `123456` | **Quản trị viên (Admin)** | Toàn quyền cấu hình máy, xóa dữ liệu, dừng khẩn cấp, mở khóa an toàn, quản lý thành viên |
| **Trần Đăng Lợi** | `admin3` / `admin3@gmail.com` | `123456` | **Quản trị viên (Admin)** | Toàn quyền cấu hình máy, xóa dữ liệu, dừng khẩn cấp, mở khóa an toàn, quản lý thành viên |
| **Nguyễn Đình Anh Tuấn** | `admin4` / `admin4@gmail.com` | `123456` | **Quản trị viên (Admin)** | Toàn quyền cấu hình máy, xóa dữ liệu, dừng khẩn cấp, mở khóa an toàn, quản lý thành viên |
| **Tài khoản Thử nghiệm** | `duyphong` / `duyphong@gmail.com` | `123456` | **Người vận hành (User)** | Theo dõi dashboard, giám sát băng tải, xem thống kê & lịch sử phân loại |

> 🔒 **Cơ chế bảo vệ an toàn cao cấp**:
> - Mọi tài khoản mới tạo qua trang Đăng ký tự do đều **bị ép cứng role: 'user'** để ngăn chặn leo thang đặc quyền.
> - Quản trị viên **không thể tự xóa tài khoản của chính mình** khi đang đăng nhập.
> - Hệ thống **bắt buộc luôn duy trì tối thiểu 1 Quản trị viên** (chặn thao tác xóa nếu chỉ còn duy nhất 1 Admin).

---

## 5. Cài Đặt & Khởi Chạy

### 5.1. Yêu cầu hệ thống
- **Node.js**: Phiên bản `18.17.0` trở lên (Khuyến nghị Node.js 20 LTS).
- **Trình duyệt**: Chrome, Microsoft Edge, Brave hoặc Firefox hiện đại.

### 5.2. Cài đặt các gói phụ thuộc
Tại thư mục gốc dự án:
```powershell
npm install
```

### 5.3. Thiết lập biến môi trường
Tạo tệp `.env` từ tệp mẫu:
```powershell
copy .env.example .env
copy backend\.env.example backend\.env
```

### 5.4. Khởi chạy ứng dụng

#### Cách 1: Khởi chạy nhanh toàn bộ hệ thống bằng npm scripts
- **Chạy đồng thời Frontend & Backend**:
  ```powershell
  npm run dev
  ```
- **Chạy riêng máy chủ Backend (Port 5000)**:
  ```powershell
  npm run dev --workspace=backend
  ```

Truy cập Dashboard tại: **[http://localhost:3000](http://localhost:3000)**.

---

## 6. Chế Độ Vận Hành: Mô Phỏng vs. Máy Thật

Người dùng có thể chuyển đổi linh hoạt chế độ vận hành ngay trên thanh tiêu đề (**TopHeader**):

### 6.1. Chế độ Mô Phỏng (Simulation Mode)
- **Mục đích**: Vận hành giả lập kiểm thử trực quan trên máy tính mà không cần cắm phần cứng ESP32 hay camera thật.
- **Hoạt động**:
  - Dữ liệu hoàn toàn độc lập, không gửi bản ghi giả vào hệ thống phần cứng thật.
  - Sử dụng các nút **Nạp nhanh (Coca-Cola, Pepsi, Red Bull, Aquafina)** hoặc **Phôi ngẫu nhiên** để đưa phôi lên băng chuyền.
  - Hiển thị thanh trượt nhiệt độ ảo (30°C - 95°C) và nút preset thử nghiệm quá nhiệt.
  - Thanh trượt điều chỉnh sức chứa từng khay (5 - 50 SP) và thanh trượt nạp mức phôi hiện có để test kịch bản đầy khay.
  - Nút thử nghiệm ngắt kết nối MQTT client, test E-Stop, test kẹt phôi.
  - Nút **Tạo dữ liệu demo** để tạo nhanh 50–100 bản ghi lịch sử phục vụ vẽ đồ thị thống kê.

### 6.2. Chế độ Máy Thật (Live Hardware Mode)
- **Mục đích**: Kết nối trực tiếp với hệ thống phần cứng thực tế qua giao thức MQTT.
- **Hoạt động**:
  - Nhận luồng dữ liệu phân loại từ camera AI (Vision topic: `sorter/01/vision`).
  - Lắng nghe tín hiệu cảm biến hồng ngoại S1, S2, S3 và bộ mã hóa encoder (Telemetry: `sorter/01/telemetry`).
  - Ẩn toàn bộ các thanh trượt giả lập nhiệt độ, các nút nạp giả lập, các nút test ngắt kết nối/kẹt phôi.
  - Hiển thị bảng giám sát telemetry cảm biến phần cứng thật (ESP32 DS18B20) với cờ `[PHẦN CỨNG THẬT]`.
  - Kích hoạt lệnh điều khiển hoặc cấu hình phân loại đẩy ngược lại thiết bị (`sorter/01/control`, `sorter/01/config`).

---

## 7. Các Trang Chức Năng Chính

| Trang | Đường dẫn | Chức năng chính |
| :--- | :--- | :--- |
| **Tổng Quan** | `/` | Hiển thị KPI thời gian thực, widget sức khỏe thiết bị ESP32, đồng hồ nhiệt độ bán nguyệt, 3 khay chứa và lịch hoạt động. |
| **Băng Tải** | `/conveyor` | Trực quan hóa băng chuyền Canvas 60fps, thanh trượt dung lượng khay (5-50 SP), nút dừng khẩn cấp E-Stop, cơ cấu piston xả phôi. |
| **Thống Kê** | `/analytics` | Biểu đồ Recharts phân tích sản lượng theo giờ, tỷ lệ phân loại thành công, phân bố nhãn hàng. |
| **Lịch Sử** | `/history` | Bảng tra cứu dữ liệu phân loại chi tiết, bộ lọc theo ngày/thương hiệu/khay, xuất dữ liệu CSV UTF-8 BOM, xóa dữ liệu. |
| **Cảnh Báo** | `/alerts` | Danh sách sự cố (kẹt phôi, đầy khay, quá nhiệt, ESP32 offline, mất MQTT), lọc theo mức độ rủi ro, kiểm tra trạng thái gửi Mail/Telegram. |
| **Cấu Hình** | `/config` | Gán quy tắc phân loại nhãn vào khay 1, 2 hoặc khay mặc định (khay 3), chỉnh sức chứa định mức 5-50 SP, quản lý versioning cấu hình. |
| **Thiết Bị & IoT**| `/devices` | Giám sát Broker MQTT, độ trễ mạng, IP thiết bị, tín hiệu encoder, nhịp tim ping và thông số telemetry vi điều khiển. |
| **Người Dùng** | `/users` | Quản lý danh sách thành viên (chỉ Admin), tạo tài khoản, phân quyền RBAC, khóa/mở khóa tài khoản. |
| **Đăng Nhập** | `/login` | Đăng nhập tài khoản, đăng ký tài khoản mới, quên mật khẩu và xác thực mã OTP 6 số. |

---

## 8. Hệ Thống An Toàn, Giám Sát & Cảnh Báo

1. **Dừng Khẩn Cấp (E-Stop)**:
   - Kích hoạt qua nút bấm vật lý (IO10) hoặc nút bấm trên Web Dashboard.
   - Lập tức ngắt động cơ băng tải (`isRunning = false`), bật còi hú liên tục, hiển thị Banner đỏ toàn màn hình.
   - Chỉ Admin mới có quyền mở khóa an toàn qua xác thực mật khẩu/ghi chú hiện trường; có cơ chế ân hạn 5 giây chống lặp echo tín hiệu.
2. **Phân Định Kẹt Phôi (`jam_detected`) vs Đầy Khay (`bin_full`)**:
   - **Kẹt phôi**: Xảy ra khi cảm biến quang học che khuất liên tục > 5 giây tại Cảm biến #02 / Zone A. Kích hoạt còi hú gián đoạn, hiển thị banner đỏ kẹt phôi, dừng băng tải và đổi màu phôi kẹt trên Canvas sang đỏ.
   - **Đầy khay**: Xảy ra khi số lượng sản phẩm trong khay đạt tới sức chứa định mức (`current_count >= max_capacity`, ví dụ 30/30 hoặc 50/50 SP). Hiển thị Toast cảnh báo vàng cam, còi báo đầy khay, nút "Xác nhận đã thay khay mới" để reset về 0 và tiếp tục vận hành.
3. **Cảnh Báo Quá Nhiệt Thiết Bị (`temperature_warning`)**:
   - Theo dõi nhiệt độ động cơ truyền động hoặc CPU máy chủ Edge AI. Nếu vượt ngưỡng 75.0°C, hệ thống phát cảnh báo `warning`, đẩy kim đồng hồ Gauge Chart vào vùng đỏ và gửi thông báo.
4. **Mất Kết Nối Vi Điều Khiển (`device_offline`) & Nhịp Tim (Heartbeat)**:
   - Vi điều khiển gửi gói tin heartbeat định kỳ 2 giây (`conveyor/heartbeat`). Nếu sau 6 giây không nhận được gói tin, Watchdog lập tức phát thông báo thiết bị ngoại tuyến và chuyển trạng thái hệ thống sang màu xám.
5. **Mất Kết Nối MQTT Broker (`mqtt_disconnected`)**:
   - Theo dõi kết nối socket/TCP với MQTT Broker. Nếu mất kết nối quá 5 giây (sau bộ lọc debounce), hệ thống kích hoạt cảnh báo `CRITICAL`, đổi trạng thái huy hiệu Header sang `MQTT: DISCONNECTED (Đỏ chớp nháy)` và thực hiện tự động kết nối lại theo chu kỳ 3s -> 5s -> 10s.
6. **Báo Cáo 1 Ngày Làm Việc (Shift Summary)**:
   - Tự động kích hoạt lúc 17:00 hàng ngày hoặc khi nhấn nút "Báo cáo 1 ngày làm việc" trên TopHeader.
   - Tự động đồng bộ số lượng sản phẩm theo các khay chứa, số sản phẩm đạt/lỗi, số lần E-Stop và thời gian vận hành.
   - Hỗ trợ xem trực quan trên Modal, tải file CSV có UTF-8 BOM chuẩn tiếng Việt và in báo cáo định dạng chuẩn.

---

## 9. Hệ Thống Xác Thực & Bảo Mật

1. **Bảo mật mật khẩu**: Mọi mật khẩu người dùng đều được băm bằng thuật toán **Bcrypt (10 salt rounds)**, không lưu trữ mật khẩu thuần.
2. **Quy trình Khôi phục Mật khẩu (Forgot Password)**:
   - Cơ chế tạo mã Mock OTP ngẫu nhiên gồm 6 chữ số.
   - Thời gian sống OTP giới hạn trong **5 phút**.
   - Chống tái sử dụng mã OTP đã dùng.
   - Chặn khôi phục từ bên ngoài đối với các tài khoản Quản trị viên (Admin chỉ đổi mật khẩu khi đã đăng nhập).
3. **Phân quyền vai trò (Role-Based Access Control - RBAC)**:
   - `admin`: Toàn quyền thao tác trên hệ thống.
   - `user`: Giám sát và theo dõi, bị chặn mã lỗi `403 Forbidden` khi cố tình gọi API quản trị.
4. **Bảo vệ Payload Thiết Bị (Zod Passthrough)**:
   - Các Zod Schema xác thực dữ liệu từ thiết bị IoT luôn có thuộc tính `.passthrough()`, giúp ứng dụng không bị crash khi firmware cập nhật thêm trường dữ liệu mở rộng.

---

## 10. Kiểm Thử & Đảm Bảo Chất Lượng (QA)

Dự án sở hữu bộ kiểm thử tự động toàn diện với **108/108 Tests PASS (100%)** qua **15 Test Suites**:

```powershell
npm test
```

### Chi tiết 15 bộ test suites:
- **`tests/history.test.cjs` (9 tests)**: Kiểm tra lưu trữ, phân trang, migrate dữ liệu LocalStorage và cô lập dữ liệu rác.
- **`tests/api_schemas.test.cjs` (3 tests)**: Kiểm tra tính toàn vẹn của SorterConfigSchema, ClassificationRecordSchema và HistoryQuerySchema.
- **`tests/users.test.cjs` (14 tests)**: Kiểm tra bảo mật tài khoản, Admin Seeder, ràng buộc mật khẩu, cơ chế chống leo thang đặc quyền, RBAC, Mock OTP và bảo vệ xóa tài khoản Admin.
- **`tests/estop_safety.test.cjs` (5 tests)**: Kiểm tra dừng khẩn cấp E-Stop, lưu bảng `notifications.json`, phân quyền mở khóa an toàn (Admin only) và cơ chế chống kẹt loop echo 5s.
- **`tests/jam_detection.test.cjs` (6 tests)**: Kiểm tra sự cố kẹt phôi `jam_detected`, cảm biến quang học che khuất > 5s, broadcast SSE và topic MQTT `conveyor/sensor/jam`.
- **`tests/jam_simulation_audio.test.cjs` (5 tests)**: Kiểm tra bộ phát âm thanh còi hú kẹt phôi, âm còi khay đầy và giao diện UI Guard.
- **`tests/bin_full.test.cjs` (7 tests)**: Kiểm tra sự cố đầy khay phân loại, topic MQTT `conveyor/storage/bin_status`, thông báo `warning` và broadcast SSE.
- **`tests/temperature_warning.test.cjs` (8 tests)**: Kiểm tra cảnh báo quá nhiệt động cơ/CPU Edge AI, topic MQTT `conveyor/telemetry/temp` và xử lý nhãn thiết bị.
- **`tests/device_offline.test.cjs` (10 tests)**: Kiểm tra Watchdog phát hiện mất kết nối ESP32 > 6s, heartbeat ping chu kỳ 2s và phục hồi trực tuyến.
- **`tests/shift_summary.test.cjs` (8 tests)**: Kiểm tra tổng kết ca làm việc cuối ngày, xuất file CSV có UTF-8 BOM và phân quyền tải báo cáo.
- **`tests/bin_sliders_sync.test.cjs` (8 tests)**: Kiểm tra thanh trượt điều chỉnh độ rộng / sức chứa định mức (5 - 50 SP) và nạp phôi hiện tại đồng bộ trên toàn hệ thống.
- **`tests/mqtt_disconnected.test.cjs` (12 tests)**: Kiểm tra watchdog mất kết nối MQTT Broker > 5s, auto-reconnect backoff 3s-5s-10s, huy hiệu Header và âm thanh cảnh báo.
- **`tests/temperature_gauge_simulation_vs_real.test.cjs` (4 tests)**: Kiểm tra đồng hồ nhiệt độ chuyển đổi đúng giữa thanh trượt ảo (Mô phỏng) và bảng telemetry cảm biến (Thực tế).
- **`tests/daily_report_sync.test.cjs` (6 tests)**: Kiểm tra nhãn chuẩn hóa "BÁO CÁO 1 NGÀY LÀM VIỆC" và luồng đồng bộ trực tiếp số liệu từ khay chứa và lịch sử phân loại.
- **`tests/simulation_mode_guard.test.cjs` (3 tests)**: Kiểm tra phân định và cô lập triệt để giữa chế độ Mô Phỏng và Thực Tế, chặn các hành vi test giả lập khi chạy máy thật.

Kiểm tra kiểu dữ liệu nghiêm ngặt toàn bộ dự án:
```powershell
npx tsc --noEmit --pretty false
```

Kiểm tra chuẩn mã nguồn qua ESLint:
```powershell
npx eslint src/
```

---

## 11. Biến Môi Trường (Environment Variables)

Xem chi tiết tại [`.env.example`](.env.example):

| Biến môi trường | Mục đích | Ví dụ |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_MQTT_BROKER_URL` | WebSocket URL kết nối MQTT Broker | `wss://broker.emqx.io:8084/mqtt` |
| `NEXT_PUBLIC_DEFAULT_DEVICE_ID` | Mã định danh thiết bị máy phân loại | `sorter_01` |
| `NEXT_PUBLIC_MQTT_TOPIC_TELEMETRY` | Topic nhận telemetry cảm biến | `sorter/01/telemetry` |
| `NEXT_PUBLIC_MQTT_TOPIC_VISION` | Topic nhận kết quả nhận diện camera | `sorter/01/vision` |
| `NEXT_PUBLIC_MQTT_TOPIC_CONTROL` | Topic gửi lệnh điều khiển | `sorter/01/control` |
| `TELEGRAM_BOT_TOKEN` | Token Bot gửi thông báo cảnh báo | `123456789:ABCdefGhI...` |
| `TELEGRAM_CHAT_ID` | ID phòng chat nhận cảnh báo Telegram | `-100123456789` |
| `SMTP_HOST` / `SMTP_PORT` | Máy chủ SMTP gửi email khẩn cấp | `smtp.gmail.com` / `587` |
| `INTERNAL_API_SECRET` | Khóa xác thực nội bộ cho các API quan trọng | `your_secret_key_here` |

---

## 12. Xử Lý Sự Cố Thường Gặp (Troubleshooting)

- **Cổng 3000 bị chiếm dụng**:
  Chạy ứng dụng trên cổng khác: `npm run dev -- -p 3001`.
- **Trang Máy Thật hiển thị MQTT Disconnected**:
  Kiểm tra Broker URL trong tệp `.env` có đúng định dạng WebSocket Secure (`wss://broker.emqx.io:8084/mqtt` hoặc `ws://...:8083/mqtt`) và kiểm tra kết nối mạng cục bộ tới Broker.
- **Lịch sử không hiển thị bản ghi mới**:
  Ở chế độ Mô phỏng, nhấn các nút nạp nhanh sản phẩm hoặc nhấn nút **Tạo dữ liệu demo** tại trang Băng Tải.
- **Đồng hồ nhiệt độ không hiển thị thanh trượt**:
  Thanh trượt nhiệt độ ảo chỉ hiển thị ở chế độ Mô phỏng. Nếu đang ở chế độ Thực tế, hệ thống hiển thị bảng telemetry của cảm biến phần cứng DS18B20 thật.

---

## 👥 Nhóm Tác Giả & Đóng Góp (PBL3 Team)
- **Nguyễn Tá Duy Phong** (Trưởng nhóm)
- **Nguyễn Nhật Minh**
- **Trần Đăng Lợi**
- **Nguyễn Đình Anh Tuấn**

*Khoa Điện - Điện Tử / Công Nghệ Thông Tin — Trường Đại học Bách Khoa, Đại học Đà Nẵng.*
