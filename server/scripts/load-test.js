/**
 * Load Testing Script for Cell Site Mapping Application
 * 
 * This script generates a large dataset of 200,000 cell sites and tests
 * the performance of the application with this dataset.
 */

const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');
const config = require('config');
const { Sequelize } = require('sequelize');
const db = require('../models');
const { emitCellSiteUpdate } = require('../socket');

// Configuration
const TOTAL_SITES = 200000;
const BATCH_SIZE = 1000;
const US_BOUNDS = {
  minLat: 24.396308, // Southern tip of Florida
  maxLat: 49.384358, // Northern border with Canada
  minLng: -125.000000, // West Coast
  maxLng: -66.934570 // East Coast
};

// Technology types and their distribution percentages
const TECHNOLOGIES = [
  { name: 'LTE', percentage: 0.5 },
  { name: '5G', percentage: 0.3 },
  { name: 'mmWave', percentage: 0.2 }
];

// Status types and their distribution percentages
const STATUSES = [
  { name: 'active', percentage: 0.8 },
  { name: 'maintenance', percentage: 0.15 },
  { name: 'outage', percentage: 0.05 }
];

// Alert severities and their distribution percentages
const ALERT_SEVERITIES = [
  { name: 'info', percentage: 0.6 },
  { name: 'warning', percentage: 0.3 },
  { name: 'critical', percentage: 0.1 }
];

// Alert messages
const ALERT_MESSAGES = [
  'Signal strength degradation',
  'Power supply issue',
  'Hardware failure detected',
  'Connectivity loss',
  'Temperature warning',
  'Bandwidth saturation',
  'Interference detected',
  'Scheduled maintenance',
  'Software update required',
  'Security alert'
];

// Task types
const TASK_TYPES = [
  'Hardware replacement',
  'Software update',
  'Routine maintenance',
  'Signal optimization',
  'Power system check',
  'Cooling system maintenance',
  'Security audit',
  'Network configuration',
  'Antenna alignment',
  'Capacity upgrade'
];

// Task statuses and their distribution percentages
const TASK_STATUSES = [
  { name: 'pending', percentage: 0.4 },
  { name: 'in-progress', percentage: 0.4 },
  { name: 'completed', percentage: 0.2 }
];

// Random data generation utilities
function getRandomInRange(min, max) {
  return Math.random() * (max - min) + min;
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomWithDistribution(items) {
  const rand = Math.random();
  let cumulativeProbability = 0;
  
  for (const item of items) {
    cumulativeProbability += item.percentage;
    if (rand < cumulativeProbability) {
      return item.name;
    }
  }
  
  return items[0].name; // Fallback to first item
}

function generateRandomCellSite(index) {
  // Generate a random location within the US bounds
  const latitude = getRandomInRange(US_BOUNDS.minLat, US_BOUNDS.maxLat);
  const longitude = getRandomInRange(US_BOUNDS.minLng, US_BOUNDS.maxLng);
  
  // Determine technology based on distribution
  const technology = getRandomWithDistribution(TECHNOLOGIES);
  
  // Determine status based on distribution
  const status = getRandomWithDistribution(STATUSES);
  
  // Generate a random number of alerts (0-3)
  const alertCount = getRandomInt(0, 3);
  const alerts = [];
  
  for (let i = 0; i < alertCount; i++) {
    const severity = getRandomWithDistribution(ALERT_SEVERITIES);
    const message = getRandomElement(ALERT_MESSAGES);
    alerts.push({ severity, message });
  }
  
  // Generate a random number of tasks (0-2)
  const taskCount = getRandomInt(0, 2);
  const tasks = [];
  
  for (let i = 0; i < taskCount; i++) {
    const type = getRandomElement(TASK_TYPES);
    const status = getRandomWithDistribution(TASK_STATUSES);
    tasks.push({ type, status });
  }
  
  // Create a cell site object
  return {
    name: `Cell Site ${index}`,
    latitude,
    longitude,
    technologies: [technology],
    status,
    alerts: alerts.map(a => `${a.severity}:${a.message}`),
    workTasks: tasks.map(t => `${t.type}:${t.status}`),
    inventory: {
      antennas: getRandomInt(1, 4),
      radios: getRandomInt(2, 6),
      batteries: getRandomInt(1, 3)
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

// Generate cell sites in batches
async function generateCellSites() {
  console.log(`Generating ${TOTAL_SITES} cell sites for load testing...`);
  
  const startTime = performance.now();
  let sitesGenerated = 0;
  
  try {
    // Clear existing cell sites
    await db.CellSite.destroy({ truncate: true, cascade: true });
    console.log('Cleared existing cell sites');
    
    // Generate and insert cell sites in batches
    for (let i = 0; i < TOTAL_SITES; i += BATCH_SIZE) {
      const batchSize = Math.min(BATCH_SIZE, TOTAL_SITES - i);
      const batch = [];
      
      for (let j = 0; j < batchSize; j++) {
        batch.push(generateRandomCellSite(i + j + 1));
      }
      
      await db.CellSite.bulkCreate(batch);
      sitesGenerated += batchSize;
      
      // Log progress
      const progress = (sitesGenerated / TOTAL_SITES * 100).toFixed(1);
      console.log(`Progress: ${progress}% (${sitesGenerated}/${TOTAL_SITES})`);
    }
    
    const endTime = performance.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log(`Successfully generated ${sitesGenerated} cell sites in ${duration} seconds`);
    return true;
  } catch (error) {
    console.error('Error generating cell sites:', error);
    return false;
  }
}

// Test API performance with large dataset
async function testApiPerformance() {
  console.log('\nTesting API performance with large dataset...');
  
  const tests = [
    {
      name: 'Get all cell sites',
      fn: async () => {
        const count = await db.CellSite.count();
        console.log(`Total cell sites in database: ${count}`);
      }
    },
    {
      name: 'Get cell sites with pagination (page 1, 100 items)',
      fn: async () => {
        await db.CellSite.findAll({
          limit: 100,
          offset: 0
        });
      }
    },
    {
      name: 'Search cell sites by technology',
      fn: async () => {
        await db.CellSite.findAll({
          where: {
            technologies: {
              [Sequelize.Op.contains]: ['5G']
            }
          },
          limit: 100
        });
      }
    },
    {
      name: 'Search cell sites by geographic bounds',
      fn: async () => {
        await db.CellSite.findAll({
          where: {
            latitude: {
              [Sequelize.Op.between]: [37.7, 37.8]
            },
            longitude: {
              [Sequelize.Op.between]: [-122.5, -122.4]
            }
          },
          limit: 100
        });
      }
    },
    {
      name: 'Complex search with multiple criteria',
      fn: async () => {
        await db.CellSite.findAll({
          where: {
            technologies: {
              [Sequelize.Op.contains]: ['5G']
            },
            status: 'active',
            latitude: {
              [Sequelize.Op.between]: [30, 40]
            },
            longitude: {
              [Sequelize.Op.between]: [-120, -100]
            }
          },
          limit: 100
        });
      }
    }
  ];
  
  // Run each test and measure performance
  for (const test of tests) {
    console.log(`\nRunning test: ${test.name}`);
    
    const startTime = performance.now();
    
    try {
      await test.fn();
      
      const endTime = performance.now();
      const duration = (endTime - startTime).toFixed(2);
      
      console.log(`✓ Test completed in ${duration}ms`);
    } catch (error) {
      console.error(`✗ Test failed:`, error);
    }
  }
}

// Test real-time updates with large dataset
async function testRealTimeUpdates() {
  console.log('\nTesting real-time updates with large dataset...');
  
  try {
    // Get 10 random cell sites
    const cellSites = await db.CellSite.findAll({
      order: Sequelize.literal('random()'),
      limit: 10
    });
    
    console.log(`Selected ${cellSites.length} random cell sites for update testing`);
    
    // Measure performance of emitting updates
    const startTime = performance.now();
    
    for (const site of cellSites) {
      // Update the site status
      site.status = getRandomWithDistribution(STATUSES);
      await site.save();
      
      // Emit the update
      emitCellSiteUpdate(site);
    }
    
    const endTime = performance.now();
    const duration = (endTime - startTime).toFixed(2);
    
    console.log(`✓ Emitted ${cellSites.length} real-time updates in ${duration}ms`);
  } catch (error) {
    console.error('Error testing real-time updates:', error);
  }
}

// Export results to a JSON file
async function exportResults(results) {
  const filePath = path.join(__dirname, '../load-test-results.json');
  
  try {
    await fs.promises.writeFile(
      filePath,
      JSON.stringify(results, null, 2)
    );
    
    console.log(`\nTest results exported to ${filePath}`);
  } catch (error) {
    console.error('Error exporting results:', error);
  }
}

// Main function to run all tests
async function runLoadTests() {
  console.log('Starting load tests...');
  console.log('====================\n');
  
  const results = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    tests: {}
  };
  
  // Generate cell sites
  console.log('Step 1: Generate test data');
  const startGenerate = performance.now();
  const generateSuccess = await generateCellSites();
  const endGenerate = performance.now();
  
  results.tests.dataGeneration = {
    success: generateSuccess,
    duration: (endGenerate - startGenerate) / 1000,
    sitesGenerated: TOTAL_SITES
  };
  
  if (!generateSuccess) {
    console.error('Failed to generate test data. Aborting tests.');
    await exportResults(results);
    return;
  }
  
  // Test API performance
  console.log('\nStep 2: Test API performance');
  const startApi = performance.now();
  await testApiPerformance();
  const endApi = performance.now();
  
  results.tests.apiPerformance = {
    duration: (endApi - startApi) / 1000
  };
  
  // Test real-time updates
  console.log('\nStep 3: Test real-time updates');
  const startRealTime = performance.now();
  await testRealTimeUpdates();
  const endRealTime = performance.now();
  
  results.tests.realTimeUpdates = {
    duration: (endRealTime - startRealTime) / 1000
  };
  
  // Export results
  await exportResults(results);
  
  console.log('\nLoad tests completed!');
  console.log('====================');
}

// Run the tests if this script is executed directly
if (require.main === module) {
  runLoadTests()
    .then(() => {
      console.log('Tests completed successfully');
      process.exit(0);
    })
    .catch(err => {
      console.error('Tests failed:', err);
      process.exit(1);
    });
}

module.exports = {
  runLoadTests,
  generateCellSites,
  testApiPerformance,
  testRealTimeUpdates
};
