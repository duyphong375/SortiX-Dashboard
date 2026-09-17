# QUY TẮC PHÁT TRIỂN DỰ ÁN SORTIX DASHBOARD (AGENTS.md)

Tài liệu này quy định các tiêu chuẩn kỹ thuật, ràng buộc kiến trúc và nguyên tắc bảo mật **BẮT BUỘC** áp dụng cho tất cả các AI Agent và Lập trình viên khi làm việc với codebase của **SortiX Dashboard** (Đồ án PBL3).

---

## 1. Kiến Trúc Monorepo & Công Nghệ Lõi
- **Mô hình Monorepo (npm workspaces)**:
  - `frontend/`: Ứng dụng Next.js 14 App Router (`frontend/src/app/`).
  - `backend/`: Máy chủ độc lập Node.js/Express + TypeScript (`backend/src/`).
  - `shared/`: Thư viện dùng chung (`types/`, `schemas/`, `constants/`).
- **Server vs. Client Components**: Ưu tiên tối đa Server Components trong Next.js. Chỉ khai báo chỉ thị `'use client'` khi bắt buộc tương tác với Browser APIs (React state/hooks, HTML5 Canvas, Web Audio API, Recharts, MQTT WebSocket Client).
- **Quy tắc Path Alias**:
  - Tại Frontend: Luôn sử dụng alias `@/` trỏ tới `frontend/src/` và `@shared/*` trỏ tới `shared/*`.
  - Tại Backend: Luôn import từ `@shared/*` hoặc relative path chuẩn mực.
  - Tuyệt đối không dùng các đường dẫn tương đối xuyên tầng lộn xộn (ví dụ: `../../../../shared/types`).

---

## 2. Tiêu Chuẩn TypeScript Khắt Khe (Strict Typing)
- **TypeScript Strict Mode**: Toàn bộ dự án đã bật `"strict": true` trong `tsconfig.json`.
- **Nghiêm cấm kiểu `any` tùy tiện**: Tuyệt đối không khai báo biến kiểu `any` hoặc gắn comment `@ts-ignore` để che giấu lỗi type.
- **Sử dụng Kiểu Dữ Liệu Tập Trung**:
  - Mọi interface cốt lõi (`TelemetryData`, `VisionDetection`, `SorterConfig`, `ClassificationRecord`, `AlertEvent`, `User`, `SafeUser`) phải được import trực tiếp từ `shared/types`.
- **Xác thực Typecheck trước khi bàn giao**:
  ```powershell
  npx tsc --noEmit --pretty false
  ```

---

## 3. Xác Thực Dữ Liệu & Quy Tắc Zod Schema
- **Xác thực Untrusted Input**: Mọi dữ liệu nhận từ giao thức mạng (gói tin MQTT từ ESP32-C5 hoặc HTTP request từ client) **BẮT BUỘC** phải được parse và xác thực bằng Zod schemas định nghĩa trong `shared/schemas/`.
- **Quy tắc `.passthrough()` Bắt Buộc**:
  - Các Zod Schema định nghĩa cho thiết bị (như `TelemetrySchema`, `VisionDetectionSchema`, `SorterConfigSchema`) phải luôn kết thúc bằng `.passthrough()`.
  - *Mục đích*: Ngăn chặn tình trạng Dashboard crash khi phần cứng ESP32-C5 gửi thêm các cờ chẩn đoán firmware mới.

---

## 4. Nguyên Tắc Bảo Mật & Xác Thực (Security & RBAC Rules)
- **Băm mật khẩu Bcrypt**:
  - Mọi mật khẩu người dùng lưu trữ trong cơ sở dữ liệu hoặc `data/users.json` **bắt buộc** phải được băm bằng thuật toán `bcrypt` với tối thiểu `10 salt rounds`. Tuyệt đối không lưu trữ hay so khớp mật khẩu dạng plain text.
- **Chống Tấn Công Leo Thang Đặc Quyền (Privilege Escalation Prevention)**:
  - Endpoint đăng ký tự do (`/api/auth/register`) luôn luôn gán cứng `role: 'user'`, bỏ qua bất kỳ trường `role` nào được gửi từ client.
- **Phân Quyền Vai Trò (RBAC)**:
  - Mọi endpoint tác động đến cấu hình máy (`/api/config`), xóa lịch sử (`DELETE /api/history`), và quản trị người dùng (`/api/users/*`) bắt buộc phải đi qua middleware kiểm tra quyền Admin (`requireAdmin`). Người dùng thường vi phạm sẽ nhận mã `403 Forbidden`.
- **Ràng Buộc An Toàn Dành Cho Admin**:
  - Admin **không được phép tự xóa tài khoản của chính mình** khi đang trong phiên đăng nhập.
  - Tuyệt đối **không được phép xóa tài khoản Admin nếu số lượng Admin trong hệ thống còn lại $\le 1$** (đảm bảo hệ thống luôn có người quản trị).
- **Cơ Chế Mock OTP**:
  - Mã OTP đặt lại mật khẩu phải là chuỗi ngẫu nhiên 6 chữ số với thời hạn hết hạn nghiêm ngặt là **5 phút (300 giây)**.
  - Chống tái sử dụng mã OTP (hủy mã ngay sau lần xác thực thành công đầu tiên).
  - Chặn khôi phục từ bên ngoài đối với các tài khoản có role `admin`.

---

## 5. Truyền Thông IoT & Cách Ly Mô Phỏng
- **Tách biệt 2 chế độ**:
  - **Mô phỏng (Simulation Mode)**: Toàn bộ quá trình nạp phôi và di chuyển trên băng tải chỉ diễn ra trên HTML5 Canvas. Tuyệt đối **không publish payload giả** lên các topic MQTT thật để không làm sai lệch dữ liệu sản xuất.
  - **Máy thật (Live Hardware Mode)**: Lắng nghe tín hiệu thực từ ESP32-C5. Xử lý timeout khi mất tín hiệu và kiểm soát nút dừng khẩn cấp (E-Stop).
- **Bảo mật Broker**: Tuyệt đối không hardcode URL, username, password của MQTT Broker vào mã nguồn. Luôn nạp qua biến môi trường `.env`.

---

## 6. Đảm Bảo Chất Lượng & Bảo Vệ Kiểm Thử (Testing Gates)
- **BẢO VỆ TUYỆT ĐỐI THƯ MỤC `tests/`**:
  - Tuyệt đối không được xóa, đổi tên hoặc sửa đổi logic để "lách" các bài test trong 3 bộ kiểm thử:
    1. `tests/history.test.cjs` (9 tests: Bounded buffer, migration, normalization)
    2. `tests/api_schemas.test.cjs` (3 tests: Schema validation, passthrough)
    3. `tests/users.test.cjs` (14 tests: Bcrypt, OTP, RBAC, Privilege Escalation, Admin deletion constraints)
- **Tiêu chuẩn nghiệm thu**: Toàn bộ **26/26 tests bắt buộc phải PASS 100%**:
  ```powershell
  npm test
  ```

---

## 7. Phân Phối Tác Vụ Trong Hệ Sinh Thái Google Antigravity

Dự án vận hành 100% trên nền tảng **Google Antigravity**:

| Tác nhân / Công cụ | Mô hình đề xuất | Trách nhiệm chính |
| :--- | :--- | :--- |
| **Antigravity Agent** | **Gemini Pro – High** | Khảo sát tổng thể, thiết kế kiến trúc phân tầng, lập và cập nhật tài liệu kỹ thuật (`README.md`, `architecture.md`, `api.md`, `REFACTOR_PLAN.md`, `CHANGELOG.md`). |
| **Antigravity CLI** | **Gemini Flash High** hoặc **Pro Medium** | Triển khai tính năng, sửa lỗi file, chạy lệnh terminal, cập nhật Zod schemas, thêm controllers/services. |
| **Antigravity CLI (Việc khó)** | **Pro High** | Refactor cấu trúc lớn, xử lý lỗi typecheck phức tạp, tối ưu hóa thuật toán Canvas 60fps, nâng cấp hệ thống bảo mật & database migrations. |
