// Tiện ích xuất dữ liệu ra file Excel / CSV (kèm UTF-8 BOM hiển thị chuẩn tiếng Việt)
import { ClassificationRecord, AlertEvent } from "./types";

export function exportClassificationToCSV(
  records: ClassificationRecord[],
  filename = "SortiX_LichSu_ToanBo.csv"
): boolean {
  if (!records || records.length === 0) {
    return false;
  }

  // Nhóm và tính toán số thứ tự theo từng ngày (#1, #2, #3...)
  // Sắp xếp theo thời gian tăng dần để đánh số thứ tự chuẩn xác cho từng ngày
  const sorted = [...records].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const dayCounters: Record<string, number> = {};
  const recordDaySeq: Record<string, number> = {};

  for (const r of sorted) {
    const dKey = r.timestamp ? r.timestamp.slice(0, 10) : "unknown";
    dayCounters[dKey] = (dayCounters[dKey] || 0) + 1;
    recordDaySeq[r.id] = dayCounters[dKey];
  }

  const headers = [
    "STT",
    "Mã Sản Phẩm",
    "Ngày",
    "Giờ",
    "Thương Hiệu",
    "Mã Nhãn",
    "Độ Tin Cậy (%)",
    "Khay Chỉ Định",
    "Khay Thực Tế",
    "Trạng Thái",
    "Thời Gian Ghi Nhận",
  ];

  const statusMap: Record<string, string> = {
    success: "Phân loại thành công",
    diverted_default: "Chuyển khay 3 (Mặc định)",
    rejected: "Từ chối / Nhãn lạ",
    jammed: "Sự cố kẹt phôi",
  };

  const rows = records.map((r, idx) => {
    const d = new Date(r.timestamp);
    const dayStr = !isNaN(d.getTime()) ? d.toLocaleDateString("vi-VN") : "";
    const timeStr = !isNaN(d.getTime()) ? d.toLocaleTimeString("vi-VN") : "";
    const seq = recordDaySeq[r.id] || idx + 1;
    const dayId = `#${seq}`;

    return [
      idx + 1,
      `"${dayId}"`,
      `"${dayStr}"`,
      `"${timeStr}"`,
      `"${r.brand_name}"`,
      `"${r.brand_id}"`,
      (r.confidence * 100).toFixed(1),
      `Khay ${r.target_bin}`,
      `Khay ${r.actual_bin}`,
      `"${statusMap[r.status] || r.status}"`,
      `"${!isNaN(d.getTime()) ? d.toLocaleString("vi-VN") : r.timestamp}"`,
    ];
  });

  const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\r\n");

  // UTF-8 BOM (\uFEFF) giúp Excel tự nhận dạng font UTF-8 tiếng Việt
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, filename);
  return true;
}

export function exportAlertsToCSV(alerts: AlertEvent[], filename = "iot_sorter_alerts.csv"): boolean {
  if (!alerts || alerts.length === 0) {
    return false;
  }

  const headers = ["STT", "Mã Sự Kiện", "Loại Sự Kiện", "Mức Độ", "Mô Tả", "Thời Gian"];
  const rows = alerts.map((a, idx) => [
    idx + 1,
    `"${a.event_id}"`,
    `"${a.event_type}"`,
    `"${a.severity.toUpperCase()}"`,
    `"${a.description.replace(/"/g, '""')}"`,
    `"${new Date(a.timestamp).toLocaleString("vi-VN")}"`,
  ]);

  const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\r\n");
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, filename);
  return true;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
