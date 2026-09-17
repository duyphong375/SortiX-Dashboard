# NHẬT KÝ CHỈNH SỬA HỆ THỐNG (CHANGELOG.md)

Tất cả các thay đổi lớn về kiến trúc, tính năng, sửa lỗi và cập nhật của dự án **SortiX Dashboard** được ghi lại tại tài liệu này theo chuẩn [Keep a Changelog](https://keepachangelog.com/).

---

## [2.0.0] - 2026-09-17 (Tái Cấu Trúc Monorepo Frontend / Backend / Shared)

### 🚀 Added (Thêm mới)
- **Tầng Dùng Chung (`shared/`)**:
  - `shared/types/index.ts`: Toàn bộ TypeScript interfaces chuẩn (`TelemetryData`, `VisionDetection`, `SorterConfig`, `ClassificationRecord`, `AlertEvent`).
  - `shared/schemas/index.ts`: Schemas Zod có `.passthrough()` đảm bảo tính tương thích với firmware ESP32-C5.
  - `shared/constants/index.ts`: Hằng số MQTT topics, mã màu 3 khay, vai trò người dùng (RBAC).
- **Tầng Backend Độc Lập (`backend/`)**:
  - `backend/src/controllers/`: `configController`, `historyController`, `statsController`, `alertController`.
  - `backend/src/routes/`: `configRoutes`, `historyRoutes`, `statsRoutes`, `alertRoutes`.
  - `backend/src/services/`: `configService`, `historyService`, `statsService`, `alertNotificationService`.
  - `backend/src/models/`: `configModel`, `historyModel` (quản lý in-memory tối đa 1000 bản ghi an toàn).
  - `backend/src/middlewares/`: `validateMiddleware.ts` (xác thực Zod), `errorMiddleware.ts`.
  - `backend/src/server.ts`: HTTP Server độc lập cổng 5000 chuẩn RESTful, có sẵn CORS và `/api/health`.
- **Tầng Frontend Services (`src/services/`)**:
  - `apiConfigClient.ts`: Fetch wrapper gọi REST API cấu hình.
  - `apiHistoryClient.ts`: Fetch wrapper gọi REST API lịch sử (hỗ trợ phân trang, lọc).
  - `apiStatsClient.ts`: Fetch wrapper gọi REST API thống kê KPI.
- **Tài Liệu & Tự Động Hóa**:
  - `docs/architecture.md`: Tài liệu kiến trúc phân tầng, phân định Simulation vs Live Hardware.
  - `docs/api.md`: Đặc tả chi tiết toàn bộ các RESTful API endpoints.
  - `scripts/dev.ps1`: Script PowerShell khởi động hệ thống nhanh.
  - `scripts/test.ps1`: Script PowerShell chạy toàn bộ bộ kiểm tra chất lượng tự động.
  - `tests/api_schemas.test.cjs`: Kiểm thử tự động cho các Zod Schemas.
  - `.env.example`: Mẫu cấu hình môi trường chuẩn hóa cho toàn hệ thống.

### 🔄 Changed (Cải tiến & Tái cấu trúc)
- **Phân rã Monolithic Component**:
  - Tách `src/app/page.tsx` từ 988 dòng (47KB) xuống ~90 dòng, đưa các khối giao diện thành 4 subcomponents độc lập:
    - `src/components/overview/KpiStatGrid.tsx`
    - `src/components/overview/LiveHealthAndBinWidget.tsx`
    - `src/components/overview/CalendarWidget.tsx`
    - `src/components/overview/RecentActivityList.tsx`
- **Subcomponents Băng Tải**:
  - Chuẩn hóa các thành phần điều khiển trong `src/components/conveyor/` (`ConveyorControls.tsx`, `QuickFeedBar.tsx`, `BinTrays.tsx`).
- **Tương thích ngược an toàn (Backward Compatibility)**:
  - `src/lib/types.ts` và `src/lib/schemas.ts` re-export trực tiếp từ `shared/`, giúp toàn bộ code cũ không bị đứt gãy.
  - Cập nhật cấu hình `tsconfig.json` hỗ trợ path alias `@shared/*`.
  - Cập nhật `README.md` bổ sung Mục 0 hướng dẫn kiến trúc Monorepo.

### 🛡️ Quality Assurance (Chất lượng & Kiểm định)
- Bảo vệ tuyệt đối `tests/history.test.cjs` (Pass 9/9 tests).
- Chạy toàn bộ bộ kiểm thử: **Pass 12/12 tests (100%)**.
- TypeScript Strict Mode: **0 errors**.
- ESLint: **0 errors**.
- Production Build: Tạo thành công toàn bộ **17/17 trang Next.js**.

---

## [1.0.0] - 2026-09-15 (Phiên bản Dashboard Ban Đầu)
- Khởi tạo dự án SortiX Dashboard trên nền Next.js 14 App Router, TailwindCSS, Recharts, Lucide Icons.
- Mô phỏng băng tải vật lý 60fps trên HTML5 Canvas qua `useConveyorPhysics.ts`.
- Bộ tổng hợp âm thanh công nghiệp qua Web Audio API thuần (`audioService.ts`).
- Kết nối MQTT broker qua WebSocket cho thiết bị vi điều khiển ESP32-C5 (`mqttClient.ts`).
- Quản lý lịch sử và cấu hình phân loại trên LocalStorage trình duyệt.
