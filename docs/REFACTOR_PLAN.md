# KẾ HOẠCH TÁI CẤU TRÚC HỆ THỐNG SORTIX DASHBOARD (REFACTOR_PLAN.md)

> **Tài liệu được lập bởi**: Antigravity Agent (Gemini Pro – High)  
> **Mục đích**: Khảo sát toàn bộ project, xác lập kiến trúc chuẩn, phân định rạch ròi phạm vi Frontend (FE) và Backend (BE), và phân bổ task chi tiết cho **Antigravity CLI** theo từng cấp độ mô hình.

---

## 1. Phân Định Quyết Định Kiến Trúc: Frontend (FE) vs Backend (BE)

Để giải quyết tình trạng mã nguồn nguyên khối (monolithic) và xử lý phụ thuộc quá nhiều vào `localStorage` ở client, hệ thống được phân định rõ ràng thành hai phần:

```
                  ┌────────────────────────────────────────────────────────┐
                  │                 FRONTEND (Client / UI)                 │
                  │  Next.js App Router ('use client' khi cần tương tác)   │
                  │  TailwindCSS • Recharts • Web Audio • Lucide Icons     │
                  └───────────┬────────────────────────────────┬───────────┘
                              │ Fetch REST API                 │ WSS (Browser)
                              ▼                                ▼
┌─────────────────────────────────────────────┐   ┌────────────────────────┐
│            BACKEND (Server Layer)           │   │    MQTT BROKER / IoT   │
│  src/app/api/ (Next.js Route Handlers)      │   │  (EMQX / Mosquitto)    │
│  src/services/ (Domain Business Logic)      │   │  Topics: status,       │
│  src/lib/schemas.ts (Zod Strict Validation) │   │  telemetry, vision,    │
│  Rate limiting, API Security, Persistence   │   │  control, config       │
└─────────────────────────────────────────────┘   └───────────▲────────────┘
                                                              │ Wi-Fi 6
                                                  ┌───────────┴────────────┐
                                                  │     ESP32-C5 Hardware  │
                                                  └────────────────────────┘
```

### 1.1. Phạm vi Frontend (FE)
- **Quản lý giao diện & Trải nghiệm người dùng (UI/UX)**:
  - Giữ các trang App Router gọn nhẹ, chỉ đóng vai trò ghép nối layout (`src/app/`).
  - Phân rã các khối giao diện thành Subcomponents độc lập đặt trong thư mục tính năng:
    - `src/components/overview/`: `KpiStatGrid`, `LiveHealthAndBinWidget`, `CalendarWidget`, `RecentActivityList`.
    - `src/components/conveyor/`: `ConveyorCanvas`, `ConveyorControls`, `QuickFeedBar`, `BinTrays`.
    - `src/components/analytics/`: Các biểu đồ Recharts phân tích sản lượng theo giờ, theo nhãn, theo khay.
- **Client State & Simulation Logic**:
  - `useConveyorPhysics.ts`: Vòng lặp mô phỏng vật lý 60fps (requestAnimationFrame), va chạm cảm biến S1, S2, S3, gạt servo ảo.
  - `useThemeAudio.ts`: Hiệu ứng âm thanh công nghiệp tổng hợp qua Web Audio API.
  - Phân tách rạch ròi 2 chế độ: **Mô phỏng** (Simulation) và **Máy thật** (Live Hardware).

### 1.2. Phạm vi Backend (BE)
- **Tầng Dịch Vụ Nghiệp Vụ (`src/services/`)**:
  - `configService.ts`: Đọc/lưu cấu hình phân loại, validate Zod, xử lý versioning tự động khi cập nhật.
  - `historyService.ts`: Xử lý bộ lọc (filter theo ngày, khay, thương hiệu, trạng thái), phân trang và lưu trữ bản ghi.
  - `statsService.ts`: Tính toán các chỉ số thống kê (KPI tổng hợp, tỷ lệ phân loại thành công, phân bố thương hiệu).
- **Tầng API Endpoints (`src/app/api/`)**:
  - Chuẩn hóa các RESTful route handlers: `/api/config`, `/api/history`, `/api/stats`, `/api/email-alert`, `/api/telegram-alert`.
  - Kiểm tra đầu vào nghiêm ngặt bằng Zod schemas (`src/lib/schemas.ts`).
  - Quản lý API Key / Secret và cơ chế rate limiting in-memory chống lạm dụng.

---

## 2. Phân Bổ Task Cho Antigravity CLI Theo Mô Hình Khuyến Nghị

Dựa theo bảng phân công thiết lập công cụ:

| Công cụ | Model khuyến nghị | Phạm vi sử dụng |
| :--- | :--- | :--- |
| **Antigravity Agent** | `Gemini Pro – High` | Đọc toàn project, thiết kế kiến trúc, lập `REFACTOR_PLAN.md`, chia task, phân định FE/BE |
| **Antigravity CLI** | `Gemini Flash High` hoặc `Pro Medium` | Implement backend, API, MQTT, sửa file, chạy command, fix lỗi thông thường |
| **Antigravity CLI (Việc khó)** | `Pro High` | Refactor kiến trúc lớn, lỗi hóc búa, thay đổi nhiều module liên kết |

---

### Task Set 1: Dành Cho Antigravity CLI (Dùng `Gemini Flash High` hoặc `Pro Medium`)
*Các tác vụ thông thường, tốc độ cao, sửa file đơn lẻ hoặc triển khai API/Service theo spec:*

- [x] **Task 1.1 - Mở rộng Schema Zod (`src/lib/schemas.ts`)**:
  - Thêm `SorterConfigSchema`, `BinRuleSchema`, `ClassificationRecordSchema`, `HistoryQuerySchema`.
  - Luôn giữ `.passthrough()` ở cuối các schema thiết bị.
- [x] **Task 1.2 - Xây dựng Service Layer (`src/services/`)**:
  - Hoàn thiện `configService.ts` quản lý versioning cấu hình.
  - Hoàn thiện `historyService.ts` truy vấn, lọc và phân trang lịch sử.
  - Hoàn thiện `statsService.ts` tính toán số liệu thống kê.
- [x] **Task 1.3 - Xây dựng REST API Routes (`src/app/api/`)**:
  - Viết `src/app/api/config/route.ts` (GET, POST).
  - Viết `src/app/api/history/route.ts` (GET, POST, DELETE).
  - Viết `src/app/api/stats/route.ts` (GET).
- [x] **Task 1.4 - Chạy kiểm thử tự động & Fix lỗi cú pháp đơn lẻ**:
  - Viết `tests/api_schemas.test.cjs` kiểm tra schema.
  - Chạy `npm test` và `npx tsc --noEmit --pretty false` để sửa nhanh các lỗi type.

---

### Task Set 2: Dành Cho Antigravity CLI khi gặp việc khó (Dùng `Pro High`)
*Các tác vụ yêu cầu suy luận ngữ cảnh sâu, thay đổi kiến trúc nhiều module và tối ưu hóa hiệu năng:*

- [x] **Task 2.1 - Phân rã Monolithic Component `src/app/page.tsx` (47KB -> ~90 dòng)**:
  - Tách thành 4 subcomponents độc lập trong `src/components/overview/`:
    - `KpiStatGrid.tsx` (Stat cards & count-up hook)
    - `LiveHealthAndBinWidget.tsx` (ESP32 telemetry, MQTT broker & 3 bin meters)
    - `CalendarWidget.tsx` (Interactive date filter & breakdown)
    - `RecentActivityList.tsx` (5 recent items)
  - Tích hợp lại vào `page.tsx`, kiểm soát re-render và giữ nguyên vẹn 100% logic UI.
- [x] **Task 2.2 - Tách Subcomponents Băng Tải (`src/components/conveyor/`)**:
  - Tách `ConveyorControls.tsx`: Cụm nút điều khiển Run/Pause/E-Stop và thanh trượt tốc độ.
  - Tách `QuickFeedBar.tsx`: Dải nạp nhanh vật thể mô phỏng.
  - Tách `BinTrays.tsx`: Hệ thống 3 máng trượt và hộp thoại xác nhận dọn khay đầy.
- [ ] **Task 2.3 - Tối ưu hóa State Management toàn hệ thống (`DashboardLayout.tsx`)**:
  - Hiện tại `DashboardLayout.tsx` đang gánh toàn bộ state (~542 dòng).
  - Chia nhỏ thành các Context chuyên biệt:
    - `TelemetryContext`: Quản lý MQTT, broker status, ESP32 telemetry.
    - `ConveyorContext`: Quản lý trạng thái chạy, tốc độ, physics và danh sách vật thể.
    - `RecordsContext`: Quản lý danh sách phân loại, alerts và đồng bộ API.
- [ ] **Task 2.4 - Module hóa trang Báo cáo Thống kê (`src/app/analytics/page.tsx` - 32KB)**:
  - Phân rã thành các widget biểu đồ Recharts chuyên biệt:
    - `HourlyThroughputChart.tsx`: Sản lượng phân loại theo từng giờ.
    - `BrandSharePieChart.tsx`: Tỷ lệ thị phần các loại lon/chai.
    - `BinDistributionBarChart.tsx`: Tỷ lệ phân luồng vào 3 khay chứa.
- [ ] **Task 2.5 - Đồng bộ dữ liệu Hybrid (LocalStorage + Server API Sync)**:
  - Thiết lập cơ chế sao lưu tự động (Auto-backup): Khi có mạng, tự động đẩy dữ liệu từ `localStorage` lên server API để lưu trữ lâu dài.

---

## 3. Quy Trình Kiểm Thử & Chốt Chặn Chất Lượng (Quality Gate)

Trước khi bàn giao bất kỳ task nào, **Antigravity CLI** bắt buộc phải vượt qua 4 chốt chặn kiểm định:

1. **Kiểm tra kiểu dữ liệu (0 lỗi)**:
   ```powershell
   npx tsc --noEmit --pretty false
   ```
2. **Kiểm tra linter (0 lỗi)**:
   ```powershell
   npm run lint
   ```
3. **Kiểm tra hồi quy tự động (100% Pass)**:
   ```powershell
   npm test
   ```
4. **Kiểm tra Production Build (17/17 pages thành công)**:
   ```powershell
   npm run build
   ```
