# SortiX Dashboard — báo cáo tổng kết

Ngày kiểm tra: 18/09/2026

## Kết quả chạy cuối

| Kiểm tra | Kết quả | Bằng chứng |
|---|---:|---|
| TypeScript | ✅ 0 errors | `npx tsc --noEmit --pretty false` |
| Test suite | ✅ 108/108 PASS | 15 nhóm test, không có test fail |
| Frontend production build | ✅ Success | `npm run build` trong `frontend`, 29/29 static pages; `.next/BUILD_ID` được tạo |

Build cần Node heap lớn hơn mặc định (`NODE_OPTIONS=--max-old-space-size=4096`) do kích thước bundle; mã nguồn compile, typecheck và lint đều hoàn tất.

## Các vấn đề đã phát hiện và sửa

| # | Danh mục | Mô tả vấn đề | File | Trạng thái |
|---:|---|---|---|---|
| 1 | Backend build | Script trỏ tới `src/server.js`/`dist/server.js` không tồn tại; alias `@shared/*` không được Node resolve sau `tsc` | `backend/package.json`, `backend/scripts/patch-dist-aliases.cjs` | ✅ Đã sửa |
| 2 | API auth | Thiếu endpoint logout ở native backend | `backend/src/server.ts` | ✅ Đã sửa |
| 3 | API URL | Client dùng không nhất quán `NEXT_PUBLIC_API_URL` và `NEXT_PUBLIC_BACKEND_URL` | `frontend/src/services/apiAuthClient.ts`, `apiUsersClient.ts`, `apiSafetyClient.ts` | ✅ Đã sửa |
| 4 | SSE | EventSource luôn trỏ origin Next.js dù backend URL được cấu hình riêng | `frontend/src/components/layout/DashboardLayout.tsx` | ✅ Đã sửa |
| 5 | MQTT typing | Payload simulation `unknown` truyền trực tiếp vào service typed | `backend/src/services/mqttService.ts` | ✅ Đã sửa bằng Zod parse |
| 6 | Dữ liệu/API | Backend thiếu một số kiểm tra quyền, query validation và graceful shutdown | `backend/src/server.ts`, middleware/services | ✅ Đã sửa |
| 7 | Bảo mật | Chuẩn hóa bcrypt, signed session, OTP expiry/one-time-use và admin RBAC | `backend/src/services/userService.ts`, `authToken.ts`, `authMiddleware.ts` | ✅ Đã sửa |
| 8 | Cảnh báo | Bổ sung timestamp chuẩn hóa, SSE broadcast/recovery và bounded notifications | `backend/src/services/safetyService.ts`, `sseService.ts`, `notificationModel.ts` | ✅ Đã sửa |
| 9 | Simulation/Realtime | Chặn dữ liệu giả lập lọt vào realtime và đồng bộ bin/telemetry | `frontend/src/hooks/useSorterData.ts`, `useMQTT.ts`, `useConveyorPhysics.ts` | ✅ Đã sửa |
| 10 | Code quality | Dead import, debug log, CSS class và dependency không dùng | `frontend/src`, `backend/src`, `package.json` | ✅ Đã dọn |

Không sửa file trong `tests/` và không thay đổi layout, style hoặc hành vi UX/UI.

## Checklist bảo mật

| Hạng mục | Kết quả |
|---|---:|
| Mật khẩu bcrypt, salt rounds tối thiểu 10 | ✅ |
| Đăng nhập dùng `bcrypt.compare`, thông báo lỗi chung | ✅ |
| OTP 6 chữ số, hết hạn 300 giây, hủy sau khi dùng | ✅ |
| Không cho reset mật khẩu admin từ bên ngoài | ✅ |
| Register luôn gán role `user` và validate Zod | ✅ |
| Session token ký và kiểm tra lại role/status | ✅ |
| Admin-only routes trả 403 cho user thường | ✅ |
| Không tự xóa admin, không xóa admin cuối cùng | ✅ |

## Checklist đồng bộ dữ liệu

| Hạng mục | Kết quả |
|---|---:|
| Simulation/Realtime isolation và chặn `user_action`/`physics_in` | ✅ |
| Bin capacity clamp 5–50, localStorage và Context đồng bộ | ✅ |
| Temperature gauge: slider simulation, telemetry hardware realtime | ✅ |
| Shift summary lấy dữ liệu live và khớp history | ✅ |

## Checklist cảnh báo

| Cảnh báo | Kết quả |
|---|---:|
| E-Stop: khóa hệ thống, còi liên tục, admin unlock, grace 5 giây | ✅ |
| Jam: sensor Zone A/#02, 5 giây, MQTT topic đúng | ✅ |
| Bin Full: `current_count >= max_capacity`, reset về 0 | ✅ |
| Temperature: ngưỡng trên 75°C, nhãn Edge AI | ✅ |
| Device Offline: heartbeat 2 giây, watchdog 6 giây | ✅ |
| MQTT Disconnect: debounce 5 giây, backoff 3/5/10 giây | ✅ |
| Shift Summary: timestamp, SSE và notification đúng thứ tự | ✅ |

## Checklist hiệu năng

| Hạng mục | Kết quả |
|---|---:|
| Canvas dùng `requestAnimationFrame` và cleanup | ✅ |
| Listener/interval/timeout cleanup | ✅ |
| Context/handler memoization và dependency kiểm tra | ✅ |
| MQTT/SSE cleanup, reconnect và giới hạn cập nhật | ✅ |
| AudioContext tạo lazy, AudioNode được dọn | ✅ |

## Dọn dẹp

- Không xóa file production nào vì chưa đủ bằng chứng orphan.
- Đã loại bỏ các import/debug log dư thừa đã xác định.
- Đã bỏ 3 CSS class không được tham chiếu.
- Đã loại bỏ 2 dependency trực tiếp không dùng (`clsx`, `tailwind-merge`) và cập nhật lockfile.
- `frontend/src/lib/types.ts` và `schemas.ts` chỉ còn re-export từ `shared/`.
- Kích thước source hiện tại của `frontend/src`, `backend/src`, `backend/scripts`, `shared`, `src`, `data`: **1,084,770 bytes (~1.03 MiB)**. Baseline byte-size trước các đợt chỉnh sửa trước đó không được lưu, nên không suy diễn chênh lệch trước/sau.

## Checklist tích hợp

| Hạng mục | Kết quả |
|---|---:|
| API methods/routes và response envelope | ✅ |
| SSE endpoint `/api/events`, event names và payload | ✅ |
| Shared types/schemas không bị drift | ✅ |
| ENV backend/frontend và `.gitignore` secrets | ✅ |
| Backend start, health/config smoke test | ✅ |
| MQTT config từ ENV, không hardcode credentials | ✅ |

## Đề xuất cho giai đoạn tiếp theo

- Tách `ConveyorVisualizer.tsx` và `DashboardLayout.tsx` thành các module nhỏ hơn theo miền logic; cần kiểm tra snapshot/UI trước khi merge.
- Thêm CI job chạy `tsc`, test, build với Node heap giới hạn và lưu artifact `.next`.
- Thêm integration test HTTP thật cho auth, RBAC, SSE replay và MQTT adapter giả lập.
- Đo benchmark Canvas frame time, React commit duration, MQTT message rate và memory heap trong phiên 30 phút.
- Bổ sung proxy route Next.js cho các safety endpoint nếu triển khai frontend mà không expose `NEXT_PUBLIC_API_URL`.
- Chuẩn hóa một module `apiBaseUrl` dùng chung cho toàn bộ API clients.

## Xác nhận cuối

✅ TypeScript: 0 errors  
✅ Tests: 108/108 PASS  
✅ Build: Success  
✅ UI/UX: Không thay đổi trong phạm vi tích hợp và kiểm thử cuối  
✅ Giao diện: Giữ nguyên
