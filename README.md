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
8. [Hệ Thống Xác Thực & Bảo Mật](#8-hệ-thống-xác-thực--bảo-mật)
9. [Kiểm Thử & Đảm Bảo Chất Lượng (QA)](#9-kiểm-thử--đảm-bảo-chất-lượng-qa)
10. [Biến Môi Trường (Environment Variables)](#10-biến-môi-trường-environment-variables)
11. [Xử Lý Sự Cố Thường Gặp (Troubleshooting)](#11-xử-lý-sự-cố-thường-gặp-troubleshooting)

---

## 1. Giới Thiệu Tổng Quan

**SortiX Dashboard** là nền tảng quản trị và vận hành toàn diện cho dây chuyền phân loại sản phẩm tự động. Hệ thống kết nối đồng bộ giữa vi điều khiển IoT (**ESP32-C5**), camera nhận diện thương hiệu/nhãn chai lọ, cụm cảm biến hồng ngoại, cánh gạt servo 3 khay và giao diện Dashboard giám sát 60fps trên nền tảng Web.

### Tính năng nổi bật:
- 🚀 **Trực quan hóa vật lý 60fps (HTML5 Canvas)**: Mô phỏng hành vi di chuyển của phôi chai/lon trên băng tải, qua cảm biến phát hiện và chuyển hướng vào đúng khay theo thời gian thực.
- 🔊 **Âm thanh công nghiệp thuần (Web Audio API)**: Bộ phát âm thanh tổng hợp tín hiệu âm thanh cảnh báo còi hú, gạt servo, nạp phôi và sự cố mà không cần file MP3 ngoài.
- 📡 **Kết nối IoT thời gian thực qua MQTT (WebSocket Secure)**: Thu thập telemetry (vận tốc encoder, nhiệt độ vi điều khiển, trạng thái cảm biến S1-S3) và truyền lệnh điều khiển 2 chiều.
- 👥 **Quản lý người dùng & Phân quyền chặt chẽ (RBAC)**: Đầy đủ các luồng Đăng ký, Đăng nhập, Đổi mật khẩu, Quên mật khẩu OTP, Khóa/Mở tài khoản và chống leo thang đặc quyền.
- 🚨 **Cảnh báo đa kênh tức thời**: Tích hợp tự động gửi Email (SMTP) và tin nhắn khẩn cấp qua Telegram Bot khi kích hoạt Dừng khẩn cấp (E-Stop) hoặc xảy ra kẹt phôi.

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
│   │   ├── config/           # Cấu hình biến môi trường và runtime
│   │   ├── controllers/      # Điều phối nghiệp vụ (user, config, history, stats, alert)
│   │   ├── middlewares/      # Auth JWT/Bearer, Zod validator, Error Handler
│   │   ├── models/           # Quản lý tầng dữ liệu (UserModel, HistoryModel, ConfigModel)
│   │   ├── routes/           # RESTful API endpoints (/api/auth, /api/users, /api/config, ...)
│   │   ├── services/         # Logic nghiệp vụ cốt lõi (Bcrypt hashing, OTP, Email, Telegram)
│   │   └── server.ts         # Điểm khởi động HTTP Express Server (Port 5000)
│   └── package.json
├── frontend/                 # Client UI Next.js 14 App Router
│   ├── public/               # Tài nguyên tĩnh, hình ảnh giao diện
│   ├── src/
│   │   ├── app/              # 9 Trang App Router (overview, conveyor, analytics, history, ...)
│   │   ├── components/       # Components mô-đun hóa (overview/, conveyor/, layout/, ui/)
│   │   ├── contexts/         # React Contexts (AuthContext, Theme, ...)
│   │   ├── hooks/            # Hooks vật lý (useConveyorPhysics), useMQTT, useSorterData
│   │   ├── lib/              # Client utilities, Audio Service, Data Processor, CSV Exporter
│   │   └── services/         # Fetch API clients kết nối Backend RESTful
│   └── package.json
├── shared/                   # Tầng dùng chung giữa FE và BE
│   ├── constants/            # Hằng số toàn hệ thống (Topics MQTT, mã màu khay, role)
│   ├── schemas/              # Zod validation schemas (.passthrough() linh hoạt cho firmware)
│   ├── types/                # TypeScript interfaces chuẩn mực
│   └── package.json
├── data/                     # Dữ liệu cục bộ bền vững (users.json)
├── docs/                     # Tài liệu kỹ thuật chi tiết
│   ├── architecture.md       # Thiết kế kiến trúc phân tầng & data flow
│   ├── api.md                # Đặc tả toàn bộ RESTful API endpoints
│   └── REFACTOR_PLAN.md      # Kế hoạch & lộ trình nâng cấp hệ thống
├── scripts/                  # Scripts hỗ trợ tự động hóa (PowerShell)
│   ├── dev.ps1               # Khởi chạy đồng bộ Frontend & Backend
│   └── test.ps1              # Chạy toàn bộ test suites
├── tests/                    # Bộ kiểm thử hồi quy tự động (Pass 100%)
│   ├── history.test.cjs      # 9 bài test lưu trữ, khôi phục & dọn dẹp lịch sử
│   ├── api_schemas.test.cjs  # 3 bài test xác thực schema Zod & passthrough
│   └── users.test.cjs        # 14 bài test bảo mật tài khoản, Bcrypt, OTP & RBAC
├── .env.example              # Mẫu biến môi trường cho Frontend Next.js
└── package.json              # Root package quản lý Monorepo Workspaces
```

---

## 3. Công Nghệ Sử Dụng

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, TailwindCSS, Lucide React, Recharts.
- **Backend**: Node.js, Express.js, TypeScript, Bcryptjs, Nodemailer, Telegram Bot API.
- **Dữ liệu & Xác thực**: Zod, JSON Store bền vững (`data/users.json`), Sẵn sàng kết nối SQLite / PostgreSQL / MySQL / MongoDB.
- **Truyền thông IoT**: MQTT over WebSocket (MQTT.js), Giao thức kết nối vi điều khiển ESP32-C5 qua Wi-Fi 6.
- **Đồ họa & Âm thanh**: HTML5 Canvas API (Physics Loop 60fps), Web Audio API (Chíp âm công nghiệp tổng hợp).

---

## 4. Tài Khoản Mặc Định & Phân Quyền (RBAC)

Hệ thống được khởi tạo sẵn **4 tài khoản Quản trị viên (Admin)** đại diện cho các thành viên phát triển đề tài PBL3 và tài khoản Người dùng (User):

| Họ và tên | Username / Email | Mật khẩu mặc định | Vai trò | Quyền hạn |
| :--- | :--- | :--- | :--- | :--- |
| **Nguyễn Tá Duy Phong** | `admin1` / `admin1@gmail.com` | `123456` | **Quản trị viên (Admin)** | Toàn quyền cấu hình máy, xóa dữ liệu, dừng khẩn cấp, quản lý thành viên |
| **Nguyễn Nhật Minh** | `admin2` / `admin2@gmail.com` | `123456` | **Quản trị viên (Admin)** | Toàn quyền cấu hình máy, xóa dữ liệu, dừng khẩn cấp, quản lý thành viên |
| **Trần Đăng Lợi** | `admin3` / `admin3@gmail.com` | `123456` | **Quản trị viên (Admin)** | Toàn quyền cấu hình máy, xóa dữ liệu, dừng khẩn cấp, quản lý thành viên |
| **Nguyễn Đình Anh Tuấn** | `admin4` / `admin4@gmail.com` | `123456` | **Quản trị viên (Admin)** | Toàn quyền cấu hình máy, xóa dữ liệu, dừng khẩn cấp, quản lý thành viên |
| **Tài khoản Thử nghiệm** | `duyphong` / `duyphong@gmail.com` | `123456` | **Người vận hành (User)** | Theo dõi dashboard, giám sát băng tải, xem thống kê & lịch sử phân loại |

> 🔒 **Cơ chế bảo vệ nâng cao**:
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

#### Cách 1: Khởi chạy nhanh toàn bộ hệ thống bằng Script PowerShell
```powershell
.\scripts\dev.ps1
```

#### Cách 2: Chạy riêng lẻ từng dịch vụ
- **Chạy giao diện Frontend (Next.js - Port 3000)**:
  ```powershell
  npm run dev
  ```
- **Chạy máy chủ Backend (Express API - Port 5000)**:
  ```powershell
  npm run dev --workspace=backend
  ```

Truy cập hệ thống tại: **[http://localhost:3000](http://localhost:3000)**.

---

## 6. Chế Độ Vận Hành: Mô Phỏng vs. Máy Thật

Người dùng có thể chuyển đổi linh hoạt chế độ vận hành ngay trên thanh tiêu đề (**TopHeader**):

### 6.1. Chế độ Mô Phỏng (Simulation Mode)
- **Mục đích**: Vận hành giả lập kiểm thử trực quan trên máy tính mà không cần cắm phần cứng ESP32 hay camera thật.
- **Hoạt động**:
  - Dữ liệu hoàn toàn độc lập, không gửi bản ghi giả vào hệ thống phần cứng thật.
  - Sử dụng các nút **Nạp nhanh (Coca-Cola, Pepsi, Red Bull, Aquafina)** hoặc **Phôi ngẫu nhiên** để đưa phôi lên băng chuyền.
  - Hỗ trợ nút **Tạo dữ liệu demo** để tạo nhanh 50–100 bản ghi lịch sử phục vụ vẽ đồ thị thống kê.
  - Điều chỉnh tốc độ băng tải từ 10% đến 100% kèm âm thanh động cơ mô phỏng tương ứng.

### 6.2. Chế độ Máy Thật (Live Hardware Mode)
- **Mục đích**: Kết nối trực tiếp với hệ thống phần cứng thực tế qua giao thức MQTT.
- **Hoạt động**:
  - Nhận luồng dữ liệu phân loại từ camera AI (Vision topic: `sorter/01/vision`).
  - Lắng nghe tín hiệu cảm biến hồng ngoại S1, S2, S3 và bộ mã hóa encoder (Telemetry: `sorter/01/telemetry`).
  - Giao diện ẩn toàn bộ các nút nạp giả lập để đảm bảo tính toàn vẹn của dữ liệu sản xuất.
  - Kích hoạt lệnh điều khiển hoặc cấu hình phân loại đẩy ngược lại thiết bị (`sorter/01/control`, `sorter/01/config`).

---

## 7. Các Trang Chức Năng Chính

| Trang | Đường dẫn | Chức năng chính |
| :--- | :--- | :--- |
| **Tổng Quan** | `/` | Hiển thị các thẻ KPI thời gian thực, widget sức khỏe thiết bị ESP32, trạng thái 3 khay chứa và lịch hoạt động. |
| **Băng Tải** | `/conveyor` | Trực quan hóa băng chuyền Canvas 60fps, điều chỉnh tốc độ, dừng khẩn cấp E-Stop, 3 khay xả phôi. |
| **Thống Kê** | `/analytics` | Biểu đồ Recharts phân tích sản lượng theo giờ, tỷ lệ phân loại thành công, phân bố nhãn hàng. |
| **Lịch Sử** | `/history` | Bảng tra cứu dữ liệu phân loại chi tiết, bộ lọc theo ngày/thương hiệu/khay, xuất dữ liệu CSV, xóa dữ liệu. |
| **Cảnh Báo** | `/alerts` | Danh sách sự cố (kẹt phôi, dừng khẩn cấp, quá nhiệt), lọc theo mức độ rủi ro, kiểm tra trạng thái gửi Mail/Telegram. |
| **Cấu Hình** | `/config` | Gán quy tắc phân loại nhãn vào khay 1, 2 hoặc khay lỗi (khay 3), quản lý versioning cấu hình. |
| **Thiết Bị & IoT**| `/devices` | Giám sát kết nối Broker MQTT, độ trễ mạng, IP thiết bị, tín hiệu encoder và các thông số telemetry. |
| **Người Dùng** | `/users` | Quản lý danh sách thành viên (chỉ Admin), tạo tài khoản, phân quyền RBAC, khóa/mở khóa tài khoản. |
| **Đăng Nhập** | `/login` | Đăng nhập tài khoản, đăng ký tài khoản mới, quên mật khẩu và xác thực mã OTP 6 số. |

---

## 8. Hệ Thống Xác Thực & Bảo Mật

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

## 9. Kiểm Thử & Đảm Bảo Chất Lượng (QA)

Dự án sở hữu bộ kiểm thử tự động toàn diện với **26/26 Tests PASS (100%)**:

```powershell
npm test
```

### Chi tiết các bộ test:
- **`tests/history.test.cjs` (9 tests)**: Kiểm tra lưu trữ, phân trang, migrate dữ liệu LocalStorage và cô lập dữ liệu rác.
- **`tests/api_schemas.test.cjs` (3 tests)**: Kiểm tra tính toàn vẹn của SorterConfigSchema, ClassificationRecordSchema và HistoryQuerySchema.
- **`tests/users.test.cjs` (14 tests)**: Kiểm tra bảo mật tài khoản, Admin Seeder, ràng buộc mật khẩu, cơ chế chống leo thang đặc quyền, RBAC, Mock OTP và bảo vệ xóa tài khoản Admin.

Kiểm tra kiểu dữ liệu nghiêm ngặt toàn bộ dự án:
```powershell
npx tsc --noEmit --pretty false
```

---

## 10. Biến Môi Trường (Environment Variables)

Xem chi tiết tại [`.env.example`](.env.example):

| Biến môi trường | Mục đích | Ví dụ |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_MQTT_BROKER_URL` | WebSocket URL kết nối MQTT Broker | `ws://broker.emqx.io:8083/mqtt` |
| `NEXT_PUBLIC_DEFAULT_DEVICE_ID` | Mã định danh thiết bị máy phân loại | `sorter_01` |
| `NEXT_PUBLIC_MQTT_TOPIC_TELEMETRY` | Topic nhận telemetry cảm biến | `sorter/01/telemetry` |
| `NEXT_PUBLIC_MQTT_TOPIC_VISION` | Topic nhận kết quả nhận diện camera | `sorter/01/vision` |
| `NEXT_PUBLIC_MQTT_TOPIC_CONTROL` | Topic gửi lệnh điều khiển | `sorter/01/control` |
| `TELEGRAM_BOT_TOKEN` | Token Bot gửi thông báo cảnh báo | `123456789:ABCdefGhI...` |
| `TELEGRAM_CHAT_ID` | ID phòng chat nhận cảnh báo Telegram | `-100123456789` |
| `SMTP_HOST` / `SMTP_PORT` | Máy chủ SMTP gửi email khẩn cấp | `smtp.gmail.com` / `587` |
| `INTERNAL_API_SECRET` | Khóa xác thực nội bộ cho các API quan trọng | `your_secret_key_here` |

---

## 11. Xử Lý Sự Cố Thường Gặp (Troubleshooting)

- **Cổng 3000 bị chiếm dụng**:
  Chạy ứng dụng trên cổng khác: `npm run dev -- -p 3001`.
- **Trang Máy Thật hiển thị MQTT Disconnected**:
  Kiểm tra Broker URL trong tệp `.env` có đúng định dạng WebSocket (`ws://` hoặc `wss://`) và kiểm tra kết nối mạng cục bộ tới Broker.
- **Lịch sử không hiển thị bản ghi mới**:
  Ở chế độ Mô phỏng, nhấn các nút nạp nhanh sản phẩm hoặc nhấn nút **Tạo dữ liệu demo** tại trang Băng Tải.

---

## 👥 Nhóm Tác Giả & Đóng Góp (PBL3 Team)
- **Nguyễn Tá Duy Phong** (Trưởng nhóm)
- **Nguyễn Nhật Minh**
- **Trần Đăng Lợi**
- **Nguyễn Đình Anh Tuấn**

*Khoa Điện - Điện Tử / Công Nghệ Thông Tin — Trường Đại học Bách Khoa, Đại học Đà Nẵng.*
