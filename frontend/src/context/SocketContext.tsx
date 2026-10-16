import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({ socket: null, isConnected: false });

const getSocketUrl = (): string => {
  const socketEnv = (import.meta.env.VITE_SOCKET_URL || '').trim();
  if (socketEnv) return socketEnv;

  const apiEnv = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '').trim();
  if (apiEnv && apiEnv.startsWith('http')) {
    try {
      const parsed = new URL(apiEnv);
      return parsed.origin;
    } catch {
      // fallback
    }
  }
  return '/';
};

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    const targetUrl = getSocketUrl();
    const socketInstance = io(targetUrl, {
      auth: {
        token: token || 'DEMO_JWT_SESSION_ACTIVE',
        userId: user?.userId || 'HZU-001',
        role: user?.role || 'ADMIN',
      },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [user?.userId, user?.role, token]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
