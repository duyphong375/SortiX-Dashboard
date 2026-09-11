# SortiX Dashboard — Hướng dẫn sử dụng cho người mới

SortiX Dashboard là giao diện theo dõi và điều khiển hệ thống phân loại sản phẩm trên băng tải. Ứng dụng có hai chế độ:

- **Mô phỏng:** chạy thử ngay trên máy tính, không cần ESP32 hay camera. Dữ liệu lịch sử chỉ xuất hiện khi người dùng tạo mẫu hoặc chạy mô phỏng.
- **Máy thật:** nhận trạng thái, dữ liệu camera và telemetry từ thiết bị qua MQTT. Các nút tạo mẫu bị ẩn để tránh gửi dữ liệu giả vào quy trình thật.

## 1. Chuẩn bị

Cài đặt các phần mềm sau trước khi chạy:

- Node.js 18.17 trở lên (khuyến nghị dùng bản LTS).
- npm, được cài kèm Node.js.
- Trình duyệt hiện đại như Chrome, Edge hoặc Firefox.

## 2. Cài đặt và chạy lần đầu

Mở PowerShell tại thư mục chứa dự án rồi chạy:

```powershell
cd SortiX-Dashboard
npm install
copy .env.local.example .env.local
npm run dev
```

Mở trình duyệt tại [http://localhost:3000](http://localhost:3000).

Nếu cổng 3000 đang được sử dụng, chạy bằng cổng khác:

```powershell
npm run dev -- -p 3001
```

Sau đó truy cập [http://localhost:3001](http://localhost:3001).

### Chạy bản production

```powershell
npm run build
npm start
```

### Kiểm tra nhanh mã nguồn

```powershell
npm test
npx tsc --noEmit --pretty false
```

## 3. Đăng nhập

Ứng dụng có sẵn hai tài khoản demo:

| Vai trò | Email | Mật khẩu | Quyền chính |
| --- | --- | --- | --- |
| Quản trị viên | `admin@pbl3.local` | `admin123` | Xem và cấu hình toàn bộ, xóa lịch sử/cảnh báo, dừng khẩn cấp |
| Vận hành | `operator@pbl3.local` | `operator123` | Theo dõi dashboard, băng tải, lịch sử và cảnh báo theo quyền được cấp |

Đây là tài khoản demo phía trình duyệt, phù hợp cho phát triển và trình diễn. Không dùng cơ chế này làm hệ thống xác thực production nếu chưa thay bằng backend an toàn.

## 4. Quy trình dùng thử nhanh ở chế độ mô phỏng

1. Đăng nhập bằng tài khoản quản trị viên.
2. Trên thanh đầu trang, chọn **Mô phỏng** nếu ứng dụng đang ở chế độ **Máy thật**.
3. Mở trang **Băng Tải**.
4. Nhấn **Khởi động** để chạy băng tải.
5. Nhấn một trong các nút nạp nhanh Coca-Cola, Pepsi, Red Bull hoặc Aquafina để đưa vật mẫu lên băng tải. Có thể dùng **Phôi ngẫu nhiên** để chọn ngẫu nhiên một loại.
6. Theo dõi vật mẫu di chuyển, khay đích, số lượng phân loại và tốc độ.
7. Mở **Tổng Quan**, **Thống Kê** hoặc **Lịch Sử** để xem kết quả.

Ứng dụng **không tự tạo dữ liệu mẫu khi chạy `npm run dev`**. Vì vậy, nếu chưa chạy mô phỏng hoặc chưa bấm nút tạo dữ liệu, lịch sử có thể trống.

## 5. Tạo dữ liệu demo hàng loạt

Trong trang **Băng Tải**, ở chế độ **Mô phỏng**, nhấn **Tạo dữ liệu demo**.

- Ứng dụng sẽ tạo ngẫu nhiên một tập bản ghi phân loại trong khoảng 72 giờ gần nhất.
- Dữ liệu được dùng cho biểu đồ, dashboard và lịch sử.
- Nút này không đưa từng vật thể trực quan lên băng tải; muốn xem vật thể di chuyển, hãy dùng các nút nạp nhanh.
- Nếu không nhấn nút này và cũng chưa chạy mô phỏng, ứng dụng sẽ không có dữ liệu mẫu sẵn.

## 6. Điều khiển băng tải và tốc độ

- **Khởi động / Tạm dừng:** bắt đầu hoặc tạm dừng mô phỏng.
- **DỪNG KHẨN CẤP:** dừng ngay hoạt động mô phỏng; thao tác này yêu cầu quyền phù hợp.
- **Thanh tốc độ:** điều chỉnh từ 10% đến 100%.
- Nhãn phần trăm bên phải thanh trượt luôn hiển thị **giá trị đang chỉnh hiện tại**, kể cả khi băng tải đang dừng hoặc chưa có vật mẫu.
- Mỗi khay có sức chứa giới hạn. Khi khay đầy, mở khay để xem tùy chọn xóa/giải phóng dữ liệu theo quyền người dùng.

## 7. Các trang chính

| Trang | Mục đích |
| --- | --- |
| **Tổng Quan** | Xem KPI, trạng thái hệ thống, năng suất và các cảnh báo nổi bật. |
| **Thống Kê** | Phân tích sản lượng, tỷ lệ phân loại, thương hiệu và xu hướng theo thời gian. |
| **Băng Tải** | Chạy mô phỏng, theo dõi vật mẫu, khay đích và điều chỉnh tốc độ. |
| **Lịch Sử** | Tra cứu, lọc theo thời gian, xem và xuất CSV các bản ghi phân loại. Quản trị viên có thể xóa lịch sử. |
| **Cảnh Báo** | Lọc cảnh báo theo mức độ, xem chi tiết và xuất CSV. Quản trị viên có thể xóa toàn bộ cảnh báo. |
| **Cấu Hình** | Xem/chỉnh sửa cấu hình phân loại và xuất bản cấu hình nếu tài khoản có quyền. |
| **MQTT & IoT** | Kiểm tra kết nối broker, trạng thái thiết bị, telemetry, encoder và phiên bản cấu hình. |
| **Người Dùng** | Quản lý người dùng và quyền khi tài khoản được cấp quyền tương ứng. |

## 8. Chế độ máy thật

Để kết nối thiết bị, sao chép `.env.local.example` thành `.env.local` rồi cập nhật broker MQTT, client ID, device ID và các topic phù hợp với hệ thống. Các biến `NEXT_PUBLIC_*` là cấu hình được dùng ở phía trình duyệt; token Telegram, mật khẩu SMTP và thông tin nhạy cảm không được đưa vào mã nguồn hoặc commit Git.

Trong chế độ **Máy thật**:

- Dữ liệu phải đến từ MQTT/camera và thiết bị đang hoạt động.
- Thanh nút nạp mẫu và nút tạo dữ liệu demo không hiển thị.
- Vào **MQTT & IoT** để kiểm tra kết nối trước khi vận hành.
- Chỉ gửi lệnh điều khiển khi đã xác nhận đúng thiết bị và đúng broker.
- Các giá trị broker mẫu trong `.env.local.example` chỉ dành cho phát triển; production cần broker riêng, TLS và xác thực phù hợp.

## 9. Dữ liệu được lưu ở đâu?

Ở môi trường hiện tại, dữ liệu giao diện được lưu trong `localStorage` của trình duyệt. Dữ liệu mô phỏng và máy thật được tách riêng theo chế độ. Làm mới trang không xóa dữ liệu; dùng chức năng xóa trong **Lịch Sử** hoặc **Cảnh Báo** khi cần dọn dẹp.

Nếu trình duyệt còn dữ liệu cũ từ phiên bản trước, hãy đăng nhập lại, chọn đúng chế độ rồi xóa lịch sử/cảnh báo từ giao diện. Có thể xóa dữ liệu website trong phần Developer Tools của trình duyệt nếu muốn bắt đầu hoàn toàn từ đầu.

## 10. Xử lý lỗi thường gặp

**`npm` hoặc `node` không được nhận diện**

Cài Node.js LTS, đóng rồi mở lại PowerShell và kiểm tra bằng `node -v` và `npm -v`.

**Không mở được trang ở cổng 3000**

Kiểm tra cửa sổ chạy dev server hoặc dùng `npm run dev -- -p 3001`.

**Trang máy thật báo MQTT mất kết nối**

Kiểm tra giá trị trong `.env.local`, broker có cho phép kết nối WebSocket hay không, đúng port/topic hay không và máy tính có truy cập được mạng/broker hay không.

**Không thấy dữ liệu trong biểu đồ hoặc lịch sử**

Ở chế độ mô phỏng, hãy chạy băng tải với nút nạp mẫu hoặc nhấn **Tạo dữ liệu demo**. Ứng dụng được thiết kế để khởi động với dữ liệu trống.

**Không thấy nút nạp mẫu**

Nút này chỉ hiển thị trong **Mô phỏng**. Hãy kiểm tra chế độ ở thanh đầu trang; ở **Máy thật**, nút bị ẩn có chủ ý.

## 11. Lưu ý an toàn

Không dùng mật khẩu demo, broker công khai hoặc thông tin SMTP mẫu trong môi trường production. Khi kết nối phần cứng thật, cần phân quyền theo người dùng, bảo vệ broker bằng TLS/xác thực và kiểm tra nút dừng khẩn cấp trước khi vận hành.

