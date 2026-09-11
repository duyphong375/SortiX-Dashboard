// Ma trận phân quyền cho hệ thống IoT Dashboard
// Admin: toàn quyền | User: giám sát + vận hành cơ bản

export type UserRole = "admin" | "user";

export interface AuthUser {
  role: UserRole;
  displayName: string;
  avatar: string;
  email: string;
  loginTime: string;
}

// Danh sách tất cả quyền hành động trong hệ thống
export type PermissionAction =
  | "dashboard.view"
  | "conveyor.view"
  | "conveyor.control"        // Start/Pause
  | "conveyor.spawn"          // Nạp phôi
  | "conveyor.estop"          // Dừng khẩn cấp
  | "conveyor.speed"          // Thay đổi tốc độ
  | "analytics.view"
  | "history.view"
  | "history.delete"
  | "history.export"
  | "alerts.view"
  | "alerts.delete"
  | "alerts.configure"
  | "config.view"
  | "config.edit"
  | "config.publish"
  | "devices.view"
  | "devices.configure"
  | "users.view"
  | "users.manage"
  | "reports.view"
  | "reports.advanced"
  | "settings.mqtt"
  | "settings.system";

// Ma trận quyền: role → danh sách actions được phép
const PERMISSION_MATRIX: Record<UserRole, Set<PermissionAction>> = {
  admin: new Set<PermissionAction>([
    "dashboard.view",
    "conveyor.view",
    "conveyor.control",
    "conveyor.spawn",
    "conveyor.estop",
    "conveyor.speed",
    "analytics.view",
    "history.view",
    "history.delete",
    "history.export",
    "alerts.view",
    "alerts.delete",
    "alerts.configure",
    "config.view",
    "config.edit",
    "config.publish",
    "devices.view",
    "devices.configure",
    "users.view",
    "users.manage",
    "reports.view",
    "reports.advanced",
    "settings.mqtt",
    "settings.system",
  ]),
  user: new Set<PermissionAction>([
    "dashboard.view",
    "conveyor.view",
    "conveyor.control",
    "conveyor.spawn",
    "conveyor.speed",
    "analytics.view",
    "history.view",
    "history.export",
    "alerts.view",
    "reports.view",
  ]),
};

/** Kiểm tra xem role có quyền thực hiện action không */
export function hasPermission(role: UserRole, action: PermissionAction): boolean {
  return PERMISSION_MATRIX[role]?.has(action) ?? false;
}

/** Lấy danh sách tất cả quyền của role */
export function getPermissions(role: UserRole): PermissionAction[] {
  return Array.from(PERMISSION_MATRIX[role] || []);
}

// Dữ liệu người dùng mẫu
export const MOCK_USERS: AuthUser[] = [
  {
    role: "admin",
    displayName: "Quản trị viên hệ thống",
    avatar: "",
    email: "admin@pbl3.local",
    loginTime: "",
  },
  {
    role: "user",
    displayName: "Kỹ thuật viên vận hành",
    avatar: "",
    email: "operator@pbl3.local",
    loginTime: "",
  },
];

// Chỉ dùng cho màn hình demo cục bộ; xác thực production phải thực hiện ở server.
export const DEMO_PASSWORDS: Record<string, string> = {
  "admin@pbl3.local": "admin123",
  "operator@pbl3.local": "operator123",
};

// Sidebar menu items cấu hình
export interface SidebarMenuItem {
  id: string;
  label: string;
  icon: string; // Lucide icon name
  href: string;
  requiredPermission?: PermissionAction;
  badge?: string;
  children?: SidebarMenuItem[];
}

export interface SidebarMenuGroup {
  groupLabel: string;
  items: SidebarMenuItem[];
}

export const SIDEBAR_MENU: SidebarMenuGroup[] = [
  {
    groupLabel: "TỔNG QUAN",
    items: [
      { id: "dashboard", label: "Tổng Quan", icon: "LayoutDashboard", href: "/" },
      { id: "analytics", label: "Thống Kê", icon: "BarChart3", href: "/analytics" },
    ],
  },
  {
    groupLabel: "VẬN HÀNH",
    items: [
      { id: "conveyor", label: "Băng Tải", icon: "Layers", href: "/conveyor" },
      { id: "history", label: "Lịch Sử", icon: "History", href: "/history" },
      { id: "alerts", label: "Cảnh Báo", icon: "Bell", href: "/alerts" },
    ],
  },
  {
    groupLabel: "HỆ THỐNG",
    items: [
      { id: "config", label: "Cấu Hình", icon: "SlidersHorizontal", href: "/config", requiredPermission: "config.view" },
      { id: "devices", label: "MQTT & IoT", icon: "Cpu", href: "/devices", requiredPermission: "devices.view" },
      { id: "users", label: "Người Dùng", icon: "Users", href: "/users", requiredPermission: "users.view" },
    ],
  },
];

// Mock data cho quản lý người dùng
export interface MockUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: "active" | "inactive";
  avatar: string;
  createdAt: string;
  lastLogin: string;
}

export const MOCK_USER_LIST: MockUser[] = [
  { id: "u1", name: "A", email: "admin@pbl3.local", role: "admin", status: "active", avatar: "", createdAt: "2026-01-15", lastLogin: "2026-09-11" },
  { id: "u2", name: "B", email: "operator1@pbl3.local", role: "user", status: "active", avatar: "", createdAt: "2026-03-20", lastLogin: "2026-09-10" },
  { id: "u3", name: "c", email: "tech@pbl3.local", role: "user", status: "active", avatar: "", createdAt: "2026-04-10", lastLogin: "2026-09-09" },
  { id: "u4", name: "D", email: "supervisor@pbl3.local", role: "admin", status: "active", avatar: "", createdAt: "2026-02-28", lastLogin: "2026-09-11" },
  { id: "u5", name: "123", email: "maintenance@pbl3.local", role: "user", status: "inactive", avatar: "", createdAt: "2026-05-15", lastLogin: "2026-08-25" },
  { id: "u6", name: "12345", email: "quality@pbl3.local", role: "user", status: "active", avatar: "", createdAt: "2026-06-01", lastLogin: "2026-09-10" },
  { id: "u7", name: "Tiểu Himass", email: "safety@pbl3.local", role: "user", status: "active", avatar: "", createdAt: "2026-07-20", lastLogin: "2026-09-08" },
];
