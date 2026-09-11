// Bộ điều khiển dashboard hệ thống phân loại IoT
// Tương thích kiến trúc MQTT & JSON quy định tại PROJECT_PLAN.md

let configVersion = 1;
let mqttClient = null;
let isRunning = true;
let isSimulation = true;
let conveyorSpeed = 65; // %
let stats = {
  bin1: 0,
  bin2: 0,
  bin3: 0,
  total: 0
};

// Các phần tử giao diện
const mcuStatusText = document.getElementById('mcu-status-text');
const mcuDot = document.getElementById('mcu-dot');
const mqttStatusText = document.getElementById('mqtt-status-text');
const mqttDot = document.getElementById('mqtt-dot');
const simToggle = document.getElementById('sim-toggle');

const selectBin1 = document.getElementById('select-bin-1');
const selectBin2 = document.getElementById('select-bin-2');
const btnSwap = document.getElementById('btn-swap');
const btnSaveConfig = document.getElementById('btn-save-config');
const applyStatusMsg = document.getElementById('apply-status-msg');
const jsonPreview = document.getElementById('json-preview');
const cfgVersionNum = document.getElementById('cfg-version-num');

const countBin1 = document.getElementById('count-bin-1');
const countBin2 = document.getElementById('count-bin-2');
const countBin3 = document.getElementById('count-bin-3');
const statTotal = document.getElementById('stat-total');
const statUptime = document.getElementById('stat-uptime');
const btnResetStats = document.getElementById('btn-reset-stats');

const conveyorBelt = document.getElementById('conveyor-belt');
const conveyorBadge = document.getElementById('conveyor-badge');
const btnStart = document.getElementById('btn-start');
const btnPause = document.getElementById('btn-pause');
const btnStop = document.getElementById('btn-stop');
const speedSlider = document.getElementById('speed-slider');
const speedVal = document.getElementById('speed-val');
const itemsLayer = document.getElementById('items-layer');
const arm1 = document.getElementById('arm-1');
const arm2 = document.getElementById('arm-2');

const cardS1 = document.getElementById('card-s1');
const valS1 = document.getElementById('val-s1');
const cardS2 = document.getElementById('card-s2');
const valS2 = document.getElementById('val-s2');
const cardS3 = document.getElementById('card-s3');
const valS3 = document.getElementById('val-s3');
const cardEstop = document.getElementById('card-estop');
const valEstop = document.getElementById('val-estop');

const eventLogList = document.getElementById('event-log-list');
const btnClearLog = document.getElementById('btn-clear-log');

// Hộp thoại cài đặt
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const btnCloseModal = document.getElementById('btn-close-modal');
const btnModalCancel = document.getElementById('btn-modal-cancel');
const btnModalSave = document.getElementById('btn-modal-save');
const mqttUrlInput = document.getElementById('mqtt-url');

// 1. Khởi tạo & Tạo Payload JSON cấu hình chuẩn Mục 3.1
function generateConfigJSON() {
  const b1 = selectBin1.value;
  const b2 = selectBin2.value;

  const config = {
    schema_version: 1,
    config_version: configVersion,
    device_id: "sorter_01",
    catalog_version: "catalog_01",
    bins: [
      { bin_id: 1, brand_ids: b1 !== "none" ? [b1] : [] },
      { bin_id: 2, brand_ids: b2 !== "none" ? [b2] : [] }
    ],
    default_bin: 3,
    apply_mode: "when_line_empty",
    timestamp: new Date().toISOString()
  };

  jsonPreview.textContent = JSON.stringify(config, null, 2);
  cfgVersionNum.textContent = `v${configVersion}`;
  return config;
}

// Cập nhật khi thay đổi hộp chọn
selectBin1.addEventListener('change', () => {
  if (selectBin1.value !== 'none' && selectBin1.value === selectBin2.value) {
    alert("Cảnh báo: Không được gán cùng một thương hiệu vào cả Khay 1 và Khay 2!");
    selectBin1.value = 'none';
  }
  generateConfigJSON();
});

selectBin2.addEventListener('change', () => {
  if (selectBin2.value !== 'none' && selectBin2.value === selectBin1.value) {
    alert("Cảnh báo: Không được gán cùng một thương hiệu vào cả Khay 1 và Khay 2!");
    selectBin2.value = 'none';
  }
  generateConfigJSON();
});

// Nút Hoán Đổi Nhanh Khay 1 <-> Khay 2
btnSwap.addEventListener('click', () => {
  const temp = selectBin1.value;
  selectBin1.value = selectBin2.value;
  selectBin2.value = temp;
  generateConfigJSON();
  logEvent('INFO', 'Đã hoán đổi cấu hình gán thương hiệu giữa Khay 1 và Khay 2.');
});

// Nút Lưu & Gửi Cấu Hình qua MQTT
btnSaveConfig.addEventListener('click', () => {
  configVersion++;
  const payload = generateConfigJSON();
  applyStatusMsg.textContent = "Đang gửi cấu hình...";
  applyStatusMsg.style.color = "#f59e0b";

  if (mqttClient && mqttClient.connected) {
    const topic = document.getElementById('mqtt-topic-config').value.trim();
    mqttClient.publish(topic, JSON.stringify(payload), { qos: 1 }, (err) => {
      if (!err) {
        applyStatusMsg.textContent = `Đã gửi v${configVersion} (Chờ ESP32 xác nhận)`;
        applyStatusMsg.style.color = "#60a5fa";
        logEvent('INFO', `Đã xuất bản cấu hình v${configVersion} tới topic ${topic}`);
      } else {
        applyStatusMsg.textContent = "Lỗi gửi MQTT!";
        applyStatusMsg.style.color = "#ef4444";
        logEvent('DANGER', `Lỗi xuất bản MQTT: ${err.message}`);
      }
    });
  } else {
    // Chế độ mô phỏng
    setTimeout(() => {
      applyStatusMsg.textContent = `Đã áp dụng v${configVersion} (Giả lập)`;
      applyStatusMsg.style.color = "#34d399";
      logEvent('INFO', `[MÔ PHỎNG] ESP32-C5 đã chấp nhận và áp dụng cấu hình v${configVersion}`);
    }, 600);
  }
});

// 2. Kết nối MQTT qua WebSocket
function connectMQTT() {
  const url = mqttUrlInput.value.trim();
  logEvent('INFO', `Đang kết nối MQTT WebSocket: ${url}...`);

  try {
    mqttClient = mqtt.connect(url, {
      clientId: 'dashboard_' + Math.random().toString(16).substr(2, 8),
      clean: true,
      connectTimeout: 4000
    });

    mqttClient.on('connect', () => {
      mqttStatusText.textContent = "ĐÃ KẾT NỐI";
      mqttDot.className = "dot dot-online";
      logEvent('INFO', 'Đã kết nối thành công với MQTT broker.');

      // Đăng ký các topic giám sát
      const statusTopic = document.getElementById('mqtt-topic-status').value.trim();
      const visionTopic = document.getElementById('mqtt-topic-vision').value.trim();
      mqttClient.subscribe([statusTopic, visionTopic, "sorter/sorter_01/config/status"]);
    });

    mqttClient.on('message', (topic, message) => {
      handleIncomingMQTT(topic, message.toString());
    });

    mqttClient.on('error', (err) => {
      mqttStatusText.textContent = "LỖI";
      mqttDot.className = "dot dot-offline";
      logEvent('DANGER', `Lỗi MQTT: ${err.message}`);
    });

    mqttClient.on('close', () => {
      mqttStatusText.textContent = "ĐÃ NGẮT KẾT NỐI";
      mqttDot.className = "dot dot-offline";
    });
  } catch (e) {
    logEvent('DANGER', `Không thể khởi tạo MQTT: ${e.message}`);
  }
}

// Xử lý gói tin nhận từ MQTT
function handleIncomingMQTT(topic, msgText) {
  try {
    const data = JSON.parse(msgText);
    
    // 1. Trạng thái ESP32
    if (topic.includes('status')) {
      mcuStatusText.textContent = data.online ? "TRỰC TUYẾN" : "NGOẠI TUYẾN";
      mcuDot.className = data.online ? "dot dot-online" : "dot dot-offline";
      if (data.uptime) statUptime.textContent = formatUptime(data.uptime);
    }

    // 2. Xác nhận cấu hình từ ESP32
    if (topic.includes('config/status')) {
      if (data.status === 'applied') {
        applyStatusMsg.textContent = `ESP32 đã áp dụng v${data.config_version}`;
        applyStatusMsg.style.color = "#34d399";
        logEvent('INFO', `ESP32 xác nhận áp dụng cấu hình v${data.config_version} thành công.`);
      }
    }

    // 3. Kết quả nhận diện từ Camera YOLO
    if (topic.includes('vision')) {
      logEvent('INFO', `Camera nhận diện: ${data.brand_id} (Độ tin cậy: ${(data.confidence * 100).toFixed(1)}%)`);
      if (!isSimulation) {
        spawnPackage(data.brand_id, data.product_id);
      }
    }
  } catch (e) {
    console.log("MQTT không phải JSON:", msgText);
  }
}

// 3. Bộ mô phỏng băng tải và sản phẩm
const BRAND_DATA = {
  brand_c: { name: 'Coca-Cola', code: 'C', class: 'box-brand_c' },
  brand_a: { name: 'Pepsi', code: 'P', class: 'box-brand_a' },
  brand_b: { name: 'Red Bull', code: 'RB', class: 'box-brand_b' },
  brand_d: { name: 'Aquafina', code: 'AQ', class: 'box-brand_d' }
};

const BRAND_KEYS = Object.keys(BRAND_DATA);
let activeItems = [];
let simInterval = null;
let uptimeSeconds = 0;

function startSimulation() {
  if (simInterval) clearInterval(simInterval);
  simInterval = setInterval(() => {
    if (isRunning && isSimulation) {
      // Xác suất tạo sản phẩm ngẫu nhiên
      if (Math.random() < 0.45) {
        const randBrand = BRAND_KEYS[Math.floor(Math.random() * BRAND_KEYS.length)];
        const randId = 'sp_' + Math.floor(100 + Math.random() * 900);
        spawnPackage(randBrand, randId);
      }
    }
    // Cập nhật thời gian hoạt động
    uptimeSeconds++;
    statUptime.textContent = formatUptime(uptimeSeconds);
  }, 2200);
}

function spawnPackage(brandKey, productId) {
  const brand = BRAND_DATA[brandKey] || { name: brandKey, code: '?', class: 'box-brand_c' };
  
  const el = document.createElement('div');
  el.className = `box-item ${brand.class}`;
  el.textContent = brand.code;
  el.title = `${brand.name} (#${productId})`;
  el.style.left = '0%';
  itemsLayer.appendChild(el);

  const item = {
    id: productId,
    brandKey: brandKey,
    el: el,
    progress: 0, // Từ 0% đến 100%
    sorted: false
  };

  activeItems.push(item);

  // Kích cảm biến 1
  setSensor(cardS1, valS1, true, `Phát hiện: ${brand.name}`);
  setTimeout(() => setSensor(cardS1, valS1, false, "Thông thoáng"), 600);
}

// Vòng lặp chuyển động mượt (60 FPS)
function animationLoop() {
  if (isRunning) {
    const speedFactor = (conveyorSpeed / 100) * 0.45;

    for (let i = activeItems.length - 1; i >= 0; i--) {
      const item = activeItems[i];
      item.progress += speedFactor;
      item.el.style.left = `${item.progress}%`;

      const targetBin = getTargetBin(item.brandKey);

      // Điểm đến cảm biến 2 (trước khay 1 - khoảng 45%)
      if (item.progress >= 42 && item.progress <= 47 && !item.s2Triggered) {
        item.s2Triggered = true;
        setSensor(cardS2, valS2, true, `Phôi ${item.id}`);
        setTimeout(() => setSensor(cardS2, valS2, false, "Thông thoáng"), 400);

        if (targetBin === 1) {
          // Kích hoạt tay gạt 1
          arm1.classList.add('active');
          setTimeout(() => arm1.classList.remove('active'), 500);
          sortIntoBin(item, 1, i);
          continue;
        }
      }

      // Điểm đến cảm biến 3 (trước khay 2 - khoảng 70%)
      if (item.progress >= 67 && item.progress <= 72 && !item.s3Triggered) {
        item.s3Triggered = true;
        setSensor(cardS3, valS3, true, `Phôi ${item.id}`);
        setTimeout(() => setSensor(cardS3, valS3, false, "Thông thoáng"), 400);

        if (targetBin === 2) {
          // Kích hoạt tay gạt 2
          arm2.classList.add('active');
          setTimeout(() => arm2.classList.remove('active'), 500);
          sortIntoBin(item, 2, i);
          continue;
        }
      }

      // Điểm cuối: khay 3 (đi thẳng - trên 95%)
      if (item.progress >= 95) {
        sortIntoBin(item, 3, i);
      }
    }
  }

  requestAnimationFrame(animationLoop);
}

function getTargetBin(brandKey) {
  if (selectBin1.value === brandKey) return 1;
  if (selectBin2.value === brandKey) return 2;
  return 3; // Khay mặc định
}

function sortIntoBin(item, binNum, index) {
  item.sorted = true;
  activeItems.splice(index, 1);

  // Hiệu ứng sản phẩm rơi vào khay
  item.el.style.transition = 'transform 0.4s ease-in, opacity 0.4s';
  item.el.style.transform = 'translateY(60px) scale(0.6)';
  item.el.style.opacity = '0';
  setTimeout(() => item.el.remove(), 400);

  // Cộng bộ đếm
  stats['bin' + binNum]++;
  stats.total++;

  countBin1.textContent = `${stats.bin1} SP`;
  countBin2.textContent = `${stats.bin2} SP`;
  countBin3.textContent = `${stats.bin3} SP`;
  statTotal.textContent = stats.total;

  const brandName = BRAND_DATA[item.brandKey]?.name || item.brandKey;
  logEvent('INFO', `Sản phẩm [${brandName}] đã được phân loại vào Khay ${binNum}`);
}

function setSensor(card, valText, active, text) {
  if (active) {
    card.classList.add('active');
    valText.textContent = text;
    valText.style.color = "#34d399";
  } else {
    card.classList.remove('active');
    valText.textContent = text;
    valText.style.color = "#e5e7eb";
  }
}

// 4. Các nút điều khiển băng tải
btnStart.addEventListener('click', () => {
  isRunning = true;
  conveyorBelt.classList.remove('paused');
  conveyorBadge.textContent = "Đang chạy";
  conveyorBadge.className = "badge badge-pulse";
  logEvent('INFO', 'Lệnh điều khiển: khởi động băng tải.');
});

btnPause.addEventListener('click', () => {
  isRunning = false;
  conveyorBelt.classList.add('paused');
  conveyorBadge.textContent = "Tạm dừng";
  conveyorBadge.className = "badge";
  conveyorBadge.style.background = "rgba(245, 158, 11, 0.2)";
  conveyorBadge.style.color = "#fbbf24";
  logEvent('WARN', 'Lệnh điều khiển: tạm dừng băng tải.');
});

btnStop.addEventListener('click', () => {
  isRunning = false;
  conveyorBelt.classList.add('paused');
  conveyorBadge.textContent = "Đã dừng";
  conveyorBadge.className = "badge";
  conveyorBadge.style.background = "rgba(239, 68, 68, 0.2)";
  conveyorBadge.style.color = "#f87171";
  logEvent('DANGER', 'Lệnh điều khiển: dừng băng tải.');
});

speedSlider.addEventListener('input', (e) => {
  conveyorSpeed = parseInt(e.target.value);
  speedVal.textContent = `${conveyorSpeed}%`;
  const animDuration = (100 / Math.max(conveyorSpeed, 10)) * 0.8;
  conveyorBelt.style.animationDuration = `${animDuration}s`;
});

btnResetStats.addEventListener('click', () => {
  stats = { bin1: 0, bin2: 0, bin3: 0, total: 0 };
  countBin1.textContent = "0 SP";
  countBin2.textContent = "0 SP";
  countBin3.textContent = "0 SP";
  statTotal.textContent = "0";
  logEvent('INFO', 'Đã đặt lại số đếm thống kê các khay.');
});

// Ghi nhật ký sự kiện
function logEvent(type, message) {
  const item = document.createElement('div');
  const now = new Date();
  const timeStr = now.toTimeString().split(' ')[0];

  let tagClass = 'log-info';
  if (type === 'WARN') tagClass = 'log-warn';
  if (type === 'DANGER') tagClass = 'log-danger';

  item.className = `log-item ${tagClass}`;
  const nhanLoai = type === 'WARN' ? 'CẢNH BÁO' : type === 'DANGER' ? 'NGUY HIỂM' : 'THÔNG TIN';
  item.innerHTML = `
    <span class="log-time">${timeStr}</span>
    <span class="log-tag">${nhanLoai}</span>
    <span class="log-text">${message}</span>
  `;

  eventLogList.prepend(item);
  while (eventLogList.children.length > 30) {
    eventLogList.lastElementChild.remove();
  }
}

btnClearLog.addEventListener('click', () => {
  eventLogList.innerHTML = '';
});

// Hộp thoại cài đặt
settingsBtn.addEventListener('click', () => settingsModal.classList.add('open'));
btnCloseModal.addEventListener('click', () => settingsModal.classList.remove('open'));
btnModalCancel.addEventListener('click', () => settingsModal.classList.remove('open'));
btnModalSave.addEventListener('click', () => {
  settingsModal.classList.remove('open');
  connectMQTT();
});

// Hàm hỗ trợ
function formatUptime(sec) {
  const h = Math.floor(sec / 3600).toString().padStart(2, '0');
  const m = Math.floor((sec % 3600) / 60).toString().padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

// Khởi chạy khi load trang
generateConfigJSON();
startSimulation();
requestAnimationFrame(animationLoop);
connectMQTT();
