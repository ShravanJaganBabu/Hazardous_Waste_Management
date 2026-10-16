import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';

let ioInstance: SocketIOServer | null = null;

export const initSocket = (io: SocketIOServer): void => {
  ioInstance = io;

  // Socket authentication middleware
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
    
    if (token && token !== 'DEMO_TOKEN' && token !== 'DEMO_JWT_SESSION_ACTIVE') {
      try {
        const decoded = jwt.verify(token, ENV.JWT_SECRET) as { userId: string; role: string };
        socket.data.user = decoded;
        return next();
      } catch (err) {
        if (!ENV.DEMO_MODE) {
          return next(new Error('Invalid WebSocket authentication token'));
        }
      }
    }

    if (ENV.DEMO_MODE) {
      const demoRole = socket.handshake.auth?.role || 'ADMIN';
      const demoUserId = socket.handshake.auth?.userId || 'HZU-001';
      socket.data.user = { userId: demoUserId, role: demoRole };
      return next();
    }

    return next(new Error('Authentication required for WebSocket connection'));
  });

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user;
    if (user) {
      // Join user specific room
      socket.join(user.userId);
      // Join role specific room
      socket.join(`role:${user.role}`);
      // Join global broadcast room
      socket.join('haztrack:all');

      console.log(`[SOCKET CONNECTED] User: ${user.userId} (${user.role}) connected (Socket ID: ${socket.id})`);
    }

    socket.on('disconnect', () => {
      console.log(`[SOCKET DISCONNECTED] Socket ID: ${socket.id}`);
    });
  });
};

export const getIO = (): SocketIOServer | null => {
  return ioInstance;
};
