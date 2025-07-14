import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { NOTIFICATION_API } from '../utils/api';

let socket;

export const useNotification = (userId, onNotification) => {
  useEffect(() => {
    if (!userId) return;

   socket = io('http://localhost:5000');

    console.log("Connecting to notification server");
    socket.on('connect', () => {
      console.log("📡 Socket connected:", socket.id); 
      socket.emit('register', userId);
    });

    socket.on('interview_scheduled', (data) => {
      console.log('🔔 New interview scheduled:', data);
      onNotification(data);
    });

    socket.on('connect_error', (err) => {
      console.error('❌ Socket connection error:', err);
    });


    return () => {
      if (socket) socket.disconnect();
    };
  }, [userId]);
};
