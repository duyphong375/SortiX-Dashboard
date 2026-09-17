# Quy tắc phát triển dự án SortiX Dashboard (AGENTS.md)

Đây là tài liệu quy định kỹ thuật (Rules) **BẮT BUỘC** dành cho tất cả các AI Agent và Lập trình viên khi làm việc với codebase của **SortiX Dashboard**.

## 1. Kiến trúc & Công nghệ lõi
- **Next.js 14 (App Router):** Code phải tuân thủ chuẩn App Router đặt tại `src/app/`. 
- **Server vs Client Components:** Ưu tiên tối đa Server Components. Chỉ sử dụng chỉ thị `'use client'` khi thực sự cần thiết (ví dụ: sử dụng React Hooks, biểu đồ Recharts, kết nối MQTT Client tại trình duyệt).
- **Styling:** Sử dụng **TailwindCSS** kết hợp với thư viện `clsx` và `tailwind-merge` để xử lý class CSS động.
- **Alias Path:** Luôn sử dụng alias `@/` thay cho đường dẫn tương đối (VD: import từ `@/lib/types` thay vì `../../lib/types`).

## 2. Tiêu chuẩn TypeScript & Kiểm tra kiểu dữ liệu
- **TypeScript Strict Mode:** Dự án đang bật `"strict": true` trong `tsconfig.json`. Tuyệt đối **không được sử dụng** kiểu `any` hoặc comment `@ts-ignore` bừa bãi.
- **Sử dụng Kiểu tập trung:** Mọi dữ liệu cốt lõi đều đã được định nghĩa interface trong `src/lib/types.ts` (như `TelemetryData`, `VisionDetection`, `SorterConfig`, `ClassificationRecord`, `AlertEvent`). **Bắt buộc** import và sử dụng các type này thay vì định nghĩa lại rải rác.
- **Xác thực trước khi bàn giao:** Trước khi hoàn thành tác vụ, cần xác minh không có lỗi type bằng lệnh:
  ```powershell
  npx tsc --noEmit --pretty false
  ```

## 3. Quản lý luồng dữ liệu & Xác thực Schema (Zod)
- **Bảo vệ dữ liệu MQTT (Untrusted Input):** Mọi dữ liệu nhận từ giao thức MQTT (từ thiết bị ESP32-C5) **BẮT BUỘC** phải được parse và xác thực qua **Zod schema** định nghĩa tại `src/lib/schemas.ts` (như `TelemetrySchema`, `VisionDetectionSchema`).
- **Quy tắc Passthrough:** Các Zod Schema phải định nghĩa khắt khe cho các trường đã biết, nhưng phải luôn sử dụng `.passthrough()` ở cuối để duy trì tính tương thích với các phiên bản firmware chứa metadata phụ.

## 4. Giao thức điều khiển thiết bị (MQTT) & Chế độ Mô phỏng
- **Tách biệt 2 chế độ:**
  - **Mô phỏng (Simulation):** Xử lý giả lập hoàn toàn trên Frontend/Browser, không được publish payload "giả" lên luồng MQTT thật để tránh làm nhiễu lịch sử hệ thống thiết bị thực.
  - **Máy thật (Live Hardware):** Lắng nghe và điều khiển trực tiếp qua MQTT. Cần xử lý cẩn thận các trường hợp mất tín hiệu (timeout, offline) và trạng thái dừng khẩn cấp (E-Stop).
- **Bảo mật cấu hình:** Tuyệt đối không hardcode thông tin broker MQTT (URL, User, Password) vào code. Phải lấy qua biến môi trường từ file `.env.local`.

## 5. Đảm bảo chất lượng & Bảo vệ kiểm thử (Testing)
- **BẢO VỆ TUYỆT ĐỐI THƯ MỤC TESTS:** Tuyệt đối không được phép xóa, đổi tên, hoặc làm hỏng các logic kiểm thử hiện có trong thư mục `tests/` (ví dụ: file `history.test.cjs`).
- **Regression Testing:** Sau khi chỉnh sửa code, đặc biệt là các logic xử lý dữ liệu trong thư mục `src/lib/` hoặc cấu trúc database, **PHẢI** chạy kiểm tra tự động và đảm bảo Pass 100%:
  ```powershell
  npm test
  ```
- Nếu thêm hàm tiện ích xử lý logic phức tạp mới, khuyến khích viết thêm module test tương ứng vào thư mục `tests/`.

## 6. Thiết lập Mô hình AI & Phân chia Vai trò (Hệ sinh thái Antigravity)

Dự án vận hành 100% trên nền tảng **Google Antigravity**, không sử dụng công cụ ngoài:

| Công cụ | Model nên dùng | Dùng cho |
| :--- | :--- | :--- |
| **Antigravity Agent** | **Gemini Pro – High** | Đọc toàn project, kiến trúc, lập `REFACTOR_PLAN.md`, chia task, quyết định FE/BE, nghiệm thu |
| **Antigravity CLI** | **Gemini Flash High** hoặc **Pro Medium** | Implement backend, frontend, API, MQTT, sửa file, chạy command, fix lỗi thông thường |
| **Antigravity CLI (khi việc khó)** | **Pro High** | Refactor cấu trúc lớn (`frontend/`, `backend/`, `shared/`), lỗi khó, thay đổi nhiều module, kiểm định build/lint/typecheck |

Mọi kế hoạch tái cấu trúc và phân chia task chi tiết được lưu trữ và cập nhật liên tục tại file [`REFACTOR_PLAN.md`](./REFACTOR_PLAN.md).
