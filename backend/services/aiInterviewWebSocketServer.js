
import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import {
  startSession,
  handleAnswer,
  endSession,
  finalizeInterview
} from './aiInterviewWebsocket.js';

export function initializeAiInterviewWebSocket(server) {
  const wss = new WebSocketServer({ server, path: '/ws/ai-interview' });

  wss.on('connection', async function connection(ws, req) {
    try {
      const protocol = req.headers['x-forwarded-proto'] || 'http';
      const url = new URL(req.url, `${protocol}://${req.headers.host}`);

      const token = url.searchParams.get('token');

      if (!token) {
        ws.close(4001, 'Authentication token required');
        return;
      }

       console.log('Token received:', token ? '[present]' : '[missing]');

      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const userId = payload.userId;
      ws.userId = userId;

      ws.on('message', async (message) => {
        let data;
        try {
          data = JSON.parse(message);
        } catch {
          ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
          return;
        }

        switch (data.type) {
          case 'start':
            await startSession(ws, userId, data.params || {});
            break;

          case 'answer':
            await handleAnswer(ws, data.answer);
            break;

          case 'quit':
            await finalizeInterview(ws);
            endSession(ws);
            ws.close(1000, 'User ended the interview');
            break;

          default:
            ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }));
        }
      });

      ws.on('close', () => {
        endSession(ws);
      });

    } catch (err) {
      console.error('WebSocket auth error:', err.message);
      ws.close(4002, 'Authentication failed');
    }
  });
}
