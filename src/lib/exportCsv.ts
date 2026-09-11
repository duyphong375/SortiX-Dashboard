// Tiện ích xuất dữ liệu ra file Excel / CSV (kèm UTF-8 BOM hiển thị chuẩn tiếng Việt)
import { ClassificationRecord, AlertEvent } from "./types";

export function exportClassificationToCSV(
  records: ClassificationRecord[],
  filename = "iot_sorter_history.csv"
) {
  if (!records || records.length === 0) {
    alert("Không có dữ liệu lịch sử để xuất file!");
    return;
  }

  const headers = [
    "STT",
    "Mã Sản Phẩm",
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

  const rows = records.map((r, idx) => [
    idx + 1,
    `"${r.product_id}"`,
    `"${r.brand_name}"`,
    `"${r.brand_id}"`,
    (r.confidence * 100).toFixed(1),
    `Khay ${r.target_bin}`,
    `Khay ${r.actual_bin}`,
    `"${statusMap[r.status] || r.status}"`,
    `"${new Date(r.timestamp).toLocaleString("vi-VN")}"`,
  ]);

  const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\r\n");

  // UTF-8 BOM (\uFEFF) giúp Excel tự nhận dạng font UTF-8
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, filename);
}

export function exportAlertsToCSV(alerts: AlertEvent[], filename = "iot_sorter_alerts.csv") {
  if (!alerts || alerts.length === 0) {
    alert("Không có sự cố nào để xuất file!");
    return;
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
  URL.revokeObjectURL(url);
}
