/**
 * This script simulates real-time updates to cell sites for testing Socket.io functionality.
 * It randomly selects cell sites and updates their status, adds alerts, or changes other properties.
 */

const db = require('../models');
const CellSite = db.CellSite;
const { 
  emitCellSiteUpdate, 
  emitCellSiteAlert, 
  emitCellSiteStatusChange,
  emitSystemNotification
} = require('../socket');

// Possible statuses for cell sites
const STATUSES = ['active', 'maintenance', 'outage'];

// Possible alert severities
const ALERT_SEVERITIES = ['critical', 'warning', 'info'];

// Possible alert messages
const ALERT_MESSAGES = [
  'Signal strength degraded',
  'Hardware failure detected',
  'Power supply issue',
  'Network connectivity problems',
  'Temperature threshold exceeded',
  'Maintenance required',
  'Software update needed',
  'Security alert',
  'Bandwidth utilization high',
  'Backup power activated'
];

// Simulate a random status change
async function simulateStatusChange() {
  try {
    // Get a random cell site
    const count = await CellSite.count();
    const randomOffset = Math.floor(Math.random() * count);
    const [cellSite] = await CellSite.findAll({ limit: 1, offset: randomOffset });
    
    if (!cellSite) {
      console.log('No cell sites found for status change simulation');
      return;
    }
    
    // Get current status
    const oldStatus = cellSite.status;
    
    // Select a new random status (different from current)
    let newStatus;
    do {
      newStatus = STATUSES[Math.floor(Math.random() * STATUSES.length)];
    } while (newStatus === oldStatus);
    
    // Update the cell site
    await cellSite.update({ status: newStatus });
    
    console.log(`Status changed for ${cellSite.name} from ${oldStatus} to ${newStatus}`);
    
    // Emit the status change event
    emitCellSiteStatusChange(cellSite, oldStatus, newStatus);
    
    // Also emit a system notification
    emitSystemNotification(`Cell site ${cellSite.name} status changed to ${newStatus}`, 
      newStatus === 'outage' ? 'error' : 'info');
    
    return cellSite;
  } catch (err) {
    console.error('Error simulating status change:', err);
  }
}

// Simulate a random alert
async function simulateAlert() {
  try {
    // Get a random cell site
    const count = await CellSite.count();
    const randomOffset = Math.floor(Math.random() * count);
    const [cellSite] = await CellSite.findAll({ limit: 1, offset: randomOffset });
    
    if (!cellSite) {
      console.log('No cell sites found for alert simulation');
      return;
    }
    
    // Create a new alert
    const severity = ALERT_SEVERITIES[Math.floor(Math.random() * ALERT_SEVERITIES.length)];
    const message = ALERT_MESSAGES[Math.floor(Math.random() * ALERT_MESSAGES.length)];
    const alertId = Date.now().toString();
    
    // Get current alerts or initialize empty array
    const currentAlerts = cellSite.alerts || [];
    
    // Add the new alert
    const newAlert = {
      id: alertId,
      severity,
      message,
      timestamp: new Date().toISOString()
    };
    
    // Update the cell site with the new alert
    await cellSite.update({
      alerts: [...currentAlerts, newAlert]
    });
    
    console.log(`New ${severity} alert for ${cellSite.name}: ${message}`);
    
    // Emit the alert event
    emitCellSiteAlert(cellSite, newAlert);
    
    // Also emit a cell site update event
    emitCellSiteUpdate(cellSite);
    
    return cellSite;
  } catch (err) {
    console.error('Error simulating alert:', err);
  }
}

// Simulate a general update to a cell site
async function simulateUpdate() {
  try {
    // Get a random cell site
    const count = await CellSite.count();
    const randomOffset = Math.floor(Math.random() * count);
    const [cellSite] = await CellSite.findAll({ limit: 1, offset: randomOffset });
    
    if (!cellSite) {
      console.log('No cell sites found for update simulation');
      return;
    }
    
    // Just emit an update event without changing anything
    console.log(`Simulating update for ${cellSite.name}`);
    emitCellSiteUpdate(cellSite);
    
    return cellSite;
  } catch (err) {
    console.error('Error simulating update:', err);
  }
}

// Run a simulation cycle
async function runSimulationCycle() {
  // Randomly choose which type of event to simulate
  const eventType = Math.floor(Math.random() * 3);
  
  switch (eventType) {
    case 0:
      await simulateStatusChange();
      break;
    case 1:
      await simulateAlert();
      break;
    case 2:
      await simulateUpdate();
      break;
  }
}

// Main function to start the simulation
async function startSimulation(intervalMs = 5000, duration = 60000) {
  console.log(`Starting simulation with updates every ${intervalMs}ms for ${duration}ms`);
  
  // Send initial system notification
  emitSystemNotification('Real-time update simulation started', 'info');
  
  // Run simulation at regular intervals
  const interval = setInterval(runSimulationCycle, intervalMs);
  
  // Stop after the specified duration
  if (duration > 0) {
    setTimeout(() => {
      clearInterval(interval);
      emitSystemNotification('Real-time update simulation ended', 'info');
      console.log('Simulation ended');
      
      // Exit process if running as standalone script
      if (require.main === module) {
        process.exit(0);
      }
    }, duration);
  }
  
  return interval;
}

// If this script is run directly (not imported)
if (require.main === module) {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const intervalMs = parseInt(args[0]) || 5000;
  const durationMs = parseInt(args[1]) || 60000;
  
  // Start the simulation
  startSimulation(intervalMs, durationMs);
}

module.exports = {
  startSimulation,
  simulateStatusChange,
  simulateAlert,
  simulateUpdate
};
