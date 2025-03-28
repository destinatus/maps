const { Server } = require('socket.io');
const config = require('config');
const db = require('../models');
const CellSite = db.CellSite;
const SavedSearch = db.SavedSearch;

// Socket.io event types
const EVENTS = {
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

// Initialize Socket.io
function initializeSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: config.get('server.env') === 'production' 
        ? config.get('server.host') 
        : 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Connection handling
  io.on(EVENTS.CONNECT, (socket) => {
    console.log(`Client connected: ${socket.id}`);
    
    // Send initial system notification
    socket.emit(EVENTS.SYSTEM_NOTIFICATION, {
      message: 'Connected to real-time updates',
      timestamp: new Date().toISOString()
    });
    
    // Handle room joining (for specific cell site updates)
    socket.on(EVENTS.JOIN_ROOM, (room) => {
      socket.join(room);
      console.log(`Client ${socket.id} joined room: ${room}`);
    });
    
    // Handle room leaving
    socket.on(EVENTS.LEAVE_ROOM, (room) => {
      socket.leave(room);
      console.log(`Client ${socket.id} left room: ${room}`);
    });
    
    // Handle disconnection
    socket.on(EVENTS.DISCONNECT, () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
  
  // Store io instance for external access
  global.io = io;
  
  return io;
}

// Emit cell site update event
function emitCellSiteUpdate(cellSite) {
  if (!global.io) return;
  
  // Emit to everyone
  global.io.emit(EVENTS.CELL_SITE_UPDATED, {
    cellSite,
    timestamp: new Date().toISOString()
  });
  
  // Also emit to the specific cell site room
  global.io.to(`cell-site-${cellSite.id}`).emit(EVENTS.CELL_SITE_UPDATED, {
    cellSite,
    timestamp: new Date().toISOString()
  });
}

// Emit cell site alert event
function emitCellSiteAlert(cellSite, alert) {
  if (!global.io) return;
  
  const payload = {
    cellSiteId: cellSite.id,
    cellSiteName: cellSite.name,
    alert,
    timestamp: new Date().toISOString()
  };
  
  // Emit to everyone
  global.io.emit(EVENTS.CELL_SITE_ALERT, payload);
  
  // Also emit to the specific cell site room
  global.io.to(`cell-site-${cellSite.id}`).emit(EVENTS.CELL_SITE_ALERT, payload);
}

// Emit cell site status change event
function emitCellSiteStatusChange(cellSite, oldStatus, newStatus) {
  if (!global.io) return;
  
  const payload = {
    cellSiteId: cellSite.id,
    cellSiteName: cellSite.name,
    oldStatus,
    newStatus,
    timestamp: new Date().toISOString()
  };
  
  // Emit to everyone
  global.io.emit(EVENTS.CELL_SITE_STATUS_CHANGE, payload);
  
  // Also emit to the specific cell site room
  global.io.to(`cell-site-${cellSite.id}`).emit(EVENTS.CELL_SITE_STATUS_CHANGE, payload);
}

// Emit saved search update event
function emitSavedSearchUpdate(savedSearch) {
  if (!global.io) return;
  
  global.io.emit(EVENTS.SAVED_SEARCH_UPDATED, {
    savedSearch,
    timestamp: new Date().toISOString()
  });
}

// Emit system notification
function emitSystemNotification(message, type = 'info') {
  if (!global.io) return;
  
  global.io.emit(EVENTS.SYSTEM_NOTIFICATION, {
    message,
    type,
    timestamp: new Date().toISOString()
  });
}

module.exports = {
  initializeSocket,
  EVENTS,
  emitCellSiteUpdate,
  emitCellSiteAlert,
  emitCellSiteStatusChange,
  emitSavedSearchUpdate,
  emitSystemNotification
};
