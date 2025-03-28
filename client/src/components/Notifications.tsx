import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';

interface Notification {
  id: number;
  type: 'alert' | 'status' | 'info' | 'error';
  message: string;
  timestamp: string;
  read: boolean;
  cellSiteId?: string;
}

// Extend the SocketContext type to include the notifications array
interface SocketContextType {
  notifications: Notification[];
  isConnected: boolean;
  reconnectAttempts: number;
  markNotificationAsRead: (id: number) => void;
  markAllNotificationsAsRead: () => void;
  clearNotifications: () => void;
}

const Notifications: React.FC = () => {
  const { 
    notifications, 
    isConnected, 
    reconnectAttempts,
    markNotificationAsRead, 
    markAllNotificationsAsRead, 
    clearNotifications 
  } = useSocket() as SocketContextType;
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Update unread count when notifications change
  useEffect(() => {
    const count = notifications.filter(notification => !notification.read).length;
    setUnreadCount(count);
    
    // Update document title if there are unread notifications
    if (count > 0) {
      document.title = `(${count}) Cell Site Mapping`;
    } else {
      document.title = 'Cell Site Mapping';
    }
  }, [notifications]);
  
  // Format timestamp to local time
  const formatTime = (timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString();
    } catch (e) {
      return 'Unknown time';
    }
  };
  
  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    markNotificationAsRead(notification.id);
    
    // If it's a cell site notification, we could navigate to that cell site
    if (notification.cellSiteId) {
      // This would be implemented based on your app's navigation
      console.log(`Navigate to cell site ${notification.cellSiteId}`);
    }
  };
  
  // Get icon based on notification type
  const getNotificationIcon = (type: string): string => {
    switch (type) {
      case 'alert':
        return '🔔';
      case 'status':
        return '🔄';
      case 'error':
        return '❌';
      default:
        return 'ℹ️';
    }
  };
  
  // Get CSS class based on notification type
  const getNotificationClass = (notification: Notification): string => {
    let baseClass = 'notification';
    
    if (!notification.read) {
      baseClass += ' unread';
    }
    
    switch (notification.type) {
      case 'alert':
        return `${baseClass} alert`;
      case 'status':
        return `${baseClass} status`;
      case 'error':
        return `${baseClass} error`;
      default:
        return `${baseClass} info`;
    }
  };
  
  return (
    <div className="notifications-container">
      <div className="notifications-header">
        <button 
          className="notifications-toggle"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {unreadCount > 0 && (
            <span className="notification-badge">{unreadCount}</span>
          )}
          <span className="notifications-icon">🔔</span>
          <span className="notifications-title">Notifications</span>
        </button>
        
        {/* Connection status indicator */}
        <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? (
            <span title="Connected">●</span>
          ) : (
            <span title={`Disconnected (Attempt ${reconnectAttempts}/5)`}>●</span>
          )}
        </div>
      </div>
      
      {isExpanded && (
        <div className="notifications-panel">
          <div className="notifications-actions">
            <button onClick={markAllNotificationsAsRead}>Mark all as read</button>
            <button onClick={clearNotifications}>Clear all</button>
          </div>
          
          <div className="notifications-list">
            {notifications.length === 0 ? (
              <div className="no-notifications">No notifications</div>
            ) : (
              notifications.map((notification) => (
                <div 
                  key={notification.id}
                  className={getNotificationClass(notification)}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-icon">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="notification-content">
                    <div className="notification-message">{notification.message}</div>
                    <div className="notification-time">{formatTime(notification.timestamp)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;
