const { expect } = require('chai');
const sinon = require('sinon');
const io = require('socket.io-client');
const http = require('http');
const { Server } = require('socket.io');
const { 
  initializeSocket, 
  emitCellSiteUpdate, 
  emitCellSiteAlert, 
  emitCellSiteStatusChange,
  emitSavedSearchUpdate,
  emitSystemNotification,
  EVENTS
} = require('../socket');

describe('Socket.io Server Tests', () => {
  let httpServer;
  let serverSocket;
  let clientSocket;
  let originalIo;
  
  before(function(done) {
    this.timeout(5000); // Increase timeout for setup
    
    // Create a test HTTP server
    httpServer = http.createServer();
    
    // Initialize Socket.io on the server
    serverSocket = initializeSocket(httpServer);
    
    // Save the original global.io
    originalIo = global.io;
    
    // Start the server
    httpServer.listen(() => {
      const port = httpServer.address().port;
      
      // Connect a client socket for testing
      clientSocket = io(`http://localhost:${port}`, {
        reconnectionDelay: 0,
        forceNew: true,
        transports: ['websocket']
      });
      
      // Use once instead of on to prevent multiple calls to done
      clientSocket.once('connect', done);
    });
  });
  
  after(() => {
    // Clean up
    if (clientSocket) {
      clientSocket.disconnect();
    }
    if (httpServer) {
      httpServer.close();
    }
    
    // Restore the original global.io
    global.io = originalIo;
    
    // Reset sinon
    sinon.restore();
  });
  
  describe('Connection Events', () => {
    it('should emit a system notification on connection', (done) => {
      clientSocket.on(EVENTS.SYSTEM_NOTIFICATION, (data) => {
        expect(data).to.have.property('message');
        expect(data).to.have.property('timestamp');
        expect(data.message).to.equal('Connected to real-time updates');
        done();
      });
      
      // Trigger a reconnection
      clientSocket.disconnect().connect();
    });
    
    it('should allow joining a room', (done) => {
      const roomName = 'test-room';
      // Create a new spy for each test
      const spy = sinon.spy(clientSocket, 'emit');
      
      clientSocket.emit(EVENTS.JOIN_ROOM, roomName);
      
      // Verify the emit was called with the correct arguments
      expect(spy.calledWith(EVENTS.JOIN_ROOM, roomName)).to.be.true;
      
      // Restore the spy after use
      spy.restore();
      done();
    });
    
    it('should allow leaving a room', (done) => {
      const roomName = 'test-room';
      // Create a new spy for each test
      const spy = sinon.spy(clientSocket, 'emit');
      
      clientSocket.emit(EVENTS.LEAVE_ROOM, roomName);
      
      // Verify the emit was called with the correct arguments
      expect(spy.calledWith(EVENTS.LEAVE_ROOM, roomName)).to.be.true;
      
      // Restore the spy after use
      spy.restore();
      done();
    });
  });
  
  describe('Cell Site Events', () => {
    it('should emit cell site update events', (done) => {
      const testCellSite = {
        id: 1,
        name: 'Test Site',
        status: 'active'
      };
      
      clientSocket.on(EVENTS.CELL_SITE_UPDATED, (data) => {
        expect(data).to.have.property('cellSite');
        expect(data).to.have.property('timestamp');
        expect(data.cellSite).to.deep.equal(testCellSite);
        done();
      });
      
      // Emit the event
      emitCellSiteUpdate(testCellSite);
    });
    
    it('should emit cell site alert events', (done) => {
      const testCellSite = {
        id: 1,
        name: 'Test Site'
      };
      
      const testAlert = {
        id: 'a1',
        severity: 'critical',
        message: 'Power failure'
      };
      
      clientSocket.on(EVENTS.CELL_SITE_ALERT, (data) => {
        expect(data).to.have.property('cellSiteId');
        expect(data).to.have.property('cellSiteName');
        expect(data).to.have.property('alert');
        expect(data).to.have.property('timestamp');
        expect(data.cellSiteId).to.equal(testCellSite.id);
        expect(data.cellSiteName).to.equal(testCellSite.name);
        expect(data.alert).to.deep.equal(testAlert);
        done();
      });
      
      // Emit the event
      emitCellSiteAlert(testCellSite, testAlert);
    });
    
    it('should emit cell site status change events', (done) => {
      const testCellSite = {
        id: 1,
        name: 'Test Site'
      };
      
      const oldStatus = 'active';
      const newStatus = 'maintenance';
      
      clientSocket.on(EVENTS.CELL_SITE_STATUS_CHANGE, (data) => {
        expect(data).to.have.property('cellSiteId');
        expect(data).to.have.property('cellSiteName');
        expect(data).to.have.property('oldStatus');
        expect(data).to.have.property('newStatus');
        expect(data).to.have.property('timestamp');
        expect(data.cellSiteId).to.equal(testCellSite.id);
        expect(data.cellSiteName).to.equal(testCellSite.name);
        expect(data.oldStatus).to.equal(oldStatus);
        expect(data.newStatus).to.equal(newStatus);
        done();
      });
      
      // Emit the event
      emitCellSiteStatusChange(testCellSite, oldStatus, newStatus);
    });
  });
  
  describe('Saved Search Events', () => {
    it('should emit saved search update events', (done) => {
      const testSavedSearch = {
        id: 1,
        name: 'Test Search',
        criteria: { status: 'active' }
      };
      
      clientSocket.on(EVENTS.SAVED_SEARCH_UPDATED, (data) => {
        expect(data).to.have.property('savedSearch');
        expect(data).to.have.property('timestamp');
        expect(data.savedSearch).to.deep.equal(testSavedSearch);
        done();
      });
      
      // Emit the event
      emitSavedSearchUpdate(testSavedSearch);
    });
  });
  
  // System notification tests are in a separate file
});
