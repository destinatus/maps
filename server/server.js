const express = require('express');
const config = require('config');
const cors = require('cors');
const path = require('path');
const redis = require('redis');
const http = require('http');
const { initializeSocket } = require('./socket');

const app = express();
const server = http.createServer(app);

// Redis Client Setup
const redisClient = redis.createClient({
  socket: {
    host: config.get('redis.host'),
    port: config.get('redis.port')
  }
});

redisClient.on('error', (err) => {
  console.error('Redis error:', err);
});

(async () => {
  await redisClient.connect();
  console.log('Redis connected successfully');
})();

// Make Redis client available in app
app.locals.redis = redisClient;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/cell-sites', require('./routes/cell-sites'));
app.use('/api/saved-searches', require('./routes/saved-searches'));

// Simulation endpoint for testing real-time updates
app.post('/api/simulation/start', async (req, res) => {
  try {
    const { intervalMs = 5000, durationMs = 60000 } = req.body;
    
    // Import the simulation module
    const { startSimulation } = require('./scripts/simulate-updates');
    
    // Start the simulation
    await startSimulation(intervalMs, durationMs);
    
    res.json({ 
      message: 'Simulation started', 
      intervalMs, 
      durationMs 
    });
  } catch (err) {
    console.error('Error starting simulation:', err);
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/simulation/stop', (req, res) => {
  // This is a placeholder. In a real implementation, you would
  // store the interval ID from startSimulation and clear it here.
  res.json({ message: 'Simulation stopped (placeholder)' });
});

// Serve static assets if in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
  });
}

const PORT = config.get('server.port') || 5001;

// Initialize Socket.io
initializeSocket(server);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
