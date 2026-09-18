import http from "node:http";
import { URL } from "node:url";
import { ConfigRoutes } from "./routes/configRoutes";
import { HistoryRoutes } from "./routes/historyRoutes";
import { StatsRoutes } from "./routes/statsRoutes";
import { AlertRoutes } from "./routes/alertRoutes";
import { UserRoutes } from "./routes/userRoutes";
import { AuthRoutes } from "./routes/authRoutes";
import { SafetyRoutes } from "./routes/safetyRoutes";
import { SSEService } from "./services/sseService";
import { initBackendMQTT } from "./services/mqttService";
import { resolveUserFromRequest, checkRolePermission } from "./middlewares/authMiddleware";
import { ENV } from "./config/env";
import { formatErrorResponse } from "./middlewares/errorMiddleware";

function parseJsonBody(req: http.IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
      if (body.length > 1e6) {
        req.destroy();
        reject(new Error("Payload Too Large"));
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
        reject(err);
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
        const perm = checkRolePermission(authUser.role, ["admin"]);
        if (!perm.allowed) {
          sendJson(res, perm.status || 403, { success: false, message: perm.error });
          return;
        }
        const body = await parseJsonBody(req);
        const result = ConfigRoutes.handlePost(body);
        sendJson(res, result.success ? 200 : 400, result);
        return;
      }
    }

    // History Routes (DELETE requires 'admin')
    if (pathname === "/api/history") {
      if (method === "GET") {
        const queryParams = Object.fromEntries(parsedUrl.searchParams.entries());
        const result = HistoryRoutes.handleGet({
          limit: queryParams.limit ? Number(queryParams.limit) : undefined,
          offset: queryParams.offset ? Number(queryParams.offset) : undefined,
          brand: queryParams.brand,
          bin: queryParams.bin ? Number(queryParams.bin) : undefined,
          status: queryParams.status,
          date: queryParams.date,
        });
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
        const perm = checkRolePermission(authUser.role, ["admin"]);
        if (!perm.allowed) {
          sendJson(res, perm.status || 403, { success: false, message: perm.error });
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
    // Dùng ID của user đã xác thực qua header/token, fallback admin-001 nếu chưa truyền header
    const currentUserId = authUser.userId === "guest" ? "admin-001" : authUser.userId;

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
      const perm = checkRolePermission(authUser.role, ["admin"]);
      if (!perm.allowed) {
        sendJson(res, perm.status || 403, { success: false, message: perm.error });
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
        const perm = checkRolePermission(authUser.role, ["admin"]);
        if (!perm.allowed) {
          sendJson(res, perm.status || 403, { success: false, message: perm.error });
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

      const perm = checkRolePermission(authUser.role, ["admin"]);
      if (!perm.allowed) {
        sendJson(res, perm.status || 403, { success: false, message: perm.error });
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

    // 404 Not Found
    sendJson(res, 404, { success: false, message: "Route Not Found" });
  } catch (err: unknown) {
    sendJson(res, 500, formatErrorResponse(err));
  }
});

if (require.main === module) {
  initBackendMQTT();
  server.listen(ENV.PORT, () => {
    console.log(`[SortiX Backend] Running on http://localhost:${ENV.PORT}`);
  });
}

export { server };
