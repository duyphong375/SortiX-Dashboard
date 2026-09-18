# TÀI LIỆU ĐẶC TẢ RESTFUL API & SSE (SORTIX API SPECIFICATION)

> **Dự án**: SortiX Dashboard — Hệ thống giám sát và phân loại sản phẩm trên băng chuyền IoT.  
> **Kiến trúc phục vụ**: Cung cấp đồng thời qua Next.js App Router (`/api/*` tại Port 3000) và Standalone Express Server (`/api/*` tại Port 5000).  
> **Định dạng dữ liệu**: `application/json; charset=utf-8`. Tất cả phản hồi tuân thủ cấu trúc envelope chuẩn:
> ```json
> {
>   "success": boolean,
>   "message"?: string,
>   "data"?: any,
>   "error"?: any
> }
> ```

---

## 📌 Mục Lục
1. [Xác Thực & Quản Trị Người Dùng (`/api/auth` & `/api/users`)](#1-xác-thực--quản-trị-người-dùng)
2. [Cấu Hình Quy Tắc Phân Loại Băng Tải (`/api/config`)](#2-cấu-hình-quy-tắc-phân-loại-băng-tải)
3. [Lịch Sử Phân Loại Sản Phẩm (`/api/history`)](#3-lịch-sử-phân-loại-sản-phẩm)
4. [Thống Kê Tổng Hợp Sản Lượng & KPI (`/api/stats`)](#4-thống-kê-tổng-hợp-sản-lượng--kpi)
5. [Hệ Thống Thông Báo & Cảnh Báo Khẩn Cấp (`/api/notifications`, `/api/email-alert`, `/api/telegram-alert`)](#5-hệ-thống-thông-báo--cảnh-báo-khẩn-cấp)
6. [An Toàn Công Nghiệp & Quản Lý Sự Cố (`/api/safety/*`)](#6-an-toàn-công-nghiệp--quản-lý-sự-cố)
7. [Luồng Dữ Liệu Thời Gian Thực Server-Sent Events (`/api/events`)](#7-luồng-dữ-liệu-thời-gian-thực-server-sent-events)
8. [Danh Mục Mã Trạng Thái HTTP & Xử Lý Ngoại Lệ](#8-danh-mục-mã-trạng-thái-http--xử-lý-ngoại-lệ)

---

## 1. Xác Thực & Quản Trị Người Dùng

### 1.1. Đăng Ký Tài Khoản Mới
Cho phép người dùng tạo tài khoản mới. Luôn tự động gán vai trò `user` nhằm ngăn chặn leo thang đặc quyền.

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
Xác thực tài khoản qua username hoặc email, so khớp mật khẩu băm Bcrypt (10 salt rounds).

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
    "token": "usr-admin-001-sig.eyJhbGciOi...",
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

### 1.3. Đăng Xuất Hệ Thống
Hủy session cookie và thu hồi token xác thực phiên làm việc.

- **Method**: `POST`
- **Path**: `/api/auth/logout`
- **Headers**: `Authorization: Bearer <TOKEN>` (hoặc cookie session)
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Đăng xuất thành công"
}
```

---

### 1.4. Lấy Thông Tin Phiên & Token Hiện Tại
Truy xuất thông tin người dùng đang đăng nhập dựa trên token hoặc cookie session.

- **Method**: `GET`
- **Path**: `/api/auth/token`
- **Headers**: `Authorization: Bearer <TOKEN>`
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "authenticated": true,
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

---

### 1.5. Nhịp Tim Phiên Người Dùng (Session Heartbeat)
Duy trì trạng thái trực tuyến (`is_online`) và cập nhật thời gian hoạt động gần nhất của người dùng.

- **Method**: `GET` / `POST`
- **Path**: `/api/auth/heartbeat`
- **Headers**: `Authorization: Bearer <TOKEN>`
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "alive": true,
    "timestamp": "2026-09-18T18:57:31.966Z"
  }
}
```

---

### 1.6. Yêu Cầu Mã OTP Quên Mật Khẩu
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
> [!WARNING]
> **Bảo mật:** Các tài khoản Quản trị viên (`role: 'admin'`) bị từ chối khôi phục mật khẩu từ bên ngoài màn hình Login để ngăn ngừa tấn công chiếm quyền.

---

### 1.7. Đặt Lại Mật Khẩu Bằng Mã OTP
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

### 1.8. Đổi Mật Khẩu Nội Bộ (Sau khi đã đăng nhập)
- **Method**: `POST`
- **Path**: `/api/user/change-password`
- **Headers**: `Content-Type: application/json`, `Authorization: Bearer <TOKEN>`
- **Request Body**:
```json
{
  "current_password": "OldPassword123@",
  "new_password": "NewPassword123@",
  "confirm_password": "NewPassword123@"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Đổi mật khẩu thành công"
}
```

---

### 1.9. Quản Lý Danh Sách Người Dùng (Admin Only)
- **`GET /api/users`**: Lấy danh sách tài khoản (`200 OK`).
- **`POST /api/users`**: Tạo tài khoản người dùng hoặc quản trị viên mới (`201 Created`).
- **`PUT /api/users/:id`**: Cập nhật thông tin, thay đổi vai trò hoặc khóa/mở tài khoản (`200 OK`).
- **`DELETE /api/users/:id`**: Xóa tài khoản người dùng (`200 OK`).
  - *Ràng buộc 1*: Admin không thể tự xóa chính mình khi đang đăng nhập (`400 Bad Request`).
  - *Ràng buộc 2*: Không thể xóa Admin nếu hệ thống chỉ còn 1 Quản trị viên (`400 Bad Request`).

---

## 2. Cấu Hình Quy Tắc Phân Loại Băng Tải

### 2.1. Lấy Cấu Hình Hiện Tại
- **Method**: `GET`
- **Path**: `/api/config`
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "version": 3,
    "updated_at": "2026-09-18T10:00:00.000Z",
    "updated_by": "admin1",
    "rules": {
      "brand_c": 1,
      "brand_p": 2,
      "brand_r": 1,
      "brand_a": 2
    },
    "default_bin": 3,
    "bin_capacities": {
      "bin_1": 50,
      "bin_2": 50,
      "bin_3": 50
    },
    "conveyor_speed": 1.2
  }
}
```

### 2.2. Cập Nhật Cấu Hình & Dung Lượng Khay (Admin Only)
- **Method**: `POST`
- **Path**: `/api/config`
- **Headers**: `Content-Type: application/json`, `Authorization: Bearer <TOKEN>`
- **Request Body**:
```json
{
  "rules": {
    "brand_c": 1,
    "brand_p": 2,
    "brand_r": 1,
    "brand_a": 2
  },
  "default_bin": 3,
  "bin_capacities": {
    "bin_1": 30,
    "bin_2": 40,
    "bin_3": 50
  },
  "conveyor_speed": 1.5
}
```
- **Response `200 OK`**: Trả về cấu hình mới với `version` tăng tự động và xuất bản qua MQTT topic `sorter/01/config`.

---

## 3. Lịch Sử Phân Loại Sản Phẩm

### 3.1. Truy Vấn Danh Sách Lịch Sử
- **Method**: `GET`
- **Path**: `/api/history`
- **Query Parameters**:
  - `page`: Số trang (mặc định: `1`).
  - `limit`: Số bản ghi mỗi trang (mặc định: `20`, tối đa: `100`).
  - `brand`: Lọc theo nhãn (`brand_c`, `brand_p`, `brand_r`, `brand_a`).
  - `bin`: Lọc theo khay (`1`, `2`, `3`).
  - `status`: Lọc theo kết quả (`success`, `misplaced`, `rejected`).
  - `date_from`, `date_to`: Khoảng thời gian ISO-8601.
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "rec-1789735712",
        "product_id": "SP-0042",
        "brand": "brand_c",
        "target_bin": 1,
        "actual_bin": 1,
        "status": "success",
        "confidence": 0.96,
        "timestamp": "2026-09-18T12:48:32.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total_items": 1250,
      "total_pages": 63
    }
  }
}
```

### 3.2. Thêm Bản Ghi Phân Loại
- **Method**: `POST`
- **Path**: `/api/history`
- **Request Body**: Chi tiết bản ghi tuân thủ `ClassificationRecordSchema`.
- **Response `201 Created`**.

### 3.3. Xóa / Dọn Dẹp Lịch Sử (Admin Only)
- **Method**: `DELETE`
- **Path**: `/api/history`
- **Headers**: `Authorization: Bearer <TOKEN>`
- **Response `200 OK`**: Xóa toàn bộ lịch sử trong bộ nhớ và trả về xác nhận.

---

## 4. Thống Kê Tổng Hợp Sản Lượng & KPI

- **Method**: `GET`
- **Path**: `/api/stats`
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "total_sorted": 1250,
    "success_count": 1180,
    "error_count": 70,
    "accuracy_rate": 94.4,
    "bin_counts": {
      "bin_1": 45,
      "bin_2": 38,
      "bin_3": 17
    },
    "brand_breakdown": {
      "brand_c": 450,
      "brand_p": 400,
      "brand_r": 250,
      "brand_a": 150
    },
    "hourly_distribution": [
      { "hour": "08:00", "count": 120 },
      { "hour": "09:00", "count": 145 }
    ]
  }
}
```

---

## 5. Hệ Thống Thông Báo & Cảnh Báo Khẩn Cấp

### 5.1. Danh Sách Sự Cố & Cảnh Báo
- **Method**: `GET`
- **Path**: `/api/notifications`
- **Query Parameters**: `status` (`unprocessed`, `resolved`), `severity` (`info`, `warning`, `critical`).
- **Response `200 OK`**: Danh sách thông báo lưu trong `data/notifications.json`.

### 5.2. Đánh Dấu Sự Cố Đã Xử Lý
- **Method**: `PUT`
- **Path**: `/api/notifications/:id/resolve`
- **Headers**: `Authorization: Bearer <TOKEN>`
- **Response `200 OK`**: Cập nhật trạng thái `resolved`, gắn `resolved_at` và `resolved_by`.

### 5.3. Gửi Email Cảnh Báo (SMTP)
- **Method**: `POST`
- **Path**: `/api/email-alert`
- **Request Body**:
```json
{
  "event": "emergency_stop",
  "title": "[NGUY HIỂM] Dừng Khẩn Cấp Băng Tải",
  "description": "Nút dừng khẩn cấp tại trạm 01 được kích hoạt",
  "is_simulation": false
}
```
- **Response `200 OK`**: Đã chuyển tiếp email thành công.

### 5.4. Gửi Tin Nhắn Telegram Bot
- **Method**: `POST`
- **Path**: `/api/telegram-alert`
- **Request Body**: Tương tự email alert, tự động chèn cờ `🧪 Chế độ Giả Lập` hoặc `🔴 Phần cứng Thực Tế`.
- **Response `200 OK`**.

---

## 6. An Toàn Công Nghiệp & Quản Lý Sự Cố

### 6.1. Dừng Khẩn Cấp (E-Stop)
- **Method**: `POST`
- **Path**: `/api/safety/estop`
- **Request Body**:
```json
{
  "station_id": "STATION_01",
  "triggered_by": "Physical E-Stop Button #1",
  "is_simulation": false
}
```
- **Response `200 OK`**: Hệ thống khóa an toàn (`is_locked: true`), lưu sự cố vào `notifications.json`, phát còi hú và broadcast SSE `emergency_stop`.

### 6.2. Mở Khóa An Toàn (Admin Only)
- **Method**: `POST`
- **Path**: `/api/safety/unlock`
- **Headers**: `Authorization: Bearer <TOKEN>`
- **Request Body**:
```json
{
  "admin_id": "admin-001",
  "reason": "Đã kiểm tra hiện trường an toàn và dọn sạch vật cản"
}
```
- **Response `200 OK`**: Mở khóa an toàn (`is_locked: false`), kích hoạt thời gian ân hạn 5 giây chống lặp echo tín hiệu.

### 6.3. Trạng Thái An Toàn Hiện Tại
- **Method**: `GET`
- **Path**: `/api/safety/status`
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "is_locked": false,
    "locked_at": null,
    "last_incident": null
  }
}
```

### 6.4. Cảnh Báo Kẹt Phôi (Jam Incident)
- **Method**: `POST`
- **Path**: `/api/safety/jam`
- **Request Body**:
```json
{
  "event": "jam_detected",
  "station_id": "Conveyor_Belt_Zone_A",
  "sensor_id": "OPTICAL_JAM_02",
  "duration_seconds": 5.2,
  "is_simulation": false
}
```

### 6.5. Cảnh Báo Đầy Khay (Bin Full)
- **Method**: `POST`
- **Path**: `/api/safety/bin-full`
- **Request Body**:
```json
{
  "event": "bin_full",
  "station_id": "BIN_RED_01",
  "bin_id": "bin_1",
  "current_count": 50,
  "max_capacity": 50
}
```

### 6.6. Cảnh Báo Quá Nhiệt (Temperature Warning)
- **Method**: `POST`
- **Path**: `/api/safety/temperature`
- **Request Body**:
```json
{
  "event": "temperature_warning",
  "station_id": "Main_Drive_Motor",
  "temperature": 79.5,
  "threshold": 75.0
}
```

### 6.7. Mất Kết Nối Thiết Bị & Nhịp Tim (Device Offline & Heartbeat)
- **`POST /api/safety/device-offline`**: Kích hoạt cảnh báo vi điều khiển ngoại tuyến (`device_offline`).
- **`POST /api/safety/heartbeat`**: Nhận gói tin ping chu kỳ 2s (`conveyor/heartbeat`), cập nhật watchdog.

### 6.8. Báo Cáo 1 Ngày Làm Việc (Shift Summary)
- **Method**: `POST`
- **Path**: `/api/safety/shift-summary`
- **Request Body**:
```json
{
  "event": "shift_summary",
  "station_id": "SHIFT_SUPERVISOR",
  "total_sorted": 1250,
  "success_count": 1180,
  "error_count": 70,
  "accuracy_rate": 94.4,
  "estop_count": 1,
  "shift_name": "Ca 1 - Buổi sáng",
  "is_simulation": false
}
```

### 6.9. Trạng Thái Kết Nối MQTT
- **Method**: `POST`
- **Path**: `/api/safety/mqtt-status`
- **Request Body**:
```json
{
  "status": "disconnected",
  "broker_url": "wss://broker.emqx.io:8084/mqtt",
  "duration": 5.1,
  "attempt": 1
}
```

---

## 7. Luồng Dữ Liệu Thời Gian Thực Server-Sent Events

### Endpoint Kênh SSE:
- **Path**: `/api/events`
- **Method**: `GET`
- **Headers**:
  ```http
  Accept: text/event-stream
  Cache-Control: no-cache
  Connection: keep-alive
  ```

### Các sự kiện phát sóng (Event Names):
| Tên sự kiện | Mô tả | Dữ liệu kèm theo |
| :--- | :--- | :--- |
| `emergency_stop` | Kích hoạt dừng khẩn cấp | Chi tiết sự cố trạm, thời gian, người kích hoạt |
| `safety_unlocked` | Quản trị viên mở khóa hệ thống | Admin ID, ghi chú hiện trường |
| `jam_detected` | Kẹt phôi tại cảm biến quang | Vị trí Zone A, cảm biến, thời gian kẹt |
| `bin_full` | Khay phân loại đạt sức chứa định mức | Mã khay, số lượng đạt ngưỡng |
| `temperature_warning` | Nhiệt độ động cơ / CPU vượt ngưỡng | Tên thiết bị, nhiệt độ đo, ngưỡng |
| `device_offline` | Vi điều khiển ESP32 mất kết nối | Station ID, thời gian mất gói tin cuối |
| `device_online` | Vi điều khiển ESP32 kết nối lại | Station ID, IP, thời gian phục hồi |
| `mqtt_disconnected` | Mất kết nối MQTT Broker > 5s | URL Broker, số lần thử kết nối |
| `mqtt_connected` | Phục hồi kết nối MQTT Broker | URL Broker, thời gian phục hồi |
| `shift_summary` | Tổng kết báo cáo ca 1 ngày làm việc | Thống kê sản lượng, tỷ lệ đạt/lỗi |
| `notification` | Cảnh báo hệ thống chung | Nội dung thông báo mới thêm vào kho lưu trữ |

---

## 8. Danh Mục Mã Trạng Thái HTTP & Xử Lý Ngoại Lệ

| Mã HTTP | Trạng thái | Ý nghĩa trong hệ thống SortiX |
| :--- | :--- | :--- |
| **`200 OK`** | Thành công | Yêu cầu truy vấn hoặc cập nhật xử lý hoàn tất |
| **`201 Created`** | Đã tạo mới | Tạo tài khoản, bản ghi lịch sử hoặc cấu hình mới thành công |
| **`400 Bad Request`** | Dữ liệu không hợp lệ | Payload Zod sai định dạng, tự xóa tài khoản chính mình, xóa Admin cuối cùng |
| **`401 Unauthorized`** | Chưa xác thực | Thiếu token Bearer, token sai chữ ký hoặc đã hết hạn |
| **`403 Forbidden`** | Không có quyền | Người dùng vai trò `user` cố tình gọi API chỉ dành cho `admin` |
| **`404 Not Found`** | Không tìm thấy | Không tìm thấy ID tài khoản, cấu hình hoặc thông báo sự cố |
| **`429 Too Many Requests`** | Vượt giới hạn tần suất | Rate limit email/telegram hoặc thử mật khẩu sai quá nhiều lần |
| **`500 Internal Server Error`** | Lỗi máy chủ | Lỗi đọc ghi file, lỗi phân giải hạ tầng ngoài dự kiến |
