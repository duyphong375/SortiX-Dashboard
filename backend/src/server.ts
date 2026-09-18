import http from "node:http";
import { URL } from "node:url";
import { ConfigRoutes } from "./routes/configRoutes";
import { HistoryRoutes } from "./routes/historyRoutes";
import { StatsRoutes } from "./routes/statsRoutes";
import { AlertRoutes } from "./routes/alertRoutes";
import { UserRoutes } from "./routes/userRoutes";
import { AuthRoutes } from "./routes/authRoutes";
import { SafetyRoutes } from "./routes/safetyRoutes";
import { SSEService, shutdownSSE } from "./services/sseService";
import { initBackendMQTT, shutdownBackendMQTT } from "./services/mqttService";
import { resolveUserFromRequest, checkRolePermission, requireAdmin } from "./middlewares/authMiddleware";
import { ENV } from "./config/env";
import { HistoryQuerySchema } from "@shared/schemas";
import { SyncService } from "./services/syncService";
import { HistoryModel } from "./models/historyModel";

function parseJsonBody(req: http.IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
      if (body.length > 1e6) {
        req.destroy();
        const error = Object.assign(new Error("Payload Too Large"), { statusCode: 413 });
        reject(error);
      }
    });
    req.on("end", () => {
      if (!body.trim()) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(Object.assign(new Error("Invalid JSON body"), { statusCode: 400, cause: err }));
      }
    });
    req.on("error", (err) => reject(err));
  });
}

function sendJson(res: http.ServerResponse, statusCode: number, data: unknown) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-User-Id, X-User-Role",
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-User-Id, X-User-Role",
    });
    res.end();
    return;
  }

  const reqUrl = req.url || "/";
  const parsedUrl = new URL(reqUrl, `http://${req.headers.host || "localhost"}`);
  const pathname = parsedUrl.pathname;
  const method = req.method?.toUpperCase();

  try {
    const authUser = resolveUserFromRequest(req);

    // Health Check
    if (pathname === "/api/health" && method === "GET") {
      sendJson(res, 200, { status: "ok", uptime: process.uptime() });
      return;
    }

    // Auth Routes (Sign Up & Sign In)
    if (pathname === "/api/auth/register" && method === "POST") {
      const body = await parseJsonBody(req);
      const result = await AuthRoutes.handleRegister(body);
      sendJson(res, result.status, result.body);
      return;
    }

    if (pathname === "/api/auth/login" && method === "POST") {
      const body = await parseJsonBody(req);
      const result = await AuthRoutes.handleLogin(body);
      sendJson(res, result.status, result.body);
      return;
    }

    if (pathname === "/api/auth/logout" && method === "POST") {
      sendJson(res, 200, { success: true, message: "Đăng xuất thành công" });
      return;
    }

    if (pathname === "/api/auth/forgot-password" && method === "POST") {
      const body = await parseJsonBody(req);
      const result = AuthRoutes.handleForgotPassword(body);
      sendJson(res, result.status, result.body);
      return;
    }

    if (pathname === "/api/auth/reset-password" && method === "POST") {
      const body = await parseJsonBody(req);
      const result = await AuthRoutes.handleResetPassword(body);
      sendJson(res, result.status, result.body);
      return;
    }

    // Config Routes (GET allowed for all, POST requires 'admin')
    if (pathname === "/api/config") {
      if (method === "GET") {
        sendJson(res, 200, ConfigRoutes.handleGet());
        return;
      }
      if (method === "POST") {
        const adminAuth = requireAdmin(req);
        if ("status" in adminAuth) {
          sendJson(res, adminAuth.status, { success: false, message: adminAuth.error });
          return;
        }
        const perm = checkRolePermission(authUser.role, ["admin"]);
        if (!perm.allowed) {
          sendJson(res, perm.status || 403, { success: false, message: perm.error });
          return;
        }
        const body = await parseJsonBody(req);
        const result = typeof body === "object" && body !== null && (body as Record<string, unknown>).action === "reset"
          ? ConfigRoutes.handleReset()
          : ConfigRoutes.handlePost(body);
        sendJson(res, result.success ? 200 : 400, result);
        return;
      }
    }

    // History Routes (DELETE requires 'admin')
    if (pathname === "/api/history") {
      if (method === "GET") {
        const queryParams = Object.fromEntries(parsedUrl.searchParams.entries());
        const validatedQuery = HistoryQuerySchema.safeParse(queryParams);
        if (!validatedQuery.success) {
          sendJson(res, 400, { success: false, message: "Tham số history không hợp lệ", errors: validatedQuery.error.format() });
          return;
        }
        const result = HistoryRoutes.handleGet(validatedQuery.data);
        sendJson(res, 200, result);
        return;
      }
      if (method === "POST") {
        const body = await parseJsonBody(req);
        const result = HistoryRoutes.handlePost(body);
        sendJson(res, result.success ? 201 : 400, result);
        return;
      }
      if (method === "DELETE") {
        const adminAuth = requireAdmin(req);
        if ("status" in adminAuth) {
          sendJson(res, adminAuth.status, { success: false, message: adminAuth.error });
          return;
        }
        sendJson(res, 200, HistoryRoutes.handleDelete());
        return;
      }
    }

    // Stats Routes
    if (pathname === "/api/stats" && method === "GET") {
      sendJson(res, 200, StatsRoutes.handleGet());
      return;
    }

    // Alert Routes (POST requires 'admin')
    if (pathname === "/api/email-alert" && method === "POST") {
      const perm = checkRolePermission(authUser.role, ["admin"]);
      if (!perm.allowed) {
        sendJson(res, perm.status || 403, { success: false, message: perm.error });
        return;
      }
      const body = await parseJsonBody(req);
      const result = await AlertRoutes.handleEmail(body);
      sendJson(res, result.status, result.body);
      return;
    }

    if (pathname === "/api/telegram-alert" && method === "POST") {
      const perm = checkRolePermission(authUser.role, ["admin"]);
      if (!perm.allowed) {
        sendJson(res, perm.status || 403, { success: false, message: perm.error });
        return;
      }
      const body = await parseJsonBody(req);
      const result = await AlertRoutes.handleTelegram(body);
      sendJson(res, result.status, result.body);
      return;
    }

    // User & Account Routes (Self-Profile & Change Password)
    if (pathname === "/api/user/profile" || pathname === "/api/user/change-password") {
      if (!authUser.isAuthenticated) {
        sendJson(res, 401, { success: false, message: "Vui lòng đăng nhập để tiếp tục" });
        return;
      }
    }
    const currentUserId = authUser.userId;

    if (pathname === "/api/user/profile") {
      if (method === "GET") {
        const result = UserRoutes.handleGetProfile(currentUserId);
        sendJson(res, result.status, result.body);
        return;
      }
      if (method === "PUT") {
        const body = await parseJsonBody(req);
        const result = UserRoutes.handleUpdateProfile(currentUserId, body);
        sendJson(res, result.status, result.body);
        return;
      }
    }

    if (pathname === "/api/user/change-password" && method === "POST") {
      const body = await parseJsonBody(req);
      const result = await UserRoutes.handleChangePassword(currentUserId, body);
      sendJson(res, result.status, result.body);
      return;
    }

    // Quản trị toàn bộ người dùng (Yêu cầu 'admin')
    if (pathname === "/api/users") {
      const adminAuth = requireAdmin(req);
      if ("status" in adminAuth) {
        sendJson(res, adminAuth.status, { success: false, message: adminAuth.error });
        return;
      }

      if (method === "GET") {
        const result = UserRoutes.handleGetAllUsers();
        sendJson(res, result.status, result.body);
        return;
      }

      if (method === "POST") {
        const body = await parseJsonBody(req);
        const result = await UserRoutes.handleCreateUser(body);
        sendJson(res, result.status, result.body);
        return;
      }
    }

    if (pathname.startsWith("/api/users/")) {
      const targetId = pathname.replace("/api/users/", "").trim();
      if (targetId) {
        const adminAuth = requireAdmin(req);
        if ("status" in adminAuth) {
          sendJson(res, adminAuth.status, { success: false, message: adminAuth.error });
          return;
        }

        if (method === "PUT") {
          const body = await parseJsonBody(req);
          const result = await UserRoutes.handleUpdateUser(targetId, body);
          sendJson(res, result.status, result.body);
          return;
        }

        if (method === "DELETE") {
          const result = UserRoutes.handleDeleteUser(targetId, authUser.userId);
          sendJson(res, result.status, result.body);
          return;
        }
      }
    }

    // SSE Stream Route (Server-Sent Events)
    if (pathname === "/api/events" && method === "GET") {
      SSEService.addClient(res);
      return;
    }

    // Safety & Emergency Stop Routes
    if (pathname === "/api/safety/status" && method === "GET") {
      const result = SafetyRoutes.handleGetStatus();
      sendJson(res, result.status, result.body);
      return;
    }

    if (pathname === "/api/safety/estop" && method === "POST") {
      const body = await parseJsonBody(req);
      const result = SafetyRoutes.handlePostEstop(body);
      sendJson(res, result.status, result.body);
      return;
    }

    if (pathname === "/api/safety/jam" && method === "POST") {
      const body = await parseJsonBody(req);
      const result = SafetyRoutes.handlePostJam(body);
      sendJson(res, result.status, result.body);
      return;
    }

    if ((pathname === "/api/safety/bin-full" || pathname === "/api/storage/bin-status") && method === "POST") {
      const body = await parseJsonBody(req);
      const result = SafetyRoutes.handlePostBinFull(body);
      sendJson(res, result.status, result.body);
      return;
    }

    if ((pathname === "/api/safety/temp-warning" || pathname === "/api/telemetry/temp") && method === "POST") {
      const body = await parseJsonBody(req);
      const result = SafetyRoutes.handlePostTemperatureWarning(body);
      sendJson(res, result.status, result.body);
      return;
    }

    if ((pathname === "/api/safety/device-offline" || pathname === "/api/device/offline") && method === "POST") {
      const body = await parseJsonBody(req);
      const result = SafetyRoutes.handlePostDeviceOffline(body);
      sendJson(res, result.status, result.body);
      return;
    }

    if ((pathname === "/api/safety/heartbeat" || pathname === "/api/heartbeat" || pathname === "/api/telemetry/heartbeat") && method === "POST") {
      const body = await parseJsonBody(req);
      const result = SafetyRoutes.handlePostHeartbeat(body);
      sendJson(res, result.status, result.body);
      return;
    }

    if ((pathname === "/api/safety/shift-summary" || pathname === "/api/shift/summary") && method === "POST") {
      const body = await parseJsonBody(req);
      const result = SafetyRoutes.handlePostShiftSummary(body);
      sendJson(res, result.status, result.body);
      return;
    }

    if ((pathname === "/api/safety/mqtt-disconnected" || pathname === "/api/mqtt/disconnected") && method === "POST") {
      const body = await parseJsonBody(req);
      const result = SafetyRoutes.handlePostMqttDisconnected(body);
      sendJson(res, result.status, result.body);
      return;
    }

    if ((pathname === "/api/safety/mqtt-connected" || pathname === "/api/mqtt/connected") && method === "POST") {
      const body = await parseJsonBody(req);
      const result = SafetyRoutes.handlePostMqttConnected(body);
      sendJson(res, result.status, result.body);
      return;
    }

    if (pathname === "/api/safety/unlock" && method === "POST") {
      const adminAuth = requireAdmin(req);
      if ("status" in adminAuth) {
        sendJson(res, adminAuth.status, { success: false, message: adminAuth.error });
        return;
      }
      const body = await parseJsonBody(req);
      const result = SafetyRoutes.handlePostUnlock(
        { userId: authUser.userId, username: authUser.username || authUser.userId, role: authUser.role },
        body
      );
      sendJson(res, result.status, result.body);
      return;
    }

    // Notifications Route
    if (pathname === "/api/notifications" && method === "GET") {
      const statusParam = parsedUrl.searchParams.get("status") || undefined;
      const result = SafetyRoutes.handleGetNotifications(statusParam);
      sendJson(res, result.status, result.body);
      return;
    }

    // Sync Routes (Cross-Device Realtime Sync)
    if (pathname === "/api/sync" && method === "GET") {
      sendJson(res, 200, {
        success: true,
        state: SyncService.getState(),
        history: HistoryModel.getAll(),
      });
      return;
    }

    if (pathname === "/api/sync" && method === "POST") {
      const body = await parseJsonBody(req);
      const { type, state, records, binCounts, item, senderId } = (body as any) || {};
      if (type === "update_state" && state) {
        const updated = SyncService.updateState(state, senderId);
        sendJson(res, 200, { success: true, state: updated });
        return;
      }
      if (type === "sync_records" && Array.isArray(records)) {
        SyncService.syncRecords(records, binCounts, senderId);
        sendJson(res, 200, { success: true, state: SyncService.getState() });
        return;
      }
      if (type === "clear_history") {
        SyncService.clearHistory(senderId);
        sendJson(res, 200, { success: true, state: SyncService.getState() });
        return;
      }
      if (type === "spawn_item" && item) {
        SyncService.spawnItem(item, senderId);
        sendJson(res, 200, { success: true });
        return;
      }
      sendJson(res, 400, { success: false, error: "Invalid sync action type" });
      return;
    }

    // 404 Not Found
    sendJson(res, 404, { success: false, message: "Route Not Found" });
  } catch (err: unknown) {
    const statusCode = typeof err === "object" && err !== null && "statusCode" in err &&
      typeof (err as { statusCode?: unknown }).statusCode === "number"
      ? (err as { statusCode: number }).statusCode
      : 500;
    sendJson(res, statusCode, formatErrorResponse(err, statusCode === 400 ? "Bad Request" : undefined));
  }
});

if (require.main === module) {
  initBackendMQTT();
  server.listen(ENV.PORT, () => {
    console.log(`[SortiX Backend] Running on http://localhost:${ENV.PORT}`);
  });

  let shuttingDown = false;
  const shutdown = (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`[SortiX Backend] Nhận ${signal}, đang đóng server an toàn...`);
    shutdownBackendMQTT();
    shutdownSSE();
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));
}

export { server };
