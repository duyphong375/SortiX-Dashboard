import http from "node:http";

interface SSEClient {
  id: string;
  res: http.ServerResponse;
}

const clients: Map<string, SSEClient> = new Map();

export const SSEService = {
  addClient(res: http.ServerResponse): string {
    const id = `sse_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    });

    // Gửi tín hiệu kết nối ban đầu
    res.write(`event: connected\ndata: ${JSON.stringify({ clientId: id, timestamp: new Date().toISOString() })}\n\n`);

    const client: SSEClient = { id, res };
    clients.set(id, client);

    res.on("close", () => {
      clients.delete(id);
    });

    return id;
  },

  broadcast(event: string, data: unknown): void {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const [id, client] of clients.entries()) {
      try {
        client.res.write(payload);
      } catch (err) {
        console.warn(`[SSEService] Lỗi gửi tới client ${id}, đang hủy kết nối:`, err);
        clients.delete(id);
      }
    }
  },

  getClientCount(): number {
    return clients.size;
  },
};

// Gửi ping định kỳ 30s để giữ kết nối SSE
setInterval(() => {
  if (clients.size > 0) {
    SSEService.broadcast("ping", { time: Date.now() });
  }
}, 30000);
