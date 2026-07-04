import { Server } from "socket.io";
import { createServer } from "http";

const port = 3001;
const httpServer = createServer();

const io = new Server(httpServer, {
  cors: {
    origin: "*", // Adjust for production
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(`[WS] Client connected: ${socket.id}`);

  // Handle message from TeamSeem UI
  socket.on("send_message", (data) => {
    console.log(`[WS] Received message from UI:`, data);
    
    // Broadcast this message to any connected agent daemon
    // In a real system, you'd route this to the specific agent by sessionId
    io.emit("agent_input", data);
  });

  // Handle message from Agent Daemon
  socket.on("agent_output", (data) => {
    console.log(`[WS] Received output from Agent:`, data.content?.substring(0, 50));
    
    // Forward the agent's output back to the TeamSeem UI
    io.emit("new_event", data);
  });

  socket.on("disconnect", () => {
    console.log(`[WS] Client disconnected: ${socket.id}`);
  });
});

httpServer.listen(port, () => {
  console.log(`[WS] WebSocket server running on port ${port}`);
});
