// server.ts
import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { connectDB } from "./config/db";
import { createServer } from "http";
import { notificationWebSocket } from "./services/websocket/notificationSocket";

const PORT = process.env.PORT || 5000;

// Connect to database
connectDB();

// Create HTTP server from Express app
const server = createServer(app);

// Initialize WebSocket
notificationWebSocket.initialize(server);

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Node backend running at http://localhost:${PORT}`);
  console.log(`🔗 WebSocket server ready on port ${PORT}`);
});
