import { SafetyService } from "@/services/safetyService";

export const dynamic = "force-dynamic";

export async function GET() {
  const encoder = new TextEncoder();

  let intervalId: NodeJS.Timeout;

  const stream = new ReadableStream({
    start(controller) {
      // Gửi initial status
      const initialStatus = SafetyService.getStatus();
      controller.enqueue(
        encoder.encode(`event: status\ndata: ${JSON.stringify(initialStatus)}\n\n`)
      );

      // Định kỳ kiểm tra và giữ kết nối ping
      let lastStatus = initialStatus.status;
      let lastNotifId = initialStatus.last_notification?.id;
      intervalId = setInterval(() => {
        try {
          const current = SafetyService.getStatus();
          if (current.last_notification && current.last_notification.id !== lastNotifId) {
            lastNotifId = current.last_notification.id;
            if (current.last_notification.event === "jam_detected") {
              controller.enqueue(
                encoder.encode(
                  `event: jam_detected\ndata: ${JSON.stringify({
                    event: "jam_detected",
                    payload: {
                      event: "jam_detected",
                      section: current.last_notification.station_id,
                      sensor_id: current.last_notification.triggered_by,
                      mode: current.last_notification.mode,
                      timestamp: current.last_notification.timestamp,
                    },
                    notification: current.last_notification,
                  })}\n\n`
                )
              );
            }
          }
          if (current.status !== lastStatus) {
            lastStatus = current.status;
            controller.enqueue(
              encoder.encode(`event: status\ndata: ${JSON.stringify(current)}\n\n`)
            );
          } else {
            controller.enqueue(
              encoder.encode(`event: ping\ndata: ${JSON.stringify({ time: Date.now() })}\n\n`)
            );
          }
        } catch {
          clearInterval(intervalId);
        }
      }, 1000);
    },
    cancel() {
      clearInterval(intervalId);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
