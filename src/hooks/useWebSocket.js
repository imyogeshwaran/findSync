import { useEffect, useRef, useCallback, useState } from 'react';
import io from 'socket.io-client';
import { getAuthToken } from './api';

const SOCKET_URL = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : 'http://localhost:3005';

export const useWebSocket = (userId) => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const reconnectTimeoutRef = useRef(null);
  const maxReconnectAttemptsRef = useRef(0);

  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      console.log('✅ Socket already connected');
      return;
    }

    console.log(`🔌 Attempting WebSocket connection to ${SOCKET_URL}`);
    
    try {
      const socket = io(SOCKET_URL, {
        auth: {
          token: getAuthToken()
        },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 10,
        transports: ['websocket', 'polling']
      });

      socket.on('connect', () => {
        console.log('✅ WebSocket connected:', socket.id);
        setIsConnected(true);
        setConnectionError(null);
        maxReconnectAttemptsRef.current = 0;

        // Notify server of user connection
        if (userId) {
          socket.emit('user_connected', userId);
        }
      });

      socket.on('connect_error', (error) => {
        console.error('❌ Connection error:', error);
        setConnectionError(error.message);
      });

      socket.on('disconnect', (reason) => {
        console.log('⬜ WebSocket disconnected:', reason);
        setIsConnected(false);
      });

      socket.on('error', (error) => {
        console.error('🔴 Socket error:', error);
        setConnectionError(error);
      });

      socketRef.current = socket;
    } catch (error) {
      console.error('❌ Failed to create socket:', error);
      setConnectionError(error.message);
    }
  }, [userId]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);

  const emit = useCallback((event, data) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn(`⚠️ Socket not connected. Cannot emit event: ${event}`);
    }
  }, []);

  const on = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  }, []);

  const off = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback);
    }
  }, []);

  // Connect on mount
  useEffect(() => {
    if (userId) {
      connect();
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [userId, connect]);

  return {
    socket: socketRef.current,
    isConnected,
    connectionError,
    emit,
    on,
    off,
    disconnect
  };
};

export default useWebSocket;
