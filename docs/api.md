# TÀI LIỆU ĐẶC TẢ RESTFUL API (SORTIX BACKEND)

Hệ thống cung cấp các endpoint RESTful để truy vấn và điều khiển bộ phân loại. Các endpoint có thể chạy qua Next.js App Router (`/api/*`) hoặc trực tiếp qua Standalone Backend Server (Port 5000).

---

## 1. Cấu Hình Phân Loại (`/api/config`)

### 1.1. Lấy cấu hình hiện tại
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
    "timestamp": "2026-09-17T12:00:00.000Z"
  }
}
```

### 1.2. Cập nhật cấu hình
- **Method**: `POST`
- **Path**: `/api/config`
- **Headers**: `Content-Type: application/json`
- **Body**: Đối tượng `SorterConfig` (tự động tăng `config_version`).
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Config updated to v2",
  "data": { ... }
}
```

### 1.3. Reset cấu hình về mặc định
- **Method**: `POST`
- **Path**: `/api/config`
- **Body**: `{ "action": "reset" }`

---

## 2. Lịch Sử Phân Loại (`/api/history`)

### 2.1. Truy vấn danh sách lịch sử
- **Method**: `GET`
- **Path**: `/api/history`
- **Query Parameters**:
  - `limit` (number, default: 50, max: 500)
  - `offset` (number, default: 0)
  - `brand` (string, lọc theo brand_id hoặc brand_name)
  - `bin` (number: 1, 2, hoặc 3)
  - `status` (string: `success`, `diverted_default`, `rejected`, `jammed`)
  - `date` (string format `YYYY-MM-DD`)
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
      "timestamp": "2026-09-17T12:00:00.000Z"
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}
```

### 2.2. Thêm bản ghi phân loại mới
- **Method**: `POST`
- **Path**: `/api/history`
- **Headers**: `Content-Type: application/json`
- **Body**: `ClassificationRecord`
- **Response `201 Created`**:
```json
{
  "success": true,
  "message": "Record added",
  "data": { ... }
}
```

### 2.3. Xóa toàn bộ lịch sử
- **Method**: `DELETE`
- **Path**: `/api/history`
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Classification history cleared"
}
```

---

## 3. Thống Kê Tổng Hợp (`/api/stats`)

### 3.1. Lấy số liệu thống kê hệ thống
- **Method**: `GET`
- **Path**: `/api/stats`
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "totalSorted": 1200,
    "successCount": 1170,
    "successRate": 97.5,
    "divertedCount": 20,
    "rejectedCount": 8,
    "jammedCount": 2,
    "binBreakdown": {
      "bin1": 600,
      "bin2": 450,
      "bin3": 150
    },
    "brandBreakdown": {
      "brand_c": 580,
      "brand_a": 440,
      "brand_b": 180
    }
  }
}
```

---

## 4. Kênh Cảnh Báo Khẩn Cấp (`/api/email-alert` & `/api/telegram-alert`)

### 4.1. Gửi Email cảnh báo (SMTP)
- **Method**: `POST`
- **Path**: `/api/email-alert`
- **Headers**: `Content-Type: application/json`, `Authorization: Bearer <SECRET>` (nếu có)
- **Body**: `AlertPayload`
```json
{
  "event_id": "evt_123",
  "event_type": "emergency_stop",
  "severity": "critical",
  "device_id": "sorter_01",
  "description": "Nút dừng khẩn cấp IO10 đã kích hoạt!",
  "timestamp": "2026-09-17T12:00:00.000Z"
}
```

### 4.2. Gửi thông báo Telegram Bot
- **Method**: `POST`
- **Path**: `/api/telegram-alert`
- **Headers**: `Content-Type: application/json`, `Authorization: Bearer <SECRET>` (nếu có)
- **Body**: `AlertPayload`
- **Rate Limit**: Tối đa 1 request cùng loại trong vòng 5 giây từ 1 địa chỉ IP.
