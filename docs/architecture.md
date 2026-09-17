# KIẾN TRÚC HỆ THỐNG SORTIX DASHBOARD

## 1. Tổng Quan Kiến Trúc (High-Level Architecture)

Dự án **SortiX Dashboard** được tổ chức theo mô hình phân tầng chuẩn mực, tách biệt độc lập giữa **Frontend (UI/Client)**, **Backend (Server API)**, **Shared (Kiểu dữ liệu & Schemas dùng chung)** và **IoT Gateway (MQTT Broker & ESP32-C5)**:

```
                  ┌────────────────────────────────────────────────────────┐
                  │                 FRONTEND (Client / UI)                 │
                  │  Next.js 14 App Router • TailwindCSS • Recharts       │
                  │  Web Audio Industrial Sound Synthesizer                │
                  │  HTML5 Canvas 60fps Physics Simulation Loop            │
                  └───────────┬────────────────────────────────┬───────────┘
                              │ Fetch REST API                 │ WSS (Browser)
                              │ (via Service Client)           │
                              ▼                                ▼
┌─────────────────────────────────────────────┐   ┌────────────────────────┐
│            BACKEND (Server Layer)           │   │    MQTT BROKER / IoT   │
│  - Routes & REST Endpoints                  │   │  (EMQX / Mosquitto)    │
│  - Controllers & Business Services          │   │  Topics:               │
│  - Models (Bounded History & Config Store)  │   │  - sorter/01/status    │
│  - Email (SMTP) & Telegram Bot Integration  │   │  - sorter/01/telemetry │
│  - In-Memory Rate Limiting                  │   │  - sorter/01/vision    │
└─────────────────────────────────────────────┘   │  - sorter/01/control   │
                                                  │  - sorter/01/alerts    │
                                                  └───────────▲────────────┘
                                                              │ Wi-Fi 6
                                                  ┌───────────┴────────────┐
                                                  │     ESP32-C5 Hardware  │
                                                  │ (Sensors S1-S3, Servo) │
                                                  └────────────────────────┘
```

---

## 2. Phân Tầng Chi Tiết (Layer Breakdown)

### 2.1. Shared Layer (`shared/`)
- **`types/index.ts`**: Toàn bộ interface chuẩn (`TelemetryData`, `VisionDetection`, `SorterConfig`, `ClassificationRecord`, `AlertEvent`).
- **`schemas/index.ts`**: Bộ Zod schemas có thuộc tính `.passthrough()` để duy trì tính tương thích với các phiên bản firmware ESP32-C5.
- **`constants/index.ts`**: Hằng số mặc định toàn hệ thống (Topics MQTT, mã màu khay, vai trò người dùng).

### 2.2. Backend Layer (`backend/`)
- **Controllers (`backend/src/controllers/`)**: Tiếp nhận request, điều phối service và định dạng response.
  - `configController.ts`: Đọc, cập nhật, reset cấu hình.
  - `historyController.ts`: Lọc, phân trang, lưu và dọn dẹp lịch sử phân loại.
  - `statsController.ts`: Tổng hợp số liệu KPI và tỷ lệ chính xác.
  - `alertController.ts`: Xử lý gửi email cảnh báo và thông báo Telegram.
- **Services (`backend/src/services/`)**: Nghiệp vụ cốt lõi không phụ thuộc HTTP.
- **Models (`backend/src/models/`)**: Quản lý lưu trữ trạng thái máy chủ (bộ nhớ in-memory giới hạn 1000 bản ghi an toàn).
- **Middlewares (`backend/src/middlewares/`)**: Xác thực schema qua Zod và xử lý lỗi đồng nhất.
- **Server Entrypoint (`backend/src/server.ts`)**: HTTP Server độc lập, hỗ trợ CORS, có thể triển khai riêng biệt trên port 5000.

### 2.3. Frontend Layer (`frontend/` & `src/`)
- **App Router Pages (`src/app/`)**: 9 trang chức năng đáp ứng đầy đủ nghiệp vụ giám sát nhà máy.
- **Components Modularization**:
  - `overview/`: KPI Grid, Live Health, Calendar Filter, Recent Activity.
  - `conveyor/`: Canvas trực quan hóa 60fps, điều khiển tốc độ, nút E-Stop, khay hứng.
  - `layout/`: DashboardLayout, Sidebar, TopHeader.
  - `ui/`: Toast thông báo, ConfirmDialog, ExportDialog xuất CSV.
- **Services Client (`src/services/`)**: API fetch wrappers kết nối đến Backend endpoint:
  - `apiConfigClient.ts`
  - `apiHistoryClient.ts`
  - `apiStatsClient.ts`
- **Simulation vs. Real Hardware**:
  - Chế độ **Simulation**: Chạy độc lập trên browser Canvas, không gửi dữ liệu giả lên broker MQTT thật.
  - Chế độ **Live Hardware**: Gửi và nhận lệnh thực tế với phần cứng ESP32-C5 qua MQTT WebSocket.

---

## 3. Luồng Dữ Liệu Chuẩn (Data Flow)

```
[UI Component / User Action]
            │
            ▼
   [Custom React Hook] (useSorterData / useMQTT)
            │
            ▼
 [Frontend Service Client] (apiHistoryClient, apiConfigClient)
            │  (HTTP / Fetch)
            ▼
    [Backend Route] (/api/history, /api/config)
            │
            ▼
   [Backend Controller] (HistoryController, ConfigController)
            │  (Validate Zod Schema)
            ▼
    [Backend Service] (historyService, configService)
            │
            ▼
    [Backend Model] (HistoryModel, ConfigModel)
```
