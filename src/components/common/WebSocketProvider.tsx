"use client";

import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

// Export the socket instance so ChatInput can use it
export let socket: Socket | null = null;

export default function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    socket = io("http://localhost:3001");

    socket.on("connect", () => {
      console.log("[WS Client] Connected to daemon server");
    });

    socket.on("new_event", async (data) => {
      console.log("[WS Client] Received event from daemon:", data);
      
      // Bridge the WebSocket message to our local DB & SSE
      try {
        await fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      } catch (err) {
        console.error("[WS Client] Failed to persist daemon event", err);
      }
    });

    return () => {
      socket?.disconnect();
      socket = null;
    };
  }, []);

  return <>{children}</>;
}
