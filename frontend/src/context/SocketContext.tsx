import { createContext, useContext, useEffect, useRef, ReactNode, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

export interface ToastNotification {
  id: string;
  title: string;
  message: string;
  type: 'leave_request' | 'leave_approved' | 'leave_rejected' | 'leave_cancelled' | 'balance_adjusted' | 'employee_created' | 'info';
  link?: string;
  timestamp: string;
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'reconnecting';
  lastNotification: ToastNotification | null;
  toasts: ToastNotification[];
  dismissToast: (id: string) => void;
  clearToasts: () => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  connectionStatus: 'disconnected',
  lastNotification: null,
  toasts: [],
  dismissToast: () => {},
  clearToasts: () => {},
});

const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_DELAY_MS = 2000;
const MAX_TOASTS = 5;

export function SocketProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<SocketContextType['connectionStatus']>('disconnected');
  const [lastNotification, setLastNotification] = useState<ToastNotification | null>(null);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const addToast = useCallback((notification: Omit<ToastNotification, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setToasts((prev) => {
      const updated = [{ ...notification, id }, ...prev];
      return updated.slice(0, MAX_TOASTS);
    });

    // Auto-dismiss after 6 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 6000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      // Clean up socket
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }
      setConnectionStatus('disconnected');
      reconnectAttempts.current = 0;
      return;
    }

    const socketUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    const currentUserId = user.id;

    function connect() {
      if (socketRef.current?.connected) return;

      const socket = io(socketUrl, {
        withCredentials: true,
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
        reconnectionDelay: RECONNECT_DELAY_MS,
        reconnectionDelayMax: 10000,
        timeout: 10000,
      });

      socket.on('connect', () => {
        setConnectionStatus('connected');
        reconnectAttempts.current = 0;
        // Join user-specific room
        socket.emit('join', currentUserId);
      });

      socket.on('reconnecting', (attempt) => {
        setConnectionStatus('reconnecting');
        reconnectAttempts.current = attempt;
      });

      socket.on('reconnect', () => {
        setConnectionStatus('connected');
        reconnectAttempts.current = 0;
        // Re-join room on reconnect
        socket.emit('join', currentUserId);
      });

      socket.on('reconnect_error', () => {
        setConnectionStatus('reconnecting');
      });

      socket.on('reconnect_failed', () => {
        setConnectionStatus('disconnected');
        // Try full re-connect after a delay
        reconnectTimer.current = setTimeout(() => {
          reconnectAttempts.current = 0;
          connect();
        }, RECONNECT_DELAY_MS * 2);
      });

      socket.on('disconnect', (reason) => {
        if (reason === 'io server disconnect') {
          // Server disconnected us - try to reconnect
          setConnectionStatus('reconnecting');
          socket.connect();
        } else {
          setConnectionStatus('disconnected');
        }
      });

      socket.on('connect_error', (err) => {
        console.warn('[Socket] Connection error:', err.message);
        setConnectionStatus('reconnecting');
      });

      socket.on('notification', (data: Omit<ToastNotification, 'id'>) => {
        const notification: ToastNotification = {
          ...data,
          id: `notif-${Date.now()}`,
          timestamp: data.timestamp || new Date().toISOString(),
        };
        setLastNotification(notification);
        addToast(notification);
      });

      socketRef.current = socket;
    }

    connect();

    return () => {
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setConnectionStatus('disconnected');
      reconnectAttempts.current = 0;
    };
  }, [isAuthenticated, user?.id, addToast]);

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        isConnected: connectionStatus === 'connected',
        connectionStatus,
        lastNotification,
        toasts,
        dismissToast,
        clearToasts,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
