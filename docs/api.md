# TÀI LIỆU ĐẶC TẢ RESTFUL API (SORTIX BACKEND API SPECIFICATION)

> **Dự án**: SortiX Dashboard — Hệ thống giám sát và phân loại sản phẩm trên băng tải IoT.  
> **Cổng dịch vụ**: Cung cấp đồng thời qua Next.js App Router (`/api/*` tại Port 3000) và Standalone Express Server (`/api/*` tại Port 5000).  
> **Định dạng dữ liệu**: `application/json`. Tất cả phản hồi tuân thủ cấu trúc chuẩn: `{ success: boolean, message?: string, data?: any }`.

---

## 📌 Mục Lục API Endpoints
1. [Xác Thực & Quản Trị Người Dùng (`/api/auth` & `/api/users`)](#1-xác-thực--quản-trị-người-dùng)
2. [Cấu Hình Phân Loại Băng Tải (`/api/config`)](#2-cấu-hình-phân-loại-băng-tải)
3. [Lịch Sử Phân Loại (`/api/history`)](#3-lịch-sử-phân-loại)
4. [Thống Kê Tổng Hợp (`/api/stats`)](#4-thống-kê-tổng-hợp)
5. [Cảnh Báo Sự Cố Khẩn Cấp (`/api/email-alert` & `/api/telegram-alert`)](#5-cảnh-báo-sự-cố-khẩn-cấp)
6. [An Toàn Hệ Thống, Quản Lý Sự Cố, Báo Cáo Ca & SSE Stream (`/api/safety`, `/api/notifications`, `/api/events`)](#6-an-toàn-hệ-thống-quản-lý-sự-cố--sse-stream)
7. [Danh Mục Mã Lỗi HTTP Chuẩn](#7-danh-mục-mã-lỗi-http-chuẩn)

---

## 1. Xác Thực & Quản Trị Người Dùng

### 1.1. Đăng Ký Tài Khoản Mới
Cho phép người dùng tạo tài khoản mới từ trang đăng ký. Luôn tự động gán vai trò `user` để chống tấn công leo thang đặc quyền.

- **Method**: `POST`
- **Path**: `/api/auth/register`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
```json
{
  "full_name": "Nguyễn Văn A",
  "username": "nguyenvana",
  "email": "vana@gmail.com",
  "password": "Password123@",
  "confirm_password": "Password123@"
}
```
- **Response `201 Created`**:
```json
{
  "success": true,
  "message": "Đăng ký tài khoản thành công",
  "data": {
    "id": "usr-1789661442408-kwp0",
    "username": "nguyenvana",
    "full_name": "Nguyễn Văn A",
    "email": "vana@gmail.com",
    "role": "user",
    "status": "active",
    "created_at": "2026-09-18T01:00:00.000Z"
  }
}
```

---

### 1.2. Đăng Nhập Hệ Thống
Xác thực tài khoản qua username hoặc email, so khớp mật khẩu băm Bcrypt.

- **Method**: `POST`
- **Path**: `/api/auth/login`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
```json
{
  "account": "admin1",
  "password": "password123"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "token": "eyJhbGciOi...",
    "user": {
      "id": "admin-001",
      "username": "admin1",
      "full_name": "Nguyễn Tá Duy Phong",
      "email": "admin1@gmail.com",
      "role": "admin",
      "status": "active"
    }
  }
}
```
- **Response `401 Unauthorized`**: Mật khẩu hoặc tài khoản không chính xác, hoặc tài khoản đang bị khóa (`status: 'locked'`).

---

### 1.3. Yêu Cầu Mã OTP Quên Mật Khẩu
Gửi mã OTP xác nhận đến email người dùng để đặt lại mật khẩu.

- **Method**: `POST`
- **Path**: `/api/auth/forgot-password`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
```json
{
  "email": "vana@gmail.com"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Mã OTP xác thực đã được gửi tới email của bạn (Hiệu lực trong 5 phút)",
  "data": {
    "email": "vana@gmail.com",
    "expires_in_seconds": 300
  }
}
```
> ⚠️ **Bảo mật**: Các tài khoản Quản trị viên (Admin) bị từ chối khôi phục mật khẩu từ bên ngoài màn hình Login để ngăn ngừa tấn công chiếm quyền quản trị.

---

### 1.4. Đặt Lại Mật Khẩu Bằng Mã OTP
Xác thực mã OTP 6 chữ số và thiết lập mật khẩu mới.

- **Method**: `POST`
- **Path**: `/api/auth/reset-password`
- **Request Body**:
```json
{
  "email": "vana@gmail.com",
  "otp": "839201",
  "new_password": "NewPassword123@",
  "confirm_password": "NewPassword123@"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Đặt lại mật khẩu thành công. Vui lòng đăng nhập bằng mật khẩu mới."
}
```

---

### 1.5. Đổi Mật Khẩu Nội Bộ (Sau khi đã đăng nhập)
- **Method**: `POST`
- **Path**: `/api/user/change-password`
- **Headers**: `Content-Type: application/json`, `Authorization: Bearer <TOKEN>`
- **Request Body**:
```json
{
  "current_password": "OldPassword123@",
  "new_password": "NewComplexPassword123@",
  "confirm_password": "NewComplexPassword123@"
}
```
- **Response `200 OK`**: Đổi mật khẩu thành công.
- **Ràng buộc**: Mật khẩu mới không được trùng với mật khẩu hiện tại và phải đáp ứng độ phức tạp (tối thiểu 6 ký tự).

---

### 1.6. Quản Lý Danh Sách Người Dùng (Admin Only)

#### A. Lấy danh sách tài khoản
- **Method**: `GET`
- **Path**: `/api/users`
- **Headers**: `Authorization: Bearer <ADMIN_TOKEN>`
- **Response `200 OK`**: Trả về danh sách đối tượng `SafeUser` (đã loại bỏ trường hash mật khẩu).

#### B. Admin tạo mới tài khoản
- **Method**: `POST`
- **Path**: `/api/users`
- **Headers**: `Authorization: Bearer <ADMIN_TOKEN>`, `Content-Type: application/json`
- **Request Body**:
```json
{
  "full_name": "Kỹ Sư Vận Hành",
  "username": "operator1",
  "email": "op1@gmail.com",
  "password": "Password123@",
  "role": "user",
  "status": "active"
}
```

#### C. Cập nhật thông tin / Khóa tài khoản
- **Method**: `PUT`
- **Path**: `/api/users/:id`
- **Headers**: `Authorization: Bearer <ADMIN_TOKEN>`, `Content-Type: application/json`
- **Request Body**:
```json
{
  "full_name": "Kỹ Sư Vận Hành Cấp Cao",
  "role": "admin",
  "status": "active"
}
```

#### D. Xóa tài khoản
- **Method**: `DELETE`
- **Path**: `/api/users/:id`
- **Headers**: `Authorization: Bearer <ADMIN_TOKEN>`
- **Ràng buộc an toàn**:
  - `400 Bad Request`: Nếu Admin cố tình tự xóa tài khoản của chính mình.
  - `400 Bad Request`: Nếu xóa làm số lượng Admin trong hệ thống giảm xuống dưới 1.

---

## 2. Cấu Hình Phân Loại Băng Tải

### 2.1. Lấy cấu hình phân loại hiện tại
- **Method**: `GET`
- **Path**: `/api/config`
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "schema_version": 1,
    "config_version": 1,
    "device_id": "sorter_01",
    "catalog_version": "catalog_01",
    "bins": [
      { "bin_id": 1, "brand_ids": ["brand_c", "brand_b"] },
      { "bin_id": 2, "brand_ids": ["brand_a"] }
    ],
    "default_bin": 3,
    "apply_mode": "when_line_empty",
    "timestamp": "2026-09-18T00:00:00.000Z"
  }
}
```

### 2.2. Cập nhật cấu hình phân loại
- **Method**: `POST`
- **Path**: `/api/config`
- **Headers**: `Content-Type: application/json`, `Authorization: Bearer <ADMIN_TOKEN>`
- **Request Body**: Đối tượng `SorterConfig` hợp lệ. Tự động tăng `config_version`.
- **Response `200 OK`**: Trả về cấu hình mới đã được lưu và sẵn sàng đồng bộ sang thiết bị qua MQTT.

### 2.3. Khôi phục cấu hình mặc định
- **Method**: `POST`
- **Path**: `/api/config`
- **Request Body**: `{ "action": "reset" }`

---

## 3. Lịch Sử Phân Loại

### 3.1. Truy vấn danh sách lịch sử phân loại
- **Method**: `GET`
- **Path**: `/api/history`
- **Query Parameters**:
  - `limit` (number, default: 50, max: 500)
  - `offset` (number, default: 0)
  - `brand` (string, lọc theo mã `brand_c` hoặc tên `Coca-Cola`)
  - `bin` (number: 1, 2, hoặc 3)
  - `status` (string: `success`, `diverted_default`, `rejected`, `jammed`)
  - `date` (string format: `YYYY-MM-DD`)
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": [
    {
      "id": "rec_01",
      "product_id": "pkg_1001",
      "brand_id": "brand_c",
      "brand_name": "Coca-Cola",
      "confidence": 0.99,
      "target_bin": 1,
      "actual_bin": 1,
      "status": "success",
      "timestamp": "2026-09-18T00:15:30.000Z"
    }
  ],
  "total": 128,
  "limit": 50,
  "offset": 0
}
```

### 3.2. Thêm mới bản ghi phân loại
- **Method**: `POST`
- **Path**: `/api/history`
- **Body**: `ClassificationRecord` (được validate bởi `ClassificationRecordSchema`).
- **Response `201 Created`**: Bản ghi được ghi nhận vào bộ đệm lịch sử an toàn.

### 3.3. Xóa lịch sử phân loại (Admin Only)
- **Method**: `DELETE`
- **Path**: `/api/history`
- **Headers**: `Authorization: Bearer <ADMIN_TOKEN>`
- **Response `200 OK`**: Dọn dẹp sạch toàn bộ lịch sử phân loại trên hệ thống.

---

## 4. Thống Kê Tổng Hợp

### 4.1. Lấy dữ liệu KPI & Tỷ lệ phân loại
- **Method**: `GET`
- **Path**: `/api/stats`
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "totalSorted": 1540,
    "successCount": 1495,
    "successRate": 97.08,
    "divertedCount": 30,
    "rejectedCount": 12,
    "jammedCount": 3,
    "binBreakdown": {
      "bin1": 750,
      "bin2": 520,
      "bin3": 270
    },
    "brandBreakdown": {
      "brand_c": 680,
      "brand_a": 490,
      "brand_b": 230,
      "brand_r": 140
    }
  }
}
```

---

## 5. Cảnh Báo Sự Cố Khẩn Cấp

### 5.1. Gửi Email cảnh báo (SMTP)
- **Method**: `POST`
- **Path**: `/api/email-alert`
- **Headers**: `Content-Type: application/json`, `Authorization: Bearer <SECRET>` (tùy chọn)
- **Request Body**:
```json
{
  "event_id": "evt_estop_001",
  "event_type": "emergency_stop",
  "severity": "critical",
  "device_id": "sorter_01",
  "description": "Nút dừng khẩn cấp E-Stop đã bị nhấn bởi người vận hành!",
  "timestamp": "2026-09-18T00:30:00.000Z"
}
```
- **Response `200 OK`**: Email khẩn cấp đã được gửi tới hòm thư quản trị viên cấu hình trong `ALERT_EMAIL_TO`.

---

### 5.2. Gửi thông báo Telegram Bot
- **Method**: `POST`
- **Path**: `/api/telegram-alert`
- **Headers**: `Content-Type: application/json`, `Authorization: Bearer <SECRET>` (tùy chọn)
- **Request Body**: Tương tự `AlertPayload`.
- **Cơ chế Rate Limiting**: Giới hạn tối đa **1 request cùng loại trong 5 giây** từ một nguồn gọi để tránh spam Telegram API.
- **Response `200 OK`**: Thông báo định dạng Markdown được gửi trực tiếp vào phòng chat kỹ thuật.

---

## 6. An Toàn Hệ Thống, Quản Lý Sự Cố & SSE Stream

### 6.1. Kích Hoạt Dừng Khẩn Cấp (E-Stop)
Kích hoạt trạng thái dừng khẩn cấp trên toàn hệ thống, khóa băng tải, lưu thông báo sự cố và phát tán broadcast.

- **Method**: `POST`
- **Path**: `/api/safety/estop`
- **Headers**: `Content-Type: application/json`
- **Request Body** (`EmergencyStopPayload`):
```json
{
  "event": "emergency_stop",
  "station_id": "STATION_01",
  "triggered_by": "Physical E-Stop Button #1",
  "timestamp": "2026-09-18T03:00:00.000Z",
  "mode": "realtime"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Đã ghi nhận sự cố dừng khẩn cấp và kích hoạt còi báo động",
  "data": {
    "is_locked": true,
    "incident": { ... }
  }
}
```

---

### 6.2. Kích Hoạt Cảnh Báo Kẹt Phôi (Jam Detected)
Kích hoạt cảnh báo tắc nghẽn sản phẩm khi cảm biến quang học che khuất liên tục quá thời gian cho phép (5s).

- **Method**: `POST`
- **Path**: `/api/safety/jam`
- **Headers**: `Content-Type: application/json`
- **Request Body** (`JamDetectedPayload`):
```json
{
  "event": "jam_detected",
  "section": "Conveyor_Belt_Zone_A",
  "duration_seconds": 5,
  "sensor_id": "OPTICAL_JAM_02",
  "mode": "realtime",
  "timestamp": "2026-09-18T03:05:00.000Z"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Đã kích hoạt cảnh báo kẹt phôi thành công",
  "data": {
    "notification_id": "notif_1789676162429",
    "event": "jam_detected"
  }
}
```

### 6.3. Kích Hoạt Cảnh Báo Khay Phân Loại Đầy (Bin Full)
Kích hoạt cảnh báo khi khay phân loại sản phẩm đạt hoặc vượt định mức dung lượng (dải sức chứa tùy chỉnh linh hoạt từ 5 đến 50 SP, mặc định 50 SP/khay).

- **Method**: `POST`
- **Path**: `/api/safety/bin-full` (hoặc `/api/storage/bin-status`)
- **Headers**: `Content-Type: application/json`
- **Request Body** (`BinFullPayload`):
```json
{
  "event": "bin_full",
  "bin_id": "BIN_RED_01",
  "category": "Sản phẩm loại A",
  "current_count": 30,
  "max_capacity": 30,
  "mode": "realtime",
  "timestamp": "2026-09-18T03:10:00.000Z"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Đã ghi nhận sự cố đầy khay phân loại",
  "data": {
    "success": true,
    "notification": {
      "id": "notif_1789676500000",
      "event": "bin_full",
      "severity": "warning",
      "station_id": "BIN_RED_01",
      "description": "[ĐẦY KHAY CHỨA] Khay phân loại sản phẩm Đỏ (#01) đã đạt giới hạn 30/30 cái. Vui lòng thay thế khay rỗng mới",
      "timestamp": "2026-09-18T03:10:00.000Z",
      "status": "unprocessed"
    }
  }
}
```

---

### 6.4. Ghi Nhận Cảnh Báo Quá Nhiệt Thiết Bị (Temperature Warning)
Ghi nhận sự cố nhiệt độ động cơ truyền động hoặc CPU máy chủ Edge AI vượt ngưỡng an toàn (> 75.0°C). Tự động lưu cảnh báo vào `data/notifications.json` và phát thông báo qua SSE.

- **Method**: `POST`
- **Path**: `/api/safety/temp-warning` (hoặc `/api/telemetry/temp`)
- **Headers**: `Content-Type: application/json`
- **Request Body** (`TemperatureWarningPayload`):
```json
{
  "event": "temperature_warning",
  "device_name": "Main_Drive_Motor / Edge_AI_Box",
  "current_temp": 78.5,
  "threshold_temp": 75.0,
  "unit": "°C",
  "mode": "realtime"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Đã ghi nhận cảnh báo quá nhiệt thiết bị",
  "data": {
    "success": true,
    "notification": {
      "id": "notif_1789676600000",
      "event": "temperature_warning",
      "severity": "warning",
      "station_id": "Main_Drive_Motor / Edge_AI_Box",
      "description": "[QUÁ NHIỆT] Động cơ truyền động chính đang ở mức 78.5°C (Ngưỡng an toàn: 75°C). Khuyến nghị kiểm tra quạt tản nhiệt hoặc giảm tải",
      "timestamp": "2026-09-18T03:15:00.000Z",
      "status": "unprocessed"
    }
  }
}
```

---

### 6.5. Ghi Nhận Sự Cố Thiết Bị Vi Điều Khiển Ngoại Tuyến (Device Offline)
Ghi nhận sự cố vi điều khiển ESP32 bị ngắt kết nối (mất nguồn hoặc mất sóng Wi-Fi) khi Watchdog không nhận được nhịp tim ping quá 6 giây. Tự động lưu thông báo mức `error` vào `data/notifications.json` và phát thông báo qua SSE.

- **Method**: `POST`
- **Path**: `/api/safety/device-offline` (hoặc `/api/device/offline`)
- **Headers**: `Content-Type: application/json`
- **Request Body** (`DeviceOfflinePayload`):
```json
{
  "event": "device_offline",
  "device_id": "ESP32_MAIN_CONTROLLER",
  "ip_address": "192.168.1.105",
  "last_seen": "15 giây trước",
  "mode": "realtime"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Đã ghi nhận sự cố mất kết nối vi điều khiển",
  "data": {
    "success": true,
    "notification": {
      "id": "notif_1789676700000",
      "event": "device_offline",
      "severity": "error",
      "station_id": "ESP32_MAIN_CONTROLLER",
      "description": "[MẤT KẾT NỐI THIẾT BỊ] Vi điều khiển trung tâm (ESP32) đã ngoại tuyến! Dữ liệu cảm biến thời gian thực bị ngắt",
      "timestamp": "2026-09-18T03:20:00.000Z",
      "status": "unprocessed"
    }
  }
}
```

---

### 6.6. Nhịp Tim Vi Điều Khiển (Device Heartbeat Ping)
Ghi nhận gói tin nhịp tim (ping) định kỳ mỗi 2 giây từ vi điều khiển qua HTTP hoặc MQTT topic `conveyor/heartbeat`. Reset bộ đếm Watchdog 6 giây và kích hoạt phục hồi trạng thái Online qua SSE.

- **Method**: `POST`
- **Path**: `/api/safety/heartbeat` (hoặc `/api/heartbeat`, `/api/telemetry/heartbeat`)
- **Headers**: `Content-Type: application/json`
- **Request Body** (`HeartbeatPayload`):
```json
{
  "event": "heartbeat",
  "device_id": "ESP32_MAIN_CONTROLLER",
  "uptime": 3600,
  "wifi_rssi": -65,
  "mode": "realtime"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Heartbeat ghi nhận thành công",
  "device_id": "ESP32_MAIN_CONTROLLER",
  "timestamp": "2026-09-18T03:20:02.000Z"
}
```

---

### 6.7. Báo Cáo 1 Ngày Làm Việc (Shift Summary / Daily Work Report)
Kích hoạt tự động lúc 17:00 hàng ngày hoặc khi người dùng bấm nút "Báo cáo 1 ngày làm việc" trên TopHeader. Tự động đồng bộ số liệu thời gian thực từ 3 khay chứa (Khay 1 Coca, Khay 2 Pepsi, Khay 3 Lỗi/Khác), số lần E-Stop và thời gian vận hành. Tự động lưu thông báo mức `info` vào `data/notifications.json` và phát thông báo qua kênh SSE cho các client.

- **Method**: `POST`
- **Path**: `/api/safety/shift-summary` (hoặc `/api/shift/summary`)
- **Headers**: `Content-Type: application/json`
- **Request Body** (`ShiftSummaryPayload`):
```json
{
  "event": "shift_summary",
  "shift_name": "Ca 1 - Buổi sáng",
  "total_products": 1250,
  "sorted_good": 1180,
  "sorted_defect": 70,
  "accuracy_rate": "94.4%",
  "emergency_stops_count": 1,
  "operating_hours": "7.5 giờ",
  "mode": "realtime",
  "timestamp": "2026-09-18T17:00:00Z"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Đã ghi nhận báo cáo 1 ngày làm việc thành công",
  "data": {
    "success": true,
    "notification": {
      "id": "notif_1789677000000",
      "event": "shift_summary",
      "severity": "info",
      "station_id": "SHIFT_SUPERVISOR",
      "description": "[BÁO CÁO 1 NGÀY LÀM VIỆC] Ca 1 - Buổi sáng: 1180/1250 SP đạt (94.4%), 70 lỗi, 1 E-Stops.",
      "timestamp": "2026-09-18T17:00:00.000Z",
      "status": "unprocessed"
    }
  }
}
```

---

### 6.8. Mở Khóa An Toàn Hệ Thống (Safety Unlock)
Mở khóa an toàn sau sự cố dừng khẩn cấp. **Chỉ Quản trị viên (Admin)** mới có quyền gọi API này và bắt buộc phải gửi kèm ghi chú xác nhận an toàn hiện trường.

- **Method**: `POST`
- **Path**: `/api/safety/unlock`
- **Headers**: `Content-Type: application/json`
- **Request Body** (`UnlockSystemInput`):
```json
{
  "userId": "admin-001",
  "role": "admin",
  "note": "Đã kiểm tra hiện trường an toàn, gỡ bỏ vật cản và cho phép vận hành lại"
}
```
- **Response `200 OK`**: Hệ thống đã được mở khóa an toàn.
- **Response `403 Forbidden`**: Tài khoản không có quyền Admin hoặc vi phạm kiểm tra xác thực.

---

### 6.9. Truy Vấn Trạng Thái Khóa An Toàn
Lấy trạng thái hiện tại của hệ thống khóa an toàn.

- **Method**: `GET`
- **Path**: `/api/safety/status`
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "is_locked": false,
    "estop_incident": null,
    "last_unlocked": 1789676500000
  }
}
```

---

### 6.10. Truy Vấn Danh Sách Thông Báo Bền Vững
Lấy danh sách các sự cố khẩn cấp và cảnh báo được lưu trữ bền vững trong `data/notifications.json`.

- **Method**: `GET`
- **Path**: `/api/notifications`
- **Query Params**: `?status=unprocessed|processed&limit=50`
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": [
    {
      "id": "notif_001",
      "type": "jam_detected",
      "message": "[CẢNH BÁO KẸT PHÔI] Phát hiện tắc nghẽn sản phẩm tại Khu vực Băng chuyền A (Cảm biến #02)",
      "severity": "critical",
      "status": "unprocessed",
      "timestamp": "2026-09-18T03:00:00.000Z"
    }
  ]
}
```

---

### 6.11. Cảnh Báo Mất Kết Nối MQTT Broker (`mqtt_disconnected`)
Kích hoạt khi máy chủ hoặc giao diện người dùng mất kết nối socket/TCP với MQTT Broker quá 5 giây.

- **Method**: `POST`
- **Path**: `/api/safety/mqtt-disconnected`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
```json
{
  "event": "mqtt_disconnected",
  "broker_url": "wss://broker.emqx.io:8084/mqtt",
  "disconnected_duration_seconds": 5,
  "reconnect_attempt": 3,
  "mode": "realtime",
  "timestamp": "2026-09-18T18:00:00.000Z"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Đã ghi nhận cảnh báo mất kết nối MQTT Broker",
  "data": {
    "success": true,
    "notification": {
      "id": "notif_mqtt_123",
      "event": "mqtt_disconnected",
      "severity": "critical",
      "description": "[MẤT KẾT NỐI MẠNG] Mất liên lạc với MQTT Broker! Đang thử kết nối lại lần thứ 3 (Reconnecting...)"
    }
  }
}
```

---

### 6.12. Phục Hồi Kết Nối MQTT Broker Thành Công (`mqtt_connected`)
Kích hoạt khi client tự động kết nối lại (auto-reconnect) thành công sau các chu kỳ 3s, 5s, 10s.

- **Method**: `POST`
- **Path**: `/api/safety/mqtt-connected`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
```json
{
  "broker_url": "wss://broker.emqx.io:8084/mqtt"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "[ĐÃ PHỤC HỒI] Kết nối MQTT Broker thành công"
}
```

---

### 6.13. Luồng Sự Kiện Thời Gian Thực Server-Sent Events (SSE)
Kết nối luồng stream một chiều từ server tới các client để cập nhật sự kiện tức thời mà không cần polling liên tục.

- **Method**: `GET`
- **Path**: `/api/events`
- **Headers**: `Accept: text/event-stream`
- **Event Types**:
  - `safety_estop`: Gửi payload sự cố dừng khẩn cấp.
  - `jam_detected`: Gửi payload cảnh báo kẹt phôi.
  - `bin_full`: Gửi payload cảnh báo khay phân loại sản phẩm đã đầy (50/50 cái).
  - `temperature_warning`: Gửi payload cảnh báo quá nhiệt động cơ / CPU Edge AI (> 75°C).
  - `device_offline`: Gửi payload cảnh báo vi điều khiển ESP32 mất kết nối ngoại tuyến.
  - `device_online`: Gửi tín hiệu vi điều khiển đã phục hồi kết nối trực tuyến.
  - `shift_summary`: Gửi payload báo cáo tổng kết ca làm việc cuối ngày (17:00 / bấm nút).
  - `mqtt_disconnected`: Gửi payload cảnh báo mất kết nối MQTT Broker quá 5 giây (CRITICAL).
  - `mqtt_connected`: Gửi thông báo phục hồi kết nối MQTT Broker thành công (INFO).
  - `safety_unlock`: Gửi tín hiệu mở khóa an toàn thành công.

---


## 7. Danh Mục Mã Lỗi HTTP Chuẩn

| Mã trạng thái | Ý nghĩa | Mô tả |
| :--- | :--- | :--- |
| `200 OK` | Thành công | Yêu cầu đã được thực hiện và trả về dữ liệu thành công. |
| `201 Created` | Đã khởi tạo | Tài nguyên mới đã được tạo thành công (tài khoản, bản ghi). |
| `400 Bad Request` | Yêu cầu không hợp lệ | Dữ liệu đầu vào sai định dạng hoặc vi phạm ràng buộc Zod Schema. |
| `401 Unauthorized` | Không có quyền xác thực | Thiếu token, token sai hoặc tài khoản/mật khẩu không đúng. |
| `403 Forbidden` | Bị từ chối truy cập | Người dùng không đủ quyền hạn (ví dụ: tài khoản User cố gọi API của Admin). |
| `404 Not Found` | Không tìm thấy | Tài nguyên hoặc endpoint yêu cầu không tồn tại. |
| `429 Too Many Requests`| Quá số lượng yêu cầu | Kích hoạt bộ hạn chế tần suất (Rate Limiter) khi gửi cảnh báo liên tục. |
| `500 Internal Error` | Lỗi máy chủ nội bộ | Lỗi không mong muốn phát sinh trong quá trình xử lý logic nghiệp vụ. |
