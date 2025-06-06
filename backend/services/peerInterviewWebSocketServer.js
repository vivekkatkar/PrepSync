import { prisma } from '../prisma/client.js';

export function initializePeerInterviewWebSocket(io) {
  const peerNamespace = io.of('/peer-interview');

  peerNamespace.on('connection', (socket) => {
    console.log('Peer socket connected:', socket.id);

    // --- Join Room Logic ---
    socket.on('join-room', async ({ roomId, userId }) => {
      try {
        // Validate if interview room exists in DB
        const interview = await prisma.interview.findUnique({ where: { roomId } });
        if (!interview) {
          socket.emit('server-error', { message: 'Room not found' });
          return;
        }

        // Get current clients in room (excluding the current socket)
        const roomSockets = Array.from(peerNamespace.adapter.rooms.get(roomId) || []);
        const otherClients = roomSockets.filter(id => id !== socket.id);
        
        // Determine role based on number of existing clients
        let role;
        let isInitiator = false;
        
        if (otherClients.length === 0) {
          // First person to join becomes the initiator
          role = 'host';
          isInitiator = true;
        } else if (otherClients.length === 1) {
          // Second person becomes the receiver
          role = 'guest';
          isInitiator = false;
        } else {
          // Additional people become spectators
          role = 'spectator';
          isInitiator = false;
        }

        // Join socket to the room
        socket.join(roomId);
        socket.roomId = roomId;
        socket.userId = userId;
        socket.role = role;

        console.log(`User ${userId} joined room ${roomId} as ${role}, initiator: ${isInitiator}`);

        // If this is the first person (initiator)
        if (isInitiator) {
          socket.emit('you-are-initiator', {
            roomId,
            role,
            message: 'You are the first to join. Waiting for peer...'
          });
        } else if (otherClients.length === 1) {
          // This is the second person (receiver)
          socket.emit('you-are-receiver', {
            roomId,
            role,
            message: 'Joining as receiver. Connecting to peer...'
          });
          
          // Notify the initiator that a receiver has joined
          const initiatorSocketId = otherClients[0];
          socket.to(initiatorSocketId).emit('peer-ready-to-connect', {
            peerSocketId: socket.id,
            peerUserId: userId
          });
        } else {
          // Spectator or additional user
          socket.emit('joined-as-spectator', {
            roomId,
            role,
            message: 'Joined as spectator'
          });
        }

        // Notify other peers in room that a new peer joined
        socket.to(roomId).emit('peer-joined', {
          socketId: socket.id,
          userId,
          role,
        });

      } catch (error) {
        console.error('Error joining room:', error);
        socket.emit('server-error', { message: 'Failed to join room' });
      }
    });

    // --- WebRTC Signaling Events ---

    socket.on('signal', ({ roomId, signalData, targetSocketId }) => {
      console.log('Signal event:', { fromSocket: socket.id, targetSocket: targetSocketId });
      const payload = { signalData, fromSocketId: socket.id };
      
      if (targetSocketId) {
        socket.to(targetSocketId).emit('signal', payload);
      } else {
        socket.to(roomId).emit('signal', payload);
      }
    });

    socket.on('offer', ({ roomId, offer, targetSocketId }) => {
      console.log('Offer event:', { fromSocket: socket.id, targetSocket: targetSocketId });
      if (targetSocketId) {
        socket.to(targetSocketId).emit('offer', { offer, fromSocketId: socket.id });
      } else {
        socket.to(roomId).emit('offer', { offer, fromSocketId: socket.id });
      }
    });

    socket.on('answer', ({ roomId, answer, targetSocketId }) => {
      console.log('Answer event:', { fromSocket: socket.id, targetSocket: targetSocketId });
      if (targetSocketId) {
        socket.to(targetSocketId).emit('answer', { answer, fromSocketId: socket.id });
      } else {
        socket.to(roomId).emit('answer', { answer, fromSocketId: socket.id });
      }
    });

    socket.on('ice-candidate', ({ roomId, candidate, targetSocketId }) => {
      console.log('ICE candidate event:', { fromSocket: socket.id, targetSocket: targetSocketId });
      const payload = { candidate, fromSocketId: socket.id };
      
      if (targetSocketId) {
        socket.to(targetSocketId).emit('ice-candidate', payload);
      } else {
        socket.to(roomId).emit('ice-candidate', payload);
      }
    });

    // --- Chat Message ---

    socket.on('chat-message', ({ roomId, message, userName }) => {
      socket.to(roomId).emit('chat-message', {
        message,
        userName,
        timestamp: new Date().toISOString(),
        fromSocketId: socket.id,
      });
    });

    // --- Recording Events ---

    socket.on('recording-started', ({ roomId }) => {
      socket.to(roomId).emit('recording-started', {
        message: 'Recording has started',
        startedBy: socket.userId,
      });
    });

    socket.on('recording-stopped', ({ roomId }) => {
      socket.to(roomId).emit('recording-stopped', {
        message: 'Recording has stopped',
        stoppedBy: socket.userId,
      });
    });

    // --- Leave Room ---

    socket.on('leave-room', ({ roomId }) => {
      socket.leave(roomId);
      socket.to(roomId).emit('peer-left', {
        socketId: socket.id,
        userId: socket.userId,
        role: socket.role
      });

      // Cleanup socket properties
      delete socket.roomId;
      delete socket.userId;
      delete socket.role;
    });

    // --- Disconnect ---

    socket.on('disconnect', () => {
      console.log('Peer socket disconnected:', socket.id);
      if (socket.roomId) {
        socket.to(socket.roomId).emit('peer-left', {
          socketId: socket.id,
          userId: socket.userId,
          role: socket.role
        });
        
        // Cleanup socket properties
        delete socket.roomId;
        delete socket.userId;
        delete socket.role;
      }
    });

    // --- Error Handler ---

    socket.on('error', (err) => {
      console.error('Socket error:', err);
    });
  });

  peerNamespace.on('error', (error) => {
    console.error('Peer namespace error:', error);
  });
}