import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      const newSocket = io(process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000', {
        auth: {
          token: localStorage.getItem('token')
        },
        transports: ['websocket', 'polling']
      });

      newSocket.on('connect', () => {
        console.log('Connected to server');
        setIsConnected(true);
        toast.success('Connected to real-time messaging');
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from server');
        setIsConnected(false);
        toast.error('Disconnected from real-time messaging');
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        toast.error('Connection error. Trying to reconnect...');
      });

      newSocket.on('message_received', (data) => {
        console.log('New message received:', data);
        setUnreadCount(prev => prev + 1);
        toast.success(`New message from ${data.sender?.profile?.firstName || data.sender?.username}`);
      });

      newSocket.on('user_typing', (data) => {
        console.log('User typing:', data);
      });

      newSocket.on('status_updated', (data) => {
        console.log('Order status updated:', data);
        toast.success(`Order status updated to: ${data.status}`);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [isAuthenticated, user]);

  const joinOrderRoom = (orderId) => {
    if (socket && isConnected) {
      socket.emit('join_order', orderId);
      console.log(`Joined order room: ${orderId}`);
    }
  };

  const leaveOrderRoom = (orderId) => {
    if (socket && isConnected) {
      socket.emit('leave_order', orderId);
      console.log(`Left order room: ${orderId}`);
    }
  };

  const sendMessage = (orderId, message) => {
    if (socket && isConnected) {
      socket.emit('new_message', {
        orderId,
        message,
        timestamp: new Date().toISOString()
      });
    }
  };

  const sendTypingIndicator = (orderId, isTyping) => {
    if (socket && isConnected) {
      socket.emit('typing', {
        orderId,
        isTyping,
        userId: user?._id
      });
    }
  };

  const updateOrderStatus = (orderId, status) => {
    if (socket && isConnected) {
      socket.emit('order_status_update', {
        orderId,
        status,
        timestamp: new Date().toISOString()
      });
    }
  };

  const resetUnreadCount = () => {
    setUnreadCount(0);
  };

  const value = {
    socket,
    isConnected,
    unreadCount,
    joinOrderRoom,
    leaveOrderRoom,
    sendMessage,
    sendTypingIndicator,
    updateOrderStatus,
    resetUnreadCount
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}; 