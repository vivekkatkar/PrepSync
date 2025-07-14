// index.js
import { Server } from 'socket.io';
import http from 'http';
import dotenv from 'dotenv';
import { redisSub } from './redisClient.js';
import sendWhatsAppMessage, { initializeWhatsApp } from './services/whatsapp.js';

dotenv.config();

const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  }
});

const userSocketMap = new Map(); // userId => socketId

io.on('connection', (socket) => {
  socket.on('register', (userId) => {
    userSocketMap.set(userId, socket.id);
    console.log(`User ${userId} connected with socket ${socket.id}`);
  });

  socket.on('disconnect', () => {
    for (const [uid, sid] of userSocketMap.entries()) {
      if (sid === socket.id) {
        userSocketMap.delete(uid);
        break;
      }
    }
  });
});

await redisSub.subscribe('interview_notifications', (message) => {
  const data = JSON.parse(message);
  const socketId = userSocketMap.get(data.toUserId);
  if (socketId) {
    io.to(socketId).emit('interview_scheduled', data);
    console.log(`✅ Notified user ${data.toUserId}`);
  } else {
    console.log(`⚠️ User ${data.toUserId} not connected`);
  }
});

// New: WhatsApp queue listener
await redisSub.subscribe('whatsapp_notifications', async (message) => {
  const { to, message: text } = JSON.parse(message);

  console.log(message);
  try {
    await sendWhatsAppMessage(to, text);
    console.log(`📲 WhatsApp message sent to ${to}`);
  } catch (err) {
    console.error(`❌ Failed to send WhatsApp message to ${to}`, err.message);
  }
});

// Start WhatsApp client
await initializeWhatsApp();

const PORT = process.env.NOTIFICATION_PORT || 5000;
server.listen(PORT, () => {
  console.log(`📡 Notification Server running on port ${PORT}`);
});
