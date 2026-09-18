import { SafetyService } from "@/services/safetyService";
import { SSEService } from "@/services/sseService";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | undefined;
  let timer: ReturnType<typeof setInterval> | undefined;
  const cleanup = () => {
    unsubscribe?.();
    if (timer) clearInterval(timer);
    request.signal.removeEventListener("abort", cleanup);
  };
  const stream = new ReadableStream({
    start(controller) {
      const send = (event: string, data: unknown, id?: string) => {
        controller.enqueue(encoder.encode(`${id ? `id: ${id}\n` : ""}event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };
      unsubscribe = SSEService.subscribe(
        (entry) => send(entry.event, entry.data, entry.id),
        request.headers.get("last-event-id") || undefined
      );
      send("status", SafetyService.getStatus());
      timer = setInterval(() => {
        try { send("ping", { time: Date.now() }); } catch { cleanup(); }
      }, 30000);
      request.signal.addEventListener("abort", cleanup, { once: true });
    },
    cancel: cleanup,
  });
  return new Response(stream, { headers: {
    "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive",
  } });
}
