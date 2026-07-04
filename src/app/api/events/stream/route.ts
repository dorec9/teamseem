import { eventStore } from "@/lib/store/event-store";
import type { SSEEvent } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const encoder = new TextEncoder();
  let keepalive: ReturnType<typeof setInterval>;
  let send: ((event: SSEEvent) => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      send = (event: SSEEvent) => {
        try {
          const data = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(data));
        } catch {
          cleanup();
        }
      };

      // 초기 스냅샷은 클라이언트에서 /api/sessions 로 가져옴 (useInitialState)
      // SSE 스트림은 새로운 이벤트만 구독함.

      // 연결 확인 이벤트
      controller.enqueue(encoder.encode(`: connected\n\n`));

      eventStore.subscribe(send);

      // keepalive (30초마다 코멘트 전송)
      keepalive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: keepalive\n\n`));
        } catch {
          cleanup();
        }
      }, 30000);
    },
    cancel() {
      cleanup();
    },
  });

  function cleanup() {
    clearInterval(keepalive);
    if (send) {
      eventStore.unsubscribe(send);
      send = null;
    }
  }

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
