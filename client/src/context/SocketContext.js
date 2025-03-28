import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

// Create context
const SocketContext = createContext(null);

// Socket.io event types (must match server-side events)
export const EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  RECONNECT: 'reconnect',
  ERROR: 'error',
  
  // Cell site events
  CELL_SITE_UPDATED: 'cell_site_updated',
  CELL_SITE_ALERT: 'cell_site_alert',
  CELL_SITE_STATUS_CHANGE: 'cell_site_status_change',
  
  // Saved search events
  SAVED_SEARCH_UPDATED: 'saved_search_updated',
  
  // User events
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  
  // System events
  SYSTEM_NOTIFICATION: 'system_notification'
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  // Initialize socket connection
  useEffect(() => {
    // Connect to the server
    const socketInstance = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:3002', {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: true,
      withCredentials: true
    });

    // Connection event handlers
    socketInstance.on(EVENTS.CONNECT, () => {
      console.log('Socket connected');
      setIsConnected(true);
      setReconnectAttempts(0);
    });

    socketInstance.on(EVENTS.DISCONNECT, (reason) => {
      console.log(`Socket disconnected: ${reason}`);
      setIsConnected(false);
    });

    socketInstance.on(EVENTS.ERROR, (error) => {
      console.error('Socket error:', error);
    });

    socketInstance.io.on('reconnect_attempt', (attempt) => {
      console.log(`Socket reconnection attempt ${attempt}`);
      setReconnectAttempts(attempt);
    });

    socketInstance.io.on('reconnect', () => {
      console.log('Socket reconnected');
      setIsConnected(true);
    });

    socketInstance.io.on('reconnect_failed', () => {
      console.log('Socket reconnection failed');
      // Show a notification to the user
      addNotification({
        type: 'error',
        message: 'Connection to server lost. Please refresh the page.',
        timestamp: new Date().toISOString()
      });
    });

    // System notifications
    socketInstance.on(EVENTS.SYSTEM_NOTIFICATION, (notification) => {
      console.log('System notification:', notification);
      addNotification({
        ...notification,
        id: Date.now(),
        read: false
      });
    });

    // Cell site alerts
    socketInstance.on(EVENTS.CELL_SITE_ALERT, (data) => {
      console.log('Cell site alert:', data);
      setLastMessage(data);
      addNotification({
        type: 'alert',
        message: `Alert for ${data.cellSiteName}: ${data.alert}`,
        timestamp: data.timestamp,
        id: Date.now(),
        read: false,
        cellSiteId: data.cellSiteId
      });
    });

    // Cell site status changes
    socketInstance.on(EVENTS.CELL_SITE_STATUS_CHANGE, (data) => {
      console.log('Cell site status change:', data);
      setLastMessage(data);
      addNotification({
        type: 'status',
        message: `${data.cellSiteName} status changed from ${data.oldStatus} to ${data.newStatus}`,
        timestamp: data.timestamp,
        id: Date.now(),
        read: false,
        cellSiteId: data.cellSiteId
      });
    });

    // Store socket instance
    setSocket(socketInstance);

    // Cleanup on unmount
    return () => {
      socketInstance.disconnect();
    };
  }, []);

  // Add a notification to the list
  const addNotification = (notification) => {
    setNotifications(prev => [notification, ...prev].slice(0, 50)); // Keep last 50 notifications
  };

  // Mark a notification as read
  const markNotificationAsRead = (id) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true } 
          : notification
      )
    );
  };

  // Mark all notifications as read
  const markAllNotificationsAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  // Clear all notifications
  const clearNotifications = () => {
    setNotifications([]);
  };

  // Join a room for specific updates
  const joinRoom = (room) => {
    if (socket && isConnected) {
      socket.emit(EVENTS.JOIN_ROOM, room);
    }
  };

  // Leave a room
  const leaveRoom = (room) => {
    if (socket && isConnected) {
      socket.emit(EVENTS.LEAVE_ROOM, room);
    }
  };

  // Context value
  const value = {
    socket,
    isConnected,
    lastMessage,
    notifications,
    reconnectAttempts,
    joinRoom,
    leaveRoom,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotifications
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

// Custom hook to use the socket context
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
