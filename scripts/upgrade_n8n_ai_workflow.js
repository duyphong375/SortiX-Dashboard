// Script to comprehensively upgrade SortiX-Med AI Copilot workflow in n8n SQLite database
const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');

const DB_PATH = 'C:/Users/Duy Phong/.n8n/database.sqlite';
const WORKFLOW_ID = 'VVREKco30Q8F2wtG';

console.log('--- SORTIX-MED AI COPILOT WORKFLOW UPGRADE ---');

const db = new DatabaseSync(DB_PATH);
const row = db.prepare('SELECT id, name, active, nodes, connections FROM workflow_entity WHERE id = ?').get(WORKFLOW_ID);

if (!row) {
  console.error('Workflow not found with ID:', WORKFLOW_ID);
  process.exit(1);
}

console.log('Found workflow:', row.name, '(Active:', row.active, ')');

let existingNodes = JSON.parse(row.nodes);

// Keep the core 4 nodes (Trigger, Agent, Gemini Model, Memory)
const chatTriggerNode = existingNodes.find(n => n.type === '@n8n/n8n-nodes-langchain.chatTrigger');
const agentNode = existingNodes.find(n => n.type === '@n8n/n8n-nodes-langchain.agent');
const geminiNode = existingNodes.find(n => n.type === '@n8n/n8n-nodes-langchain.lmChatGoogleGemini');
const memNode = existingNodes.find(n => n.type === '@n8n/n8n-nodes-langchain.memoryBufferWindow');

// 1. Upgrade System Message in AI Agent node
const systemMessageText = `Bạn là Kỹ sư Trưởng kiêm Chuyên gia AI Copilot của hệ sinh thái SortiX-Med (Hệ thống phân loại tự động dụng cụ phẫu thuật & chuẩn bị khử trùng phòng mổ - Đề tài PBL3 Kỹ thuật Y sinh & IoT Công nghiệp).

# 0. QUY TẮC BẮT BUỘC: XÁC ĐỊNH CHẾ ĐỘ (MÔ PHỎNG / THỰC TẾ) & ĐỒNG BỘ MÀU KHAY SỐ LIỆU
- QUY TẮC DÒNG ĐẦU TIÊN CỦA CÂU TRẢ LỜI:
  Mỗi câu trả lời của bạn BẮT BUỘC PHẢI BẮT ĐẦU NGAY LẬP TỨC ở DÒNG ĐẦU TIÊN bằng một trong hai thẻ định danh chế độ (dựa vào thông tin context người dùng cung cấp hoặc kết quả trả về từ Tool):
  * Nếu hệ thống đang ở chế độ MÔ PHỎNG (context chứa "[CHẾ ĐỘ MÔ PHỎNG]" hoặc isSimulation = true):
    [CHẾ ĐỘ MÔ PHỎNG - SIMULATION]
  * Nếu hệ thống đang ở chế độ THỰC TẾ (context chứa "[CHẾ ĐỘ THỰC TẾ]" hoặc isSimulation = false):
    [CHẾ ĐỘ THỰC TẾ - REAL HARDWARE]
  * TUYỆT ĐỐI KHÔNG chào hỏi, không thêm bất kỳ ký tự nào trước thẻ này. Thẻ này phải nằm trọn vẹn ở dòng 1 để giao diện Dashboard và Mobile App hiển thị huy hiệu đồng bộ.

- QUY TẮC ĐỒNG BỘ MÀU & TRẠNG THÁI 3 KHAY CHỨA:
  Hệ sinh thái SortiX-Med (Web Dashboard, Mobile App, AI Agent) đồng bộ chuẩn màu 3 cấp độ:
  * 🟢 XANH LÁ (BÌNH THƯỜNG / AN TOÀN): Tỷ lệ lấp đầy < 80%. Khay còn sức chứa tốt, tiếp tục vận hành bình thường.
  * 🟡 VÀNG CAM (CẢNH BÁO GẦN ĐẦY): Tỷ lệ lấp đầy từ 80% đến 99%. Yêu cầu điều dưỡng / kỹ thuật viên chuẩn bị sẵn khay rỗng mới để thay thế.
  * 🔴 ĐỎ (NGUY CẤP / ĐẦY 100%): Khay đạt 100% sức chứa (count = max_capacity). Hệ thống tự động kích hoạt liên động an toàn ngắt dừng băng tải. Cần thay khay rỗng và reset ngay lập tức.
  * Khi trình bày số liệu 3 khay chứa, BẮT BUỘC lập BẢNG MARKDOWN chuẩn có các cột: Khay chứa, Dụng cụ quy định, Số lượng hiện tại / Sức chứa tối đa, Tỷ lệ lấp đầy (%), Trạng thái & Mã màu đồng bộ (🟢/🟡/🔴).

# 1. DANH MỤC DỤNG CỤ PHẪU THUẬT NGOẠI KHOA
- Khay 1 (Bin 1) - Dụng cụ Rạch & Cắt (Cutting & Dissecting Instruments):
  * Kéo phẫu thuật Mayo (Mayo Scissors): Thân dày, lưỡi ngắn chắc chắn, đầu thẳng hoặc cong. Dùng cắt các mô dày chắc (cân cơ, mô mỡ sợi, dây chằng) hoặc cắt chỉ khâu phẫu thuật dày.
  * Kéo phẫu thuật Metzenbaum: Thân thon dài, cán dài gấp 2-3 lần lưỡi, đầu tù hoặc hơi cong. Chuyên dùng bóc tách các mô tinh tế, phẫu tích mạch máu, thần kinh và màng nội tạng.
  * Cán dao mổ số 3 (Scalpel Handle #3): Cán mảnh, lắp các lưỡi dao số 10 (rạch da thông thường), số 11 (đầu nhọn rạch dẫn lưu, phẫu thuật mạch máu), số 15 (lưỡi nhỏ vi phẫu, thẩm mỹ).
  * Cán dao mổ số 4 (Scalpel Handle #4): Cán to rộng, lắp các lưỡi dao số 20, 21, 22, 23 dùng cho đường rạch lớn mô dày ở bụng, ngực.
- Khay 2 (Bin 2) - Dụng cụ Kẹp giữ & Cầm máu (Clamping & Occluding Instruments):
  * Kẹp panh cầm máu Kelly (Kelly Forceps): Khía răng ngang chiếm 1/2 chiều dài mỏ kẹp, dùng kẹp giữ mô hoặc mạch máu kích thước trung bình.
  * Kẹp Crile / Pean: Răng ngang chạy suốt chiều dài mỏ kẹp, kiểm soát cầm máu chắc chắn.
  * Kẹp Halsted Mosquito (Kẹp muỗi): Mỏ kẹp siêu nhỏ nhọn tinh vi, dùng cầm máu vi mạch trong vi phẫu hoặc phẫu thuật nhi khoa.
  * Kẹp Allis: Đầu mỏ kẹp có nhiều răng đan xen, dùng giữ mô ruột, màng cân chắc chắn mà không gây dập nát thiếu máu cục bộ.
  * Kẹp phẫu tích có mấu / không mấu (Thumb/Tissue Forceps): Dùng kẹp giữ mép mô và da trong quá trình khâu đóng vết mổ.
- Khay 3 (Bin 3) - Khay Xử lý lại & Dụng cụ Đặc biệt (Default / Reprocess Bin):
  * Tiếp nhận các dụng cụ đặc thù hoặc các dụng cụ có độ tin cậy AI dưới ngưỡng (cần nhân viên CSSD kiểm tra thủ công bằng mắt) trước khi xếp vào giỏ tiệt trùng.

# 2. QUY TRÌNH KHỬ KHUẨN & TIỆT TRÙNG PHÒNG MỔ (CSSD)
- Quy trình 4 khâu CSSD chuẩn quốc tế:
  1. Tiếp nhận & Phân loại sơ bộ: Tách biệt ngay khi rời phòng mổ để tránh tổn thương nhân viên y tế và không làm hỏng lưỡi cắt.
  2. Làm sạch & Khử nhiễm: Ngâm dung dịch enzyme phân giải protein máu, rửa bể sóng siêu âm (Ultrasonic cleaner) làm sạch các khe khớp hộp (box-lock).
  3. Kiểm tra, Đóng gói & Xếp khay: Xếp dụng cụ vào khay lưới inox có lót thảm silicon (silicone pin mat), gắn chỉ thị hoá học Class 5/6, bọc vải không dệt hoặc hộp tiệt trùng chuyên dụng.
  4. Tiệt trùng: Hấp nhiệt ẩm áp suất cao bằng nồi hấp Autoclave tại 121°C trong 30 phút hoặc 134°C trong 15 phút; kiểm tra chỉ thị sinh học (Spore test).
- Quy tắc an toàn khay chứa:
  * Khi khay đạt >= 80% sức chứa định mức: Phát cảnh báo nhắc nhở kỹ thuật viên chuẩn bị khay rỗng mới.
  * Khi khay đầy 100%: Hệ thống tự động kích hoạt ngắt an toàn dừng băng tải để tránh tràn dụng cụ.
  * Thao tác thay khay an toàn: Nhấc nhẹ nhàng, đặt lên xe đẩy có lót đệm. Đặt khay mới đúng vị trí cữ. Tuyệt đối không quăng ném hoặc xếp chồng dao kéo lên đầu kẹp vi phẫu tránh mẻ lưỡi hoặc cong vênh mỏ kẹp.

# 3. KIẾN TRÚC PHẦN CỨNG & CƠ CHẾ AN TOÀN LIÊN ĐỘNG (INTERLOCKS)
- Vi điều khiển trung tâm ESP32: Dual Core, điều khiển động cơ băng tải và cơ cấu gạt phân loại, truyền telemetry thời gian thực qua giao thức MQTT.
- Cảm biến nhiệt độ DS18B20:
  * Giám sát liên tục nhiệt độ bo mạch điều khiển và driver động cơ:
  * 🟢 < 60°C: Bình thường (Normal).
  * 🟡 60°C - 75°C: Cảnh báo nhiệt độ ấm (Warm Warning) - Cần kiểm tra quạt thông gió tủ điện.
  * 🔴 >= 75°C: Quá nhiệt nguy cấp (Overheat Critical) - Nguy cơ hư hỏng linh kiện bán dẫn, sai lệch xung PWM, mất an toàn cháy nổ; Hệ thống kích hoạt Interlock dừng ngay băng tải.
- Cảm biến quang học #02 Zone A & Cơ chế Jam Detection:
  * Cảm biến hồng ngoại phát hiện vật thể. Nếu tín hiệu bị che khuất liên tục quá 5 giây (jam_duration > 5s), hệ thống xác định kẹt phôi và tự dừng băng tải để tránh va xô làm biến dạng dụng cụ.
- Nút dừng khẩn cấp E-Stop:
  * Khi bị nhấn cơ học, ngắt tức thì nguồn động lực và chuyển hệ thống sang trạng thái SYSTEM_LOCKED.
- Quy trình 4 bước xử lý sự cố & Mở khóa an toàn (4-Step Recovery Protocol):
  * Bước 1 (Xác định & Cách ly): Kiểm tra cờ cảm biến (E-Stop, kẹt phôi Zone A, khay đầy hay quá nhiệt DS18B20).
  * Bước 2 (Xử lý hiện trường): Xoay nhả nút E-Stop theo chiều mũi tên HOẶC dùng kẹp vô trùng gắp dụng cụ bị kẹt HOẶC thay thế khay mới.
  * Bước 3 (Kiểm tra an toàn): Đảm bảo nhiệt độ DS18B20 < 75°C và cảm biến quang #02 đã thông thoáng.
  * Bước 4 (Mở khóa hệ thống): Kỹ sư/Quản trị viên thực hiện lệnh "Mở khóa hệ thống" (Safety Unlock) trên Dashboard để tái kích hoạt băng tải.

# 4. DANH SÁCH TOOLS HỖ TRỢ VÀ NGUYÊN TẮC VẬN HÀNH
Hệ thống cung cấp cho bạn 8 Tools chuyên dụng:
1. Tool: Khay_Chua_Realtime - Đọc số lượng hiện tại, sức chứa, tỷ lệ lấp đầy (%), chế độ vận hành (isSimulation) và mã màu đồng bộ (🟢/🟡/🔴) của 3 khay chứa.
2. Tool: Thong_Ke_Phan_Loai - Đọc tổng sản lượng và số lượng chi tiết từng nhóm kéo, kẹp panh, dao mổ, lỗi.
3. Tool: Cam_Bien_DS18B20 - Đọc nhiệt độ DS18B20 (°C), chế độ vận hành (isSimulation), trạng thái động cơ (isRunning, tốc độ) và cảm biến kẹt phôi.
4. Tool: An_Toan_He_Thong - Đọc chi tiết cờ khóa hệ thống, cờ E-Stop và nguyên nhân sự cố.
5. Tool: Lich_Su_Phan_Loai - Đọc danh sách các lượt phân loại dụng cụ gần nhất kèm độ tin cậy AI.
6. Tool: Cau_Hinh_He_Thong - Đọc cấu hình chế độ vận hành (mode), tốc độ định mức và các ngưỡng an toàn.
7. Tool: Lich_Su_Canh_Bao - Đọc danh sách các thông báo cảnh báo và sự cố an toàn gần đây.
8. Tool: Gui_Bao_Cao_Telegram - BẮT BUỘC gọi Tool này khi người dùng yêu cầu gửi báo cáo qua Telegram, gửi tin nhắn cảnh báo tới Telegram hoặc báo cáo cho kỹ sư/bác sĩ trực.

- NGUYÊN TẮC BẤT BIẾN: LUÔN LUÔN gọi Tool tương ứng để kiểm tra dữ liệu thực tế từ hệ thống trước khi trả lời. TUYỆT ĐỐI KHÔNG tự suy diễn hoặc bịa đặt số liệu.
- Định dạng Bảng Biểu: Khi trả lời có số liệu về 3 khay chứa, thống kê phân loại, danh mục dụng cụ, BẮT BUỘC dùng bảng Markdown chuẩn (Standard Markdown Table) có hàng tiêu đề, hàng gạch ngăn cách |:---|:---| và dữ liệu căn chỉnh ngay ngắn, cân đối.
- Biểu tượng trực quan: Sử dụng 🟢 Bình thường, 🟡 Cảnh báo, 🔴 Sự cố, ⚙️ Vận hành, 📊 Thống kê, 🏥 CSSD.`;

agentNode.parameters = agentNode.parameters || {};
agentNode.parameters.options = agentNode.parameters.options || {};
agentNode.parameters.options.systemMessage = systemMessageText;
console.log('Updated AI Agent system message.');

// 2. Upgrade Window Buffer Memory
memNode.parameters = memNode.parameters || {};
memNode.parameters.contextWindowLength = 15;
console.log('Updated Window Buffer Memory contextWindowLength to 15.');

// 3. Define 8 standard Tools with clean alphanumeric names
const toolsList = [
  {
    name: 'Tool: Khay_Chua_Realtime',
    id: 'f44bf987-eddf-48e4-ab4e-5f0389df8f61',
    position: [176, 96],
    parameters: {
      url: 'http://localhost:5000/api/bins',
      toolDescription: 'Lấy số lượng dụng cụ thực tế hiện tại trong 3 khay chứa (Khay 1: Kéo phẫu thuật, Khay 2: Kẹp panh cầm máu, Khay 3: Cán dao mổ), sức chứa định mức tối đa (max_capacity), tỷ lệ lấp đầy (%) và trạng thái của từng khay.',
      description: 'Lấy số lượng dụng cụ thực tế hiện tại trong 3 khay chứa (Khay 1: Kéo phẫu thuật, Khay 2: Kẹp panh cầm máu, Khay 3: Cán dao mổ), sức chứa định mức tối đa (max_capacity), tỷ lệ lấp đầy (%) và trạng thái của từng khay.'
    }
  },
  {
    name: 'Tool: Thong_Ke_Phan_Loai',
    id: 'cb7f0bfc-72bf-4826-a23f-9a83042240eb',
    position: [336, 96],
    parameters: {
      url: 'http://localhost:5000/api/stats',
      toolDescription: 'Lấy tổng sản lượng ca phân loại và số lượng chi tiết theo từng nhóm dụng cụ phẫu thuật (kéo phẫu thuật, kẹp panh cầm máu, cán dao mổ, lỗi/không xác định), tỷ lệ phân loại chính xác (%) và độ tin cậy AI trung bình.',
      description: 'Lấy tổng sản lượng ca phân loại và số lượng chi tiết theo từng nhóm dụng cụ phẫu thuật (kéo phẫu thuật, kẹp panh cầm máu, cán dao mổ, lỗi/không xác định), tỷ lệ phân loại chính xác (%) và độ tin cậy AI trung bình.'
    }
  },
  {
    name: 'Tool: Cam_Bien_DS18B20',
    id: '3aed0a6d-60ec-4176-8eff-76da36a8f68a',
    position: [480, 96],
    parameters: {
      url: 'http://localhost:5000/api/telemetry',
      toolDescription: 'Lấy dữ liệu telemetry phần cứng thời gian thực: Nhiệt độ bo mạch điều khiển ESP32 đo bằng cảm biến DS18B20 (°C), ngưỡng cảnh báo an toàn 75°C, trạng thái động cơ băng tải (isRunning, tốc độ) và cảm biến quang học #02 Zone A phát hiện kẹt phôi.',
      description: 'Lấy dữ liệu telemetry phần cứng thời gian thực: Nhiệt độ bo mạch điều khiển ESP32 đo bằng cảm biến DS18B20 (°C), ngưỡng cảnh báo an toàn 75°C, trạng thái động cơ băng tải (isRunning, tốc độ) và cảm biến quang học #02 Zone A phát hiện kẹt phôi.'
    }
  },
  {
    name: 'Tool: An_Toan_He_Thong',
    id: '16c64839-a4d1-4058-a053-1a772ce5af16',
    position: [624, 96],
    parameters: {
      url: 'http://localhost:5000/api/safety/status',
      toolDescription: 'Lấy tình trạng an toàn chi tiết của hệ thống: Cờ khóa khẩn cấp (SYSTEM_LOCKED / OPERATIONAL), nguyên nhân khóa (E-Stop, kẹt phôi Zone A > 5s, đầy khay 100%, quá nhiệt DS18B20), trạng thái cảm biến quang học.',
      description: 'Lấy tình trạng an toàn chi tiết của hệ thống: Cờ khóa khẩn cấp (SYSTEM_LOCKED / OPERATIONAL), nguyên nhân khóa (E-Stop, kẹt phôi Zone A > 5s, đầy khay 100%, quá nhiệt DS18B20), trạng thái cảm biến quang học.'
    }
  },
  {
    name: 'Tool: Lich_Su_Phan_Loai',
    id: '139c5e63-66df-4cef-94c8-485cc12cdee2',
    position: [784, 96],
    parameters: {
      url: 'http://localhost:5000/api/history?limit=10',
      toolDescription: 'Lấy danh sách các lượt phân loại dụng cụ phẫu thuật gần nhất: Tên dụng cụ, nhãn AI dự đoán (label), độ tin cậy nhận diện (confidence score), khay đích (bin destination) và dấu thời gian phân loại.',
      description: 'Lấy danh sách các lượt phân loại dụng cụ phẫu thuật gần nhất: Tên dụng cụ, nhãn AI dự đoán (label), độ tin cậy nhận diện (confidence score), khay đích (bin destination) và dấu thời gian phân loại.'
    }
  },
  {
    name: 'Tool: Cau_Hinh_He_Thong',
    id: '2a8e41bf-5249-43c2-a89c-d27e997f6c31',
    position: [944, 96],
    parameters: {
      url: 'http://localhost:5000/api/config',
      toolDescription: 'Lấy cấu hình vận hành và các ngưỡng an toàn của hệ thống SortiX-Med: Chế độ phân loại (mode: auto/manual/semi-auto), tốc độ băng tải định mức (conveyorSpeed), ngưỡng nhiệt độ cảnh báo DS18B20 (warning/critical 75°C), cấu hình broker MQTT và thông số cài đặt.',
      description: 'Lấy cấu hình vận hành và các ngưỡng an toàn của hệ thống SortiX-Med: Chế độ phân loại (mode: auto/manual/semi-auto), tốc độ băng tải định mức (conveyorSpeed), ngưỡng nhiệt độ cảnh báo DS18B20 (warning/critical 75°C), cấu hình broker MQTT và thông số cài đặt.'
    }
  },
  {
    name: 'Tool: Lich_Su_Canh_Bao',
    id: '3b9f52c0-635a-44d3-b9ad-e38f008a7d42',
    position: [1104, 96],
    parameters: {
      url: 'http://localhost:5000/api/notifications',
      toolDescription: 'Lấy danh sách các thông báo cảnh báo và sự cố an toàn gần đây của hệ thống: Các sự kiện nhấn E-Stop, cảnh báo kẹt phôi Zone A, cảnh báo khay đầy, cảnh báo nhiệt độ cao và trạng thái xử lý.',
      description: 'Lấy danh sách các thông báo cảnh báo và sự cố an toàn gần đây của hệ thống: Các sự kiện nhấn E-Stop, cảnh báo kẹt phôi Zone A, cảnh báo khay đầy, cảnh báo nhiệt độ cao và trạng thái xử lý.'
    }
  },
  {
    name: 'Tool: Gui_Bao_Cao_Telegram',
    id: '4c0a63d1-746b-45e4-ca0e-f490119b8e53',
    position: [1264, 96],
    parameters: {
      url: 'http://localhost:5000/api/chat/telegram?text={text}&title={title}',
      toolDescription: 'Gửi trực tiếp báo cáo ca trực, tổng kết số liệu phân loại dụng cụ hoặc cảnh báo sự cố khẩn cấp tới nhóm Telegram của Kỹ sư và Điều dưỡng phụ trách khi người dùng yêu cầu gửi báo cáo qua Telegram.',
      description: 'Gửi trực tiếp báo cáo ca trực, tổng kết số liệu phân loại dụng cụ hoặc cảnh báo sự cố khẩn cấp tới nhóm Telegram của Kỹ sư và Điều dưỡng phụ trách khi người dùng yêu cầu gửi báo cáo qua Telegram.',
      placeholderDefinitions: {
        values: [
          {
            name: 'text',
            description: 'Nội dung báo cáo hoặc cảnh báo chi tiết cần gửi qua Telegram',
            type: 'string'
          },
          {
            name: 'title',
            description: 'Tiêu đề ngắn gọn của báo cáo (ví dụ: BÁO CÁO PHÂN LOẠI CSSD, SỰ CỐ DỪNG KHẨN CẤP)',
            type: 'string'
          }
        ]
      }
    }
  }
];

// Rebuild nodes list
const finalNodes = [
  chatTriggerNode,
  agentNode,
  geminiNode,
  memNode
];

// Rebuild connections object
const finalConnections = {
  [chatTriggerNode.name]: {
    main: [
      [
        {
          node: agentNode.name,
          type: 'main',
          index: 0
        }
      ]
    ]
  },
  [geminiNode.name]: {
    ai_languageModel: [
      [
        {
          node: agentNode.name,
          type: 'ai_languageModel',
          index: 0
        }
      ]
    ]
  },
  [memNode.name]: {
    ai_memory: [
      [
        {
          node: agentNode.name,
          type: 'ai_memory',
          index: 0
        }
      ]
    ]
  }
};

for (const t of toolsList) {
  finalNodes.push({
    parameters: t.parameters,
    type: '@n8n/n8n-nodes-langchain.toolHttpRequest',
    typeVersion: 1.1,
    position: t.position,
    id: t.id,
    name: t.name
  });

  finalConnections[t.name] = {
    ai_tool: [
      [
        {
          node: agentNode.name,
          type: 'ai_tool',
          index: 0
        }
      ]
    ]
  };
}

// 4. Update workflow_entity in SQLite
const updateStmt = db.prepare("UPDATE workflow_entity SET nodes = ?, connections = ?, updatedAt = datetime('now') WHERE id = ?");
updateStmt.run(JSON.stringify(finalNodes), JSON.stringify(finalConnections), WORKFLOW_ID);

console.log('Successfully updated workflow in database!');
console.log('Total nodes:', finalNodes.length);
finalNodes.forEach((n, idx) => console.log(' [Node ' + idx + ']', n.name, '(' + n.type + ')'));
