# KIẾN TRÚC HỆ THỐNG SORTIX DASHBOARD (SYSTEM ARCHITECTURE)

> **Tài liệu Kỹ Thuật Đồ Án PBL3**: Hệ thống điều khiển, giám sát và phân loại sản phẩm trên băng chuyền tự động thông minh tích hợp IoT & Vision AI.

---

## 1. Tổng Quan Kiến Trúc (High-Level Architecture)

Hệ thống **SortiX Dashboard** được thiết kế theo mô hình kiến trúc phân tầng chuyên biệt (**Layered Architecture**) và quản lý mã nguồn dưới dạng **Monorepo**. Kiến trúc phân định rạch ròi 4 khối chính:

1. **Frontend (Giao diện Client)**: Ứng dụng Next.js 14 App Router, chịu trách nhiệm trực quan hóa đồ họa 60fps, âm thanh công nghiệp và giao tiếp người dùng.
2. **Backend (Máy chủ Dịch vụ API)**: Máy chủ Express/Node.js độc lập xử lý xác thực, phân quyền, cảnh báo đa kênh và lưu trữ dữ liệu an toàn.
3. **Shared Layer (Tầng Dùng Chung)**: Định nghĩa kiểu dữ liệu (Types), Zod Schemas và hằng số hệ thống dùng chung cho cả FE và BE.
4. **IoT & Vision Gateway**: Cầu nối truyền thông hai chiều thời gian thực giữa vi điều khiển ESP32-C5, cụm cảm biến/cánh gạt và MQTT Broker.

```
                  ┌────────────────────────────────────────────────────────┐
                  │                 FRONTEND (Client / UI)                 │
                  │  Next.js 14 App Router • TailwindCSS • Recharts       │
                  │  Web Audio Industrial Sound Synthesizer                │
                  │  HTML5 Canvas 60fps Physics Simulation Loop            │
                  │  Auth Context, Profile & User Management UI            │
                  └───────────┬────────────────────────────────┬───────────┘
                              │ Fetch REST API                 │ WSS (Browser)
                              │ (via Service Client)           │
                              ▼                                ▼
┌─────────────────────────────────────────────┐   ┌────────────────────────┐
│            BACKEND (Server Layer)           │   │    MQTT BROKER / IoT   │
│  - Routes: /api/auth, /api/users, ...       │   │  (EMQX / Mosquitto)    │
│  - Controllers & Business Services          │   │  Topics:               │
│  - Models (UserModel, HistoryModel, ...)    │   │  - sorter/01/status    │
│  - Security: Bcrypt, OTP, RBAC Middleware   │   │  - sorter/01/telemetry │
│  - Multi-DB Migrations (SQL / NoSQL)        │   │  - sorter/01/vision    │
│  - Email (SMTP) & Telegram Bot Integration  │   │  - sorter/01/control   │
│  - In-Memory Rate Limiting & Safe Bounding  │   │  - sorter/01/alerts    │
└──────────────────────┬──────────────────────┘   └───────────▲────────────┘
                       │                                      │ Wi-Fi 6
                       ▼                          ┌───────────┴────────────┐
┌─────────────────────────────────────────────┐   │     ESP32-C5 Hardware  │
│          PERSISTENCE & DATA STORE           │   │ (Sensors S1-S3, Servo) │
│  - data/users.json (Active File Store)      │   └────────────────────────┘
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
  - `User`, `SafeUser`, `AuthCredentials`: Kiểu dữ liệu xác thực và người dùng.
- **`schemas/index.ts`**:
  - Toàn bộ validation schemas viết bằng **Zod**.
  - **Quy tắc `.passthrough()`**: Tất cả schema tương tác với phần cứng đều bật passthrough để tránh đứt gãy kết nối khi firmware ESP32-C5 gửi kèm các cờ chẩn đoán bổ sung.
- **`constants/index.ts`**:
  - Danh sách MQTT Topics, mã màu khay (Xanh lá, Xanh dương, Cam), danh mục thương hiệu và vai trò người dùng (Admin, User).

### 2.2. Backend Layer (`backend/`)
Được thiết kế theo mô hình MVC thu gọn (Model - Controller - Service - Route):
- **Controllers (`backend/src/controllers/`)**:
  - `userController.ts`: Đăng ký, đăng nhập, đổi mật khẩu, quên mật khẩu OTP, quản lý danh sách người dùng.
  - `configController.ts`: Tiếp nhận và xuất bản cấu hình phân loại.
  - `historyController.ts`: Lọc, phân trang và dọn dẹp lịch sử phân loại.
  - `statsController.ts`: Tổng hợp số liệu KPI và tỷ lệ phân loại thành công.
  - `alertController.ts`: Xử lý gửi email cảnh báo và thông báo Telegram Bot.
- **Services (`backend/src/services/`)**:
  - `userService.ts`: Logic nghiệp vụ băm mật khẩu Bcrypt, cấp phát mã Mock OTP 6 chữ số (thời hạn 5 phút), kiểm tra phân quyền RBAC và ràng buộc an toàn (chặn tự xóa Admin).
  - `alertNotificationService.ts`: Tích hợp Nodemailer (SMTP) và Telegram Bot API với cơ chế Rate Limiting chống spam.
  - `historyService.ts` & `configService.ts`: Quản lý nghiệp vụ lịch sử và cấu hình.
- **Models (`backend/src/models/`)**:
  - `userModel.ts`: Thao tác dữ liệu người dùng bền vững trên file `data/users.json`, tích hợp sẵn Admin Seeder khởi tạo 4 tài khoản Ban Quản trị.
  - `historyModel.ts` & `configModel.ts`: Quản lý bộ nhớ đệm an toàn (Bounded Buffer tối đa 1000 bản ghi), loại trừ nguy cơ tràn RAM.
- **Middlewares (`backend/src/middlewares/`)**:
  - `authMiddleware.ts`: Kiểm tra Bearer Token, kiểm tra quyền hạn `requireAdmin`.
  - `validateMiddleware.ts`: Kiểm định đầu vào JSON qua Zod Schema trước khi chạm tới Controller.
  - `errorMiddleware.ts`: Bắt và định dạng lỗi ngoại lệ đồng nhất (`{ success: false, message: ... }`).
- **Database Migrations (`backend/database/`)**:
  - Cung cấp sẵn các tệp DDL tạo bảng và cấu trúc schema chuẩn hóa cho: SQLite (`001_create_users_table_sqlite.sql`), PostgreSQL (`...postgres.sql`), MySQL (`...mysql.sql`) và MongoDB (`...mongodb.js`).

### 2.3. Frontend Layer (`frontend/`)
Xây dựng trên nền tảng Next.js 14 App Router với hiệu năng tối ưu:
- **Trực quan hóa vật lý 60fps (`useConveyorPhysics.ts`)**:
  - Vòng lặp `requestAnimationFrame` tính toán tọa độ di chuyển của vật thể trên băng chuyền.
  - Phát hiện va chạm (Collision Detection) khi vật thể đi qua cụm cảm biến quang học S1, S2, S3 và kích hoạt cánh gạt phân loại vào Khay 1, Khay 2 hoặc Khay 3.
- **Bộ tổng hợp âm thanh (`audioService.ts` / `useThemeAudio.ts`)**:
  - Ứng dụng Web Audio API thuần của trình duyệt để sinh sóng âm công nghiệp (Sine/Square Oscillator).
  - Tạo tiếng còi báo động khẩn cấp, tiếng servo chuyển động và tiếng động cơ băng tải biến thiên theo tốc độ cài đặt.
- **Kết nối IoT Kép (`useMQTT.ts` & `useSorterData.ts`)**:
  - Quản lý trạng thái kết nối MQTT qua WebSocket.
  - Tự động chuyển đổi giữa chế độ **Mô phỏng (Simulation)** và **Máy thật (Live Hardware)**.

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
            ├──> Cập nhật tọa độ & kích hoạt cánh gạt trên Canvas 60fps
            ├──> Phát âm thanh servo / cảm biến qua Web Audio API
            └──> Ghi nhận vào Lịch sử phân loại (Frontend/Backend History)
```

### 3.2. Luồng Xác Thực & Quản Trị Người Dùng (Auth & RBAC Flow)
```
[Client Request: Login / Create User / Delete User]
            │
            ▼
    [Next.js / Express Route]
            │
            ▼
    [Auth Middleware] (Kiểm tra Bearer Token & Role: Admin / User)
            │
            ▼
    [Validate Middleware] (Xác thực đầu vào qua Zod Schema)
            │
            ▼
    [User Service] (Bcrypt hash/compare, Ràng buộc nghiệp vụ, Chặn xóa Admin)
            │
            ▼
    [User Model] (Ghi nhận bền vững vào data/users.json hoặc RDBMS)
```

### 3.3. Luồng Cảnh Báo Khẩn Cấp (Emergency Alert Flow)
```
[Sự cố: Nút Dừng Khẩn Cấp E-Stop hoặc Kẹt Phôi]
            │
            ▼
     [Alert Payload] ──> [Rate Limiter] (Giới hạn tối đa 1 thông báo/5s)
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
 [Nodemailer Service (SMTP)]            [Telegram Bot API]
            │                                     │
            ▼                                     ▼
 [Email Hộp thư Quản trị]            [Group Chat Ban Vận Hành]
```

---

## 4. Cơ Chế Độ Tin Cậy & An Toàn Hệ Thống

1. **Bộ Đệm Lịch Sử Giới Hạn (Bounded Store Pattern)**:
   - Bộ nhớ máy chủ giới hạn lưu trữ tối đa 1000 bản ghi phân loại và 100 sự kiện cảnh báo.
   - Khi vượt ngưỡng, các bản ghi cũ nhất tự động được dịch chuyển (FIFO eviction) để bảo vệ bộ nhớ RAM.
2. **Ngăn Ngừa Tấn Công Leo Thang Đặc Quyền (Privilege Escalation Prevention)**:
   - Endpoint đăng ký tự do (`/api/auth/register`) luôn gán cứng quyền `role: 'user'` bất kể dữ liệu gửi lên.
   - Chỉ duy nhất Admin đã đăng nhập mới có quyền thay đổi role hoặc tạo tài khoản Admin mới qua `/api/users`.
3. **Bảo Vệ Tính Toàn Vẹn Của Ban Quản Trị**:
   - Hệ thống từ chối mọi yêu cầu xóa tài khoản Admin nếu số lượng Admin còn lại $\le 1$.
   - Admin không được phép tự xóa tài khoản của chính mình khi phiên làm việc đang kích hoạt.
4. **Cô Lập Môi Trường Mô Phỏng**:
   - Trong chế độ Mô phỏng, toàn bộ tín hiệu nạp phôi đều bị cô lập trong bộ nhớ Canvas, tuyệt đối không publish payload giả lên topic điều khiển thật của thiết bị.
