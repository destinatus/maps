import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Notifications from './Notifications';
import { SocketProvider } from '../context/SocketContext';
import * as socketHooks from '../context/SocketContext';

// Define the interface for the socket context
interface Notification {
  id: number;
  type: string;
  message: string;
  timestamp: string;
  read: boolean;
  cellSiteId?: string;
}

interface SocketContextType {
  notifications: Notification[];
  isConnected: boolean;
  reconnectAttempts: number;
  markNotificationAsRead: (id: number) => void;
  markAllNotificationsAsRead: () => void;
  clearNotifications: () => void;
}

// Mock the useSocket hook
jest.mock('../context/SocketContext', () => {
  const originalModule = jest.requireActual('../context/SocketContext');
  return {
    ...originalModule,
    useSocket: jest.fn()
  };
});

// Type for the mocked useSocket function
type MockUseSocket = jest.Mock<SocketContextType>;

describe('Notifications Component', () => {
  // Mock notification data
  const mockNotifications = [
    {
      id: 1,
      type: 'alert',
      message: 'Critical alert for Site A',
      timestamp: '2025-03-28T08:30:00.000Z',
      read: false,
      cellSiteId: '1'
    },
    {
      id: 2,
      type: 'status',
      message: 'Site B status changed from active to maintenance',
      timestamp: '2025-03-28T08:35:00.000Z',
      read: false,
      cellSiteId: '2'
    },
    {
      id: 3,
      type: 'info',
      message: 'Connected to real-time updates',
      timestamp: '2025-03-28T08:25:00.000Z',
      read: true
    }
  ];
  
  // Mock socket context functions
  const mockMarkNotificationAsRead = jest.fn();
  const mockMarkAllNotificationsAsRead = jest.fn();
  const mockClearNotifications = jest.fn();
  
  beforeEach(() => {
    // Setup the mock implementation for useSocket
    (socketHooks.useSocket as unknown as MockUseSocket).mockReturnValue({
      notifications: mockNotifications,
      isConnected: true,
      reconnectAttempts: 0,
      markNotificationAsRead: mockMarkNotificationAsRead,
      markAllNotificationsAsRead: mockMarkAllNotificationsAsRead,
      clearNotifications: mockClearNotifications
    });
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  it('should render the notifications toggle button', () => {
    render(<Notifications />);
    
    // Check that the toggle button is rendered
    const toggleButton = screen.getByRole('button', { name: /notifications/i });
    expect(toggleButton).toBeInTheDocument();
  });
  
  it('should display the correct unread count badge', () => {
    render(<Notifications />);
    
    // Check that the badge shows the correct count (2 unread notifications)
    const badge = screen.getByText('2');
    expect(badge).toBeInTheDocument();
  });
  
  it('should expand the notifications panel when toggle is clicked', () => {
    render(<Notifications />);
    
    // Initially, the panel should not be visible
    expect(screen.queryByText('Mark all as read')).not.toBeInTheDocument();
    
    // Click the toggle button
    fireEvent.click(screen.getByRole('button', { name: /notifications/i }));
    
    // Now the panel should be visible
    expect(screen.getByText('Mark all as read')).toBeInTheDocument();
    expect(screen.getByText('Clear all')).toBeInTheDocument();
  });
  
  it('should display all notifications when expanded', () => {
    render(<Notifications />);
    
    // Expand the panel
    fireEvent.click(screen.getByRole('button', { name: /notifications/i }));
    
    // Check that all notifications are displayed
    expect(screen.getByText('Critical alert for Site A')).toBeInTheDocument();
    expect(screen.getByText('Site B status changed from active to maintenance')).toBeInTheDocument();
    expect(screen.getByText('Connected to real-time updates')).toBeInTheDocument();
  });
  
  it('should call markNotificationAsRead when a notification is clicked', () => {
    render(<Notifications />);
    
    // Expand the panel
    fireEvent.click(screen.getByRole('button', { name: /notifications/i }));
    
    // Click on a notification
    fireEvent.click(screen.getByText('Critical alert for Site A'));
    
    // Check that markNotificationAsRead was called with the correct ID
    expect(mockMarkNotificationAsRead).toHaveBeenCalledWith(1);
  });
  
  it('should call markAllNotificationsAsRead when "Mark all as read" is clicked', () => {
    render(<Notifications />);
    
    // Expand the panel
    fireEvent.click(screen.getByRole('button', { name: /notifications/i }));
    
    // Click the "Mark all as read" button
    fireEvent.click(screen.getByText('Mark all as read'));
    
    // Check that markAllNotificationsAsRead was called
    expect(mockMarkAllNotificationsAsRead).toHaveBeenCalled();
  });
  
  it('should call clearNotifications when "Clear all" is clicked', () => {
    render(<Notifications />);
    
    // Expand the panel
    fireEvent.click(screen.getByRole('button', { name: /notifications/i }));
    
    // Click the "Clear all" button
    fireEvent.click(screen.getByText('Clear all'));
    
    // Check that clearNotifications was called
    expect(mockClearNotifications).toHaveBeenCalled();
  });
  
  it('should display the connection status indicator', () => {
    render(<Notifications />);
    
    // Check that the connection status indicator is displayed
    const connectionStatus = screen.getByTitle('Connected');
    expect(connectionStatus).toBeInTheDocument();
  });
  
  it('should display different connection status when disconnected', () => {
    // Mock disconnected state
    (socketHooks.useSocket as unknown as MockUseSocket).mockReturnValue({
      notifications: mockNotifications,
      isConnected: false,
      reconnectAttempts: 2,
      markNotificationAsRead: mockMarkNotificationAsRead,
      markAllNotificationsAsRead: mockMarkAllNotificationsAsRead,
      clearNotifications: mockClearNotifications
    });
    
    render(<Notifications />);
    
    // Check that the disconnected status is displayed
    const connectionStatus = screen.getByTitle('Disconnected (Attempt 2/5)');
    expect(connectionStatus).toBeInTheDocument();
  });
  
    it('should apply different styles to different notification types', () => {
      render(<Notifications />);
      
      // Expand the panel
      fireEvent.click(screen.getByRole('button', { name: /notifications/i }));
      
      // Get notification elements by their message text
      const criticalAlert = screen.getByText('Critical alert for Site A');
      const statusChange = screen.getByText('Site B status changed from active to maintenance');
      const connectionMsg = screen.getByText('Connected to real-time updates');
      
      // Check that they have the correct classes
      expect(criticalAlert.closest('.notification')).toHaveClass('alert');
      expect(statusChange.closest('.notification')).toHaveClass('status');
      expect(connectionMsg.closest('.notification')).toHaveClass('info');
    });
    
    it('should apply "unread" class to unread notifications', () => {
      render(<Notifications />);
      
      // Expand the panel
      fireEvent.click(screen.getByRole('button', { name: /notifications/i }));
      
      // Get notification elements by their message text
      const criticalAlert = screen.getByText('Critical alert for Site A');
      const statusChange = screen.getByText('Site B status changed from active to maintenance');
      const connectionMsg = screen.getByText('Connected to real-time updates');
      
      // Check that unread notifications have the unread class
      expect(criticalAlert.closest('.notification')).toHaveClass('unread');
      expect(statusChange.closest('.notification')).toHaveClass('unread');
      expect(connectionMsg.closest('.notification')).not.toHaveClass('unread');
    });
  
  it('should format timestamps correctly', () => {
    // Mock the Date object to return a fixed time
    const mockDate = new Date('2025-03-28T09:00:00.000Z');
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);
    
    render(<Notifications />);
    
    // Expand the panel
    fireEvent.click(screen.getByRole('button', { name: /notifications/i }));
    
    // Check that timestamps are formatted correctly
    // Note: The exact format will depend on the user's locale
    // This test assumes a US locale
    const times = screen.getAllByText(/\d+:\d+:\d+/);
    expect(times).toHaveLength(3);
    
    // Restore the original Date implementation
    jest.restoreAllMocks();
  });
  
  it('should display "No notifications" when there are no notifications', () => {
    // Mock empty notifications array
    (socketHooks.useSocket as unknown as MockUseSocket).mockReturnValue({
      notifications: [],
      isConnected: true,
      reconnectAttempts: 0,
      markNotificationAsRead: mockMarkNotificationAsRead,
      markAllNotificationsAsRead: mockMarkAllNotificationsAsRead,
      clearNotifications: mockClearNotifications
    });
    
    render(<Notifications />);
    
    // Expand the panel
    fireEvent.click(screen.getByRole('button', { name: /notifications/i }));
    
    // Check that the "No notifications" message is displayed
    expect(screen.getByText('No notifications')).toBeInTheDocument();
  });
});
