# SortiX Dashboard — Hệ Thống Giám Sát & Phân Loại Sản Phẩm Thông Minh (IoT Sorter)

> **Đồ án PBL3 / Capstone Project**: Hệ thống điều khiển, giám sát và phân loại sản phẩm theo thời gian thực trên băng chuyền công nghiệp tích hợp vi điều khiển IoT (ESP32-C5), thị giác máy tính (Vision AI), bảng điều khiển quản trị phân tầng và ứng dụng di động đa nền tảng (Android APK & iOS PWA) từ một cơ sở mã nguồn duy nhất (1-Codebase Hybrid Architecture).

---

## 📌 Mục Lục
1. [Giới Thiệu Tổng Quan](#1-giới-thiệu-tổng-quan)
2. [Kiến Trúc Hệ Thống (Monorepo & 1-Codebase Architecture)](#2-kiến-trúc-hệ-thống-monorepo--1-codebase-architecture)
3. [Công Nghệ Sử Dụng](#3-công-nghệ-sử-dụng)
4. [Tài Khoản Mặc Định & Phân Quyền (RBAC)](#4-tài-khoản-mặc-định--phân-quyền-rbac)
5. [Cài Đặt & Khởi Chạy Nhanh](#5-cài-đặt--khởi-chạy-nhanh)
6. [Đóng Gói Ứng Dụng Di Động (Mobile App: Android APK & iOS PWA)](#6-đóng-gói-ứng-dụng-di-động-mobile-app-android-apk--ios-pwa)
7. [Chế Độ Vận Hành: Mô Phỏng vs. Máy Thật](#7-chế-độ-vận-hành-mô-phỏng-vs-máy-thật)
8. [Các Trang Chức Năng Chính](#8-các-trang-chức-năng-chính)
9. [Hệ Thống An Toàn, Giám Sát & Cảnh Báo](#9-hệ-thống-an-toàn-giám-sát--cảnh-báo)
10. [Hệ Thống Xác Thực & Bảo Mật](#10-hệ-thống-xác-thực--bảo-mật)
11. [Kiểm Thử & Đảm Bảo Chất Lượng (QA)](#11-kiểm-thử--đảm-bảo-chất-lượng-qa)
12. [Biến Môi Trường (Environment Variables)](#12-biến-môi-trường-environment-variables)
13. [Xử Lý Sự Cố Thường Gặp (Troubleshooting)](#13-xử-lý-sự-cố-thường-gặp-troubleshooting)
14. [Nhóm Tác Giả & Đóng Góp](#14-nhóm-tác-giả--đóng-góp)

---

## 1. Giới Thiệu Tổng Quan

**SortiX Dashboard** là nền tảng quản trị và vận hành toàn diện cho dây chuyền phân loại sản phẩm tự động. Hệ thống kết nối đồng bộ giữa vi điều khiển IoT (**ESP32-C5**), camera nhận diện thương hiệu/nhãn chai lọ, cụm cảm biến hồng ngoại & quang học, cơ cấu phân loại piston khí nén 3 khay và giao diện Dashboard giám sát 60fps trên cả Máy tính Web, Điện thoại Android (Native APK) và iPhone (PWA Standalone).

### 🌟 Tính năng nổi bật:
- 🚀 **Trực quan hóa vật lý 60fps (HTML5 Canvas)**: Mô phỏng hành vi di chuyển của phôi chai/lon trên băng tải, qua cảm biến phát hiện và kích hoạt piston đẩy vào đúng khay theo thời gian thực.
- 📱 **Hỗ Trợ Di Động Đa Nền Tảng (1-Codebase Hybrid Mobile App)**:
  - **Android**: Đóng gói thành file `.apk` cài đặt trực tiếp thông qua **Capacitor 8**, tích hợp splash screen, cấu hình `usesCleartextTraffic` và webview hiệu năng cao.
  - **iOS (iPhone/iPad)**: Chế độ PWA Standalone toàn màn hình (qua Safari "Thêm vào MH chính"), tối ưu viewport chuẩn `viewportFit: "cover"`, chống zoom ngoài ý muốn (`maximumScale: 1, userScalable: false`).
  - **Tối ưu trải nghiệm cảm ứng di động**: Thanh điều hướng dạng ngăn kéo (Drawer Sidebar), nút chuyển đổi chế độ Mô phỏng/Thực tế dạng viên nang (Pill Button) ngay trên TopHeader và thanh menu Sidebar.
- 🎚️ **Độ Rộng & Sức Chứa Khay Tùy Chỉnh (Dynamic Bin Capacities 5 - 50 SP)**: Mỗi khay cho phép tùy chỉnh định mức chứa từ 5 đến 50 sản phẩm qua thanh trượt mượt mà; tự động đồng bộ tức thời giữa thanh trượt máng trượt Canvas, Widget giám sát, trang Cấu hình và LocalStorage.
- 🌡️ **Đồng Hồ Đo Nhiệt Độ Bán Nguyệt (Dual-Mode Temperature Gauge)**: 
  - *Chế độ Mô phỏng*: Cung cấp thanh trượt ảo (30°C - 95°C) và các nút đặt nhanh (42.5°C, 72.0°C, 78.5°C) để thử nghiệm phản ứng quá nhiệt.
  - *Chế độ Thực tế*: Tự động ẩn thanh trượt giả lập, hiển thị bảng telemetry phần cứng (cảm biến DS18B20 / ESP32) với nhãn `[PHẦN CỨNG THẬT]` và kim đo nhảy theo telemetry thực.
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
- 🔒 **Cô lập Chế độ Vận hành**: Toàn bộ nút giả lập thử nghiệm chỉ xuất hiện ở chế độ Mô phỏng, hoàn toàn bị ẩn và chặn ở chế độ Thực tế để bảo vệ dữ liệu phần cứng.

---

## 2. Kiến Trúc Hệ Thống (Monorepo & 1-Codebase Architecture)

Mã nguồn được tổ chức theo chuẩn **Monorepo (npm workspaces)** với mô hình **1-Codebase**: toàn bộ Web máy tính, Cloud Vercel, ứng dụng di động Android APK và iOS PWA đều chia sẻ 100% logic và giao diện:

```
SortiX-Dashboard/
├── backend/                  # Standalone Backend Server (Node.js/Express + TypeScript)
│   ├── database/             # File migrations (SQLite, PostgreSQL, MySQL, MongoDB) & Seeds
│   │   ├── migrations/       # SQL scripts tạo bảng Users & Schema
│   │   └── seeds/            # Khởi tạo 4 tài khoản Quản trị viên ban đầu
│   ├── scripts/              # Build helper scripts (patch-dist-aliases.cjs)
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
├── frontend/                 # Client UI Next.js 14 App Router & Mobile Shell
│   ├── android/              # Native Android Studio Project (Capacitor Bridge)
│   │   ├── app/
│   │   │   ├── build/outputs/apk/debug/app-debug.apk # File APK cài đặt (SortiX-Dashboard.apk)
│   │   │   └── src/main/AndroidManifest.xml          # Cấu hình quyền & Cleartext Traffic
│   │   └── build.gradle
│   ├── capacitor.config.ts   # Cấu hình Capacitor (App ID, App Name, Server URL, Cleartext)
│   ├── out/                  # Offline Shell (index.html dự phòng khi mất mạng)
│   ├── public/               # Tài nguyên tĩnh, biểu tượng app, manifest
│   ├── src/
│   │   ├── app/              # 9 Trang App Router & 18 API routes nội bộ (/api/safety, /api/events, ...)
│   │   │   ├── layout.tsx    # Cấu hình Viewport chống zoom, theme-color, HTML layout
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
│   │   │   ├── layout/       # DashboardLayout, TopHeader (Mobile Pill), Sidebar (Drawer Switcher), Banners
│   │   │   ├── overview/     # KpiStatGrid, LiveHealthAndBinWidget, CalendarWidget, RecentActivityList
│   │   │   ├── ui/           # TemperatureGaugeWidget, ShiftSummaryModal, Modals & Toasts
│   │   │   ├── ConfigAndDiagnostics.tsx # Chẩn đoán & cấu hình thiết bị
│   │   │   └── ConveyorVisualizer.tsx    # Khối trực quan băng chuyền 60fps
│   │   ├── contexts/         # React Contexts (AuthContext, Theme, DashboardContext)
│   │   ├── hooks/            # useConveyorPhysics, useMQTT, useSorterData
│   │   ├── lib/              # Client utilities, Audio Service, Data Processor, CSV Exporter
│   │   └── services/         # API Clients (apiSafetyClient, apiConfigClient, apiHistoryClient, sseService)
│   ├── package.json
│   └── tsconfig.json
├── shared/                   # Tầng dùng chung giữa Frontend và Backend
│   ├── constants/            # Hằng số toàn hệ thống (Topics MQTT, mã màu khay, role, default configs)
│   ├── schemas/              # Zod validation schemas (.passthrough() linh hoạt cho firmware)
│   ├── types/                # TypeScript interfaces chuẩn mực
│   └── package.json
├── data/                     # Dữ liệu cục bộ bền vững (users.json, notifications.json)
├── docs/                     # Tài liệu kỹ thuật chi tiết
│   ├── architecture.md       # Thiết kế kiến trúc phân tầng, Mobile Shell & An toàn
│   ├── api.md                # Đặc tả toàn bộ 18 RESTful API endpoints & SSE
│   └── REFACTOR_PLAN.md      # Kế hoạch & lộ trình nâng cấp hệ thống
├── scripts/                  # Root orchestration scripts (dev-all.cjs)
├── tests/                    # Bộ kiểm thử tự động toàn diện (108/108 Tests PASS 100% - 15 Suites)
├── FINAL_INTEGRATION_REPORT.md # Báo cáo tổng kết tích hợp hệ thống cuối cùng
├── CHANGELOG.md              # Nhật ký thay đổi hệ thống chi tiết qua các phiên bản
├── AGENTS.md                 # Quy chuẩn kỹ thuật, Mobile Rules & Bảo mật bắt buộc
├── .env.example              # Mẫu biến môi trường cho Frontend Next.js
└── package.json              # Root package quản lý Monorepo Workspaces & Scripts di động
```

---

## 3. Công Nghệ Sử Dụng

- **Frontend Web & Mobile**: Next.js 14 (App Router), React 18, TypeScript, TailwindCSS, Lucide React, Recharts.
- **Mobile Container**: **Capacitor 8** (`@capacitor/core`, `@capacitor/android`, `@capacitor/cli`), Android SDK 34+, Android Studio Ladybug/Koala.
- **Backend API Server**: Node.js, Express.js, TypeScript, Bcryptjs, Nodemailer, Telegram Bot API.
- **Dữ liệu & Xác thực**: Zod, JSON Store bền vững (`data/users.json`, `data/notifications.json`), Sẵn sàng kết nối SQLite / PostgreSQL / MySQL / MongoDB.
- **Truyền thông IoT**: MQTT over WebSocket (MQTT.js), Giao thức kết nối vi điều khiển ESP32-C5 qua Wi-Fi 6, Server-Sent Events (SSE).
- **Đồ họa & Âm thanh**: HTML5 Canvas API (Physics Loop 60fps), Web Audio API (Bộ tổng hợp âm công nghiệp không phụ thuộc tài nguyên ngoài).

---

## 4. Tài Khoản Mặc Định & Phân Quyền (RBAC)

Hệ thống được khởi tạo sẵn **4 tài khoản Quản trị viên (Admin)** đại diện cho các thành viên phát triển đề tài PBL3 và tài khoản Người dùng (User):

| Họ và tên | Username / Email | Mật khẩu mặc định | Vai trò | Quyền hạn |
| :--- | :--- | :--- | :--- | :--- |
| **Nguyễn Tá Duy Phong** | `admin1` / `admin1@gmail.com` | `123456` | **Quản trị viên (Admin)** | Toàn quyền cấu hình máy, xóa dữ liệu, dừng khẩn cấp, mở khóa an toàn, chuyển đổi Mô phỏng/Thực tế, quản lý thành viên |
| **Nguyễn Nhật Minh** | `admin2` / `admin2@gmail.com` | `123456` | **Quản trị viên (Admin)** | Toàn quyền cấu hình máy, xóa dữ liệu, dừng khẩn cấp, mở khóa an toàn, chuyển đổi Mô phỏng/Thực tế, quản lý thành viên |
| **Trần Đăng Lợi** | `admin3` / `admin3@gmail.com` | `123456` | **Quản trị viên (Admin)** | Toàn quyền cấu hình máy, xóa dữ liệu, dừng khẩn cấp, mở khóa an toàn, chuyển đổi Mô phỏng/Thực tế, quản lý thành viên |
| **Nguyễn Đình Anh Tuấn** | `admin4` / `admin4@gmail.com` | `123456` | **Quản trị viên (Admin)** | Toàn quyền cấu hình máy, xóa dữ liệu, dừng khẩn cấp, mở khóa an toàn, chuyển đổi Mô phỏng/Thực tế, quản lý thành viên |
| **Tài khoản Vận hành** | `duyphong` / `duyphong@gmail.com` | `123456` | **Người vận hành (User)** | Giám sát dashboard, xem băng tải, xem thống kê & lịch sử (chỉ vận hành ở chế độ Thực tế, bị khóa nút Mô phỏng) |

> [!IMPORTANT]
> **Cơ chế bảo vệ an toàn cao cấp:**
> - Mọi tài khoản mới tạo qua trang Đăng ký tự do đều **bị ép cứng `role: 'user'`** để ngăn chặn leo thang đặc quyền.
> - Quản trị viên **không thể tự xóa tài khoản của chính mình** khi đang đăng nhập.
> - Hệ thống **bắt buộc luôn duy trì tối thiểu 1 Quản trị viên** (chặn thao tác xóa nếu chỉ còn duy nhất 1 Admin).
> - **Chế độ Mô phỏng chỉ dành cho Admin**: Người dùng vai trò `user` chỉ có duy nhất chế độ Thực tế nhằm bảo đảm an toàn cho dây chuyền sản xuất.

---

## 5. Cài Đặt & Khởi Chạy Nhanh

### 5.1. Yêu cầu hệ thống
- **Node.js**: Phiên bản `18.17.0` trở lên (Khuyến nghị Node.js 20 LTS).
- **Trình duyệt**: Chrome, Microsoft Edge, Brave, Safari hiện đại.
- **Để build Android App (Tùy chọn)**: Android Studio Ladybug hoặc Koala, JDK 17 / 21, Android SDK Platform 34+.

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

| Lệnh thực thi | Mô tả | Cổng dịch vụ |
| :--- | :--- | :--- |
| `npm run dev:all` | **Khởi chạy đồng thời cả Frontend & Backend** | Frontend: `3000`, Backend: `5000` |
| `npm run dev` hoặc `npm run dev:frontend` | Khởi chạy riêng giao diện người dùng Next.js | `http://localhost:3000` |
| `npm run dev:backend` | Khởi chạy riêng máy chủ Express API | `http://localhost:5000` |
| `npm run cap:sync` | Đồng bộ mã nguồn Frontend vào Android Studio | — |
| `npm run cap:open` | Mở dự án Android trong Android Studio để build APK | — |
| `npm run build` | Biên dịch toàn bộ dự án cho môi trường sản xuất | — |
| `npm test` | Chạy bộ kiểm thử tự động toàn diện (108 tests PASS 100%) | — |

Truy cập Dashboard trên máy tính tại: **[http://localhost:3000](http://localhost:3000)**.

---

## 6. Đóng Gói Ứng Dụng Di Động (Mobile App: Android APK & iOS PWA)

Dự án áp dụng mô hình **Hybrid WebView Bridge** qua Capacitor 8. Cách tiếp cận này giữ nguyên 100% kiến trúc Next.js App Router (18 dynamic Route Handlers và SSE `/api/events` không bị hỏng như khi dùng lệnh `output: 'export'`).

### 6.1. Cấu trúc Android App
File cấu hình Capacitor đặt tại [frontend/capacitor.config.ts](frontend/capacitor.config.ts):
```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pbl3.dashboard',
  appName: 'SortiX Dashboard',
  webDir: 'out',
  server: {
    // Địa chỉ server Next.js:
    // - Máy ảo Android Studio Emulator: http://10.0.2.2:3000
    // - Điện thoại thật chung mạng Wi-Fi: http://192.168.1.4:3000 (thay theo IP máy tính của bạn)
    // - Khi đã deploy Cloud: https://sortix-dashboard.vercel.app
    url: 'http://10.0.2.2:3000',
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
```

### 6.2. Quy trình Xuất File APK Cài Đặt (Android)
1. Biên dịch Frontend và đồng bộ vào Android project:
   ```powershell
   npm run build
   npm run cap:sync
   ```
2. Mở dự án bằng Android Studio:
   ```powershell
   npm run cap:open
   ```
3. Trong Android Studio:
   - Vào menu: **Build** > **Generate App Bundles or APKs** > **Generate APKs**.
   - Chọn **debug** (hoặc release) và nhấn **Create**.
4. File `.apk` tạo ra sẵn sàng cài đặt tại:
   `frontend/android/app/build/outputs/apk/debug/app-debug.apk` (khoảng 4.1 MB).
   > Nhóm đã sao chép sẵn file này thành `SortiX-Dashboard.apk` để thuận tiện phân phối.

### 6.3. Cài đặt trên iPhone / iPad (iOS PWA Không Cần Mac)
Do hệ điều hành iOS không hỗ trợ file `.apk`, người dùng iPhone trải nghiệm giao diện nguyên bản chuẩn Native thông qua PWA:
1. Đảm bảo iPhone và máy tính cùng kết nối chung một mạng Wi-Fi (hoặc truy cập URL Vercel).
2. Mở trình duyệt **Safari** trên iPhone, nhập: `http://192.168.1.4:3000` (hoặc domain Vercel).
3. Bấm vào nút **Chia sẻ** (biểu tượng hình vuông có mũi tên hướng lên ở thanh dưới Safari).
4. Cuộn xuống chọn **"Thêm vào MH chính"** (Add to Home Screen) > bấm **Thêm**.
5. Biểu tượng ứng dụng **SortiX** sẽ xuất hiện trên màn hình chính của iPhone. Khi mở ra, ứng dụng sẽ chạy toàn màn hình (Standalone Mode), ẩn hoàn toàn thanh địa chỉ Safari, cho trải nghiệm không khác gì ứng dụng Native từ App Store.

---

## 7. Chế Độ Vận Hành: Mô Phỏng vs. Máy Thật

Hệ thống cho phép Quản trị viên (Admin) chuyển đổi linh hoạt chế độ vận hành:

### 📱 Trên Giao Diện Điện Thoại (Mobile App & Màn hình hẹp):
- **Cách 1 (Nút bấm nhanh trên TopHeader)**: Ngay cạnh tiêu đề trang, có sẵn một nút bấm hình viên nang:
  - Khi ở chế độ Mô phỏng: Hiện nút tím `[🧪 Mô phỏng]`. Bấm vào sẽ chuyển ngay sang Thực tế.
  - Khi ở chế độ Thực tế: Hiện nút xanh ngọc `[📡 Thực tế]`. Bấm vào sẽ chuyển về Mô phỏng.
- **Cách 2 (Menu Sidebar Drawer)**: Bấm vào biểu tượng **3 dấu gạch ngang (Hamburger Menu)** ở góc trên cùng bên trái để mở ngăn kéo điều hướng. Ngay trên đầu menu là khối **"CHẾ ĐỘ VẬN HÀNH"** gồm 2 nút bấm to bản `[🧪 Mô phỏng]` và `[📡 Thực tế]`.

### 💻 Trên Giao Diện Máy Tính (Desktop Web):
- Switch chuyển đổi kép hiển thị trực tiếp ở giữa thanh TopHeader.

### 7.1. Chế độ Mô Phỏng (Simulation Mode)
- **Mục đích**: Vận hành giả lập kiểm thử trực quan trên máy tính và điện thoại mà không cần cắm phần cứng ESP32 hay camera thật.
- **Hoạt động**:
  - Dữ liệu độc lập, không làm nhiễu dữ liệu phần cứng thật.
  - Nạp phôi nhanh (**Coca-Cola, Pepsi, Red Bull, Aquafina**) hoặc **Phôi ngẫu nhiên**.
  - Thanh trượt nhiệt độ ảo (30°C - 95°C) và nút preset kiểm thử quá nhiệt.
  - Thanh trượt điều chỉnh sức chứa từng khay (5 - 50 SP) và nạp phôi thử nghiệm kịch bản đầy khay.
  - Nút thử nghiệm ngắt kết nối MQTT client, test E-Stop, test kẹt phôi.
  - Nút **Tạo dữ liệu demo** sinh nhanh 50–100 bản ghi lịch sử phục vụ vẽ đồ thị thống kê.

### 7.2. Chế độ Máy Thật (Live Hardware Mode)
- **Mục đích**: Kết nối trực tiếp với hệ thống phần cứng thực tế qua giao thức MQTT.
- **Hoạt động**:
  - Nhận luồng phân loại trực tiếp từ camera AI (Vision topic: `sorter/01/vision`).
  - Nhận dữ liệu cảm biến hồng ngoại S1, S2, S3 và bộ mã hóa encoder (Telemetry: `sorter/01/telemetry`).
  - Ẩn toàn bộ thanh trượt giả lập, nút nạp ảo và nút test sự cố.
  - Hiển thị bảng telemetry cảm biến phần cứng thật (ESP32 DS18B20) với cờ `[PHẦN CỨNG THẬT]`.
  - Xuất lệnh điều khiển hoặc cấu hình phân loại xuống vi điều khiển (`sorter/01/control`, `sorter/01/config`).

---

## 8. Các Trang Chức Năng Chính

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

## 9. Hệ Thống An Toàn, Giám Sát & Cảnh Báo

1. **Dừng Khẩn Cấp (E-Stop)**:
   - Kích hoạt qua nút bấm vật lý (IO10) hoặc nút bấm trên Web/Mobile Dashboard.
   - Ngắt ngay lập tức động cơ băng tải (`isRunning = false`), còi hú liên tục, banner đỏ cảnh báo.
   - Chỉ Admin có quyền mở khóa kèm xác thực mật khẩu/lý do hiện trường; cơ chế ân hạn 5 giây chống lặp echo.
2. **Phân Định Kẹt Phôi (`jam_detected`) vs Đầy Khay (`bin_full`)**:
   - **Kẹt phôi**: Cảm biến quang học che khuất liên tục > 5 giây tại Cảm biến #02 / Zone A. Còi hú ngắt quãng, banner kẹt phôi, dừng băng tải và đổi màu phôi kẹt sang đỏ.
   - **Đầy khay**: Số lượng sản phẩm đạt định mức của khay (`current_count >= max_capacity`). Toast cảnh báo vàng cam, còi báo đầy khay, nút "Xác nhận đã thay khay mới" để reset về 0 và tiếp tục vận hành.
3. **Cảnh Báo Quá Nhiệt Thiết Bị (`temperature_warning`)**:
   - Theo dõi nhiệt độ động cơ truyền động hoặc CPU Edge AI. Vượt 75.0°C phát cảnh báo `warning`, đẩy kim Gauge Chart vào vùng đỏ.
4. **Mất Kết Nối Vi Điều Khiển (`device_offline`) & Nhịp Tim (Heartbeat)**:
   - Vi điều khiển gửi gói tin heartbeat định kỳ 2 giây (`conveyor/heartbeat`). Sau 6 giây không nhận được, Watchdog phát cảnh báo ngoại tuyến.
5. **Mất Kết Nối MQTT Broker (`mqtt_disconnected`)**:
   - Mất kết nối quá 5 giây (sau debounce), hệ thống đổi huy hiệu sang `MQTT: DISCONNECTED (Đỏ chớp nháy)` và tự động kết nối lại theo chu kỳ 3s -> 5s -> 10s.
6. **Báo Cáo 1 Ngày Làm Việc (Shift Summary)**:
   - Kích hoạt lúc 17:00 hàng ngày hoặc khi bấm nút "Báo cáo ngày" trên TopHeader.
   - Tự động đồng bộ số lượng sản phẩm, tỷ lệ chính xác, số lần E-Stop và thời gian vận hành; hỗ trợ xuất CSV UTF-8 BOM và in báo cáo.

---

## 10. Hệ Thống Xác Thực & Bảo Mật

1. **Bảo mật mật khẩu**: Mọi mật khẩu người dùng đều được băm bằng thuật toán **Bcrypt (10 salt rounds)**.
2. **Quy trình Khôi phục Mật khẩu (Forgot Password)**:
   - Mã Mock OTP ngẫu nhiên 6 chữ số, thời gian sống **5 phút**.
   - Chống tái sử dụng mã OTP đã dùng.
   - Chặn khôi phục từ bên ngoài đối với các tài khoản Quản trị viên.
3. **Phân quyền vai trò (RBAC)**:
   - `admin`: Toàn quyền thao tác trên hệ thống.
   - `user`: Giám sát và theo dõi, bị chặn mã lỗi `403 Forbidden` khi gọi API quản trị.
4. **Bảo vệ Payload Thiết Bị (Zod Passthrough)**:
   - Tất cả schema thiết bị luôn có thuộc tính `.passthrough()`, ngăn chặn crash khi firmware ESP32 cập nhật thêm trường dữ liệu.

---

## 11. Kiểm Thử & Đảm Bảo Chất Lượng (QA)

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

Kiểm tra kiểu dữ liệu TypeScript:
```powershell
npx tsc --noEmit --pretty false
```

---

## 12. Biến Môi Trường (Environment Variables)

Xem chi tiết tại [`.env.example`](.env.example):

| Biến môi trường | Mục đích | Ví dụ |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_MQTT_BROKER_URL` | WebSocket URL kết nối MQTT Broker | `wss://broker.emqx.io:8084/mqtt` |
| `NEXT_PUBLIC_DEFAULT_DEVICE_ID` | Mã định danh thiết bị máy phân loại | `sorter_01` |
| `NEXT_PUBLIC_MQTT_TOPIC_TELEMETRY` | Topic nhận telemetry cảm biến | `sorter/01/telemetry` |
| `NEXT_PUBLIC_MQTT_TOPIC_VISION` | Topic nhận kết quả nhận diện camera | `sorter/01/vision` |
| `NEXT_PUBLIC_MQTT_TOPIC_CONTROL` | Topic gửi lệnh điều khiển | `sorter/01/control` |
| `NEXT_PUBLIC_API_URL` / `NEXT_PUBLIC_BACKEND_URL` | Địa chỉ Backend API | `http://localhost:5000` |
| `TELEGRAM_BOT_TOKEN` | Token Bot gửi thông báo cảnh báo | `123456789:ABCdefGhI...` |
| `TELEGRAM_CHAT_ID` | ID phòng chat nhận cảnh báo Telegram | `-100123456789` |
| `SMTP_HOST` / `SMTP_PORT` | Máy chủ SMTP gửi email khẩn cấp | `smtp.gmail.com` / `587` |
| `INTERNAL_API_SECRET` | Khóa xác thực nội bộ cho các API quan trọng | `your_secret_key_here` |

---

## 13. Xử Lý Sự Cố Thường Gặp (Troubleshooting)

- **Không thấy nút Chế độ Mô phỏng trên Điện thoại**:
  - *Nguyên nhân 1*: Bạn đang đăng nhập bằng tài khoản Người vận hành (`role: 'user'`). Theo quy chuẩn an toàn, tài khoản `user` bị khóa cứng ở chế độ Thực tế. Hãy đăng nhập bằng tài khoản Quản trị viên (`admin1` / `123456`) để có quyền chuyển sang Mô phỏng.
  - *Nguyên nhân 2*: Trình duyệt chưa tải phiên bản mới nhất. Hãy vuốt xuống để tải lại trang (Pull to refresh). Nút viên nang `[🧪 Mô phỏng]` sẽ hiện ngay cạnh tiêu đề trang, hoặc bấm vào nút Menu 3 gạch để thấy mục chuyển đổi to rõ trong ngăn kéo Sidebar.
- **Máy ảo Android Emulator báo lỗi kết nối / trang trắng**:
  - Máy ảo Android không dùng `localhost` được (vì `localhost` trỏ vào chính máy ảo). Phải cấu hình trỏ tới IP máy chủ host: `http://10.0.2.2:3000`.
- **Điện thoại thật kết nối đến máy tính báo lỗi mạng**:
  - Đảm bảo điện thoại và máy tính kết nối **chung 1 mạng Wi-Fi**.
  - Mở PowerShell gõ `ipconfig` để lấy địa chỉ IPv4 (ví dụ `192.168.1.4`), sau đó điền `http://192.168.1.4:3000` vào `capacitor.config.ts` hoặc trình duyệt điện thoại.
  - Mở cổng tường lửa Windows Firewall cho Node.js / Port 3000.
- **Android Studio hỏi nâng cấp Android Gradle Plugin (AGP)**:
  - Khi thấy thông báo Upgrade Assistant (yêu cầu nâng AGP lên 9.x), **KHÔNG** bấm "Run selected steps". Capacitor 8 hoạt động ổn định nhất trên AGP 8.x. Bấm "Dismiss" hoặc "Remind me later".
- **Cổng 3000 hoặc 5000 bị chiếm dụng**:
  - Giải phóng cổng bằng PowerShell:
    ```powershell
    Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force
    ```

---

## 14. Nhóm Tác Giả & Đóng Góp

- **Nguyễn Tá Duy Phong** (Trưởng nhóm)
- **Nguyễn Nhật Minh**
- **Trần Đăng Lợi**
- **Nguyễn Đình Anh Tuấn**

*Khoa Điện - Điện Tử / Công Nghệ Thông Tin — Trường Đại học Bách Khoa, Đại học Đà Nẵng.*
