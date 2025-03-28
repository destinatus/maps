import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';

interface SocketContextType {
  isConnected: boolean;
}

const SimulationControls: React.FC = () => {
  const { isConnected } = useSocket() as SocketContextType;
  const [intervalMs, setIntervalMs] = useState<number>(5000);
  const [durationMs, setDurationMs] = useState<number>(60000);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const startSimulation = async () => {
    try {
      setError(null);
      
      const response = await fetch('/api/simulation/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ intervalMs, durationMs }),
      });

      if (!response.ok) {
        throw new Error(`Failed to start simulation: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Simulation started:', data);
      setIsSimulating(true);
      
      // Automatically set simulating to false after duration
      setTimeout(() => {
        setIsSimulating(false);
      }, durationMs);
    } catch (err) {
      console.error('Error starting simulation:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const stopSimulation = async () => {
    try {
      setError(null);
      
      const response = await fetch('/api/simulation/stop', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Failed to stop simulation: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Simulation stopped:', data);
      setIsSimulating(false);
    } catch (err) {
      console.error('Error stopping simulation:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  return (
    <div className="simulation-controls">
      <h3>Real-time Simulation Controls</h3>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="form-group">
        <label htmlFor="interval">Update Interval (ms):</label>
        <input
          id="interval"
          type="number"
          min="1000"
          step="1000"
          value={intervalMs}
          onChange={(e) => setIntervalMs(parseInt(e.target.value))}
          disabled={isSimulating}
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="duration">Duration (ms):</label>
        <input
          id="duration"
          type="number"
          min="10000"
          step="10000"
          value={durationMs}
          onChange={(e) => setDurationMs(parseInt(e.target.value))}
          disabled={isSimulating}
        />
      </div>
      
      <div className="simulation-actions">
        <button
          onClick={startSimulation}
          disabled={isSimulating || !isConnected}
          className={`start-btn ${isSimulating ? 'disabled' : ''}`}
        >
          Start Simulation
        </button>
        
        <button
          onClick={stopSimulation}
          disabled={!isSimulating || !isConnected}
          className={`stop-btn ${!isSimulating ? 'disabled' : ''}`}
        >
          Stop Simulation
        </button>
      </div>
      
      {!isConnected && (
        <div className="connection-warning">
          Socket connection is not established. Simulation controls are disabled.
        </div>
      )}
      
      {isSimulating && (
        <div className="simulation-status">
          Simulation is running...
        </div>
      )}
    </div>
  );
};

export default SimulationControls;
