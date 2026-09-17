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

## 6. Danh Mục Mã Lỗi HTTP Chuẩn

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
