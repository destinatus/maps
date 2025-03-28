import React, { useState, useEffect } from 'react';
import Map from './components/Map.tsx';
import SearchContainer from './components/SearchContainer.tsx';
import Notifications from './components/Notifications.tsx';
import SimulationControls from './components/SimulationControls.tsx';
import CellSiteDetails from './components/CellSiteDetails.tsx';
import { SocketProvider } from './context/SocketContext';
import './App.css';
import './styles/Notifications.css';
import './styles/RealTimeIndicators.css';
import './styles/SimulationControls.css';
import './styles/CellSiteDetails.css';

function App() {
  const [cellSites, setCellSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState(null);
  const [activeFilters] = useState({
    technologies: [],
    statuses: []
  });

  useEffect(() => {
    fetch('/api/cell-sites')
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then(response => {
        // Ensure we always get an array
        let data = [];
        if (Array.isArray(response)) {
          data = response;
        } else if (response && Array.isArray(response.data)) {
          data = response.data;
        } else if (response && typeof response === 'object') {
          // Handle single object case by wrapping in array
          data = [response];
        }
        
        // Use mock data if API returns empty
        if (data.length === 0) {
          data = generateMockData();
        }
        
        return data;
      })
      .then(data => {
        if (!Array.isArray(data)) {
          throw new Error('Invalid data format received');
        }
        setCellSites(data);
      })
      .catch(err => {
        console.error(err);
        setCellSites(generateMockData());
      });
  }, []);

  function generateMockData() {
    return [
      {
        id: '1',
        name: 'Downtown Tower',
        latitude: 37.7749,
        longitude: -122.4194,
        technology: '5G',
        status: 'active',
        alerts: [
          {id: 'a1', severity: 'warning', message: 'Signal fluctuation'}
        ],
        tasks: [
          {id: 't1', type: 'maintenance', status: 'pending'}
        ]
      },
      {
        id: '2',
        name: 'Suburban Site',
        latitude: 37.7849,
        longitude: -122.4294,
        technology: 'LTE',
        status: 'maintenance',
        alerts: [],
        tasks: [
          {id: 't2', type: 'upgrade', status: 'in-progress'}
        ]
      },
      {
        id: '3',
        name: 'Rural Site',
        latitude: 37.7949,
        longitude: -122.4394,
        technology: 'mmWave',
        status: 'active',
        alerts: [
          {id: 'a3', severity: 'critical', message: 'Hardware failure'}
        ],
        tasks: []
      }
    ];
  }

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [sidebarVisible, setSidebarVisible] = useState(!isMobile);

  // Handle window resize for responsive layout
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile && !sidebarVisible) {
        setSidebarVisible(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarVisible]);

  // Toggle sidebar visibility on mobile
  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  return (
    <SocketProvider>
      <div className="app">
        {isMobile && (
          <button 
            className="sidebar-toggle" 
            onClick={toggleSidebar}
            aria-label={sidebarVisible ? "Hide sidebar" : "Show sidebar"}
          >
            {sidebarVisible ? '×' : '☰'}
          </button>
        )}
        
        <div className={`map-container ${sidebarVisible && isMobile ? 'map-pushed' : ''}`} data-testid="map-container">
          <Map 
            cellSites={cellSites}
            onSelectSite={(site) => {
              setSelectedSite(site);
              if (isMobile) setSidebarVisible(true);
            }}
            activeFilters={activeFilters}
          />
        </div>
        
        <div className={`sidebar ${sidebarVisible ? 'visible' : 'hidden'}`}>
          <div className="search-panel">
            <SearchContainer onSelectSite={(site) => {
              setSelectedSite(site);
              if (isMobile) setSidebarVisible(true);
            }} />
            <SimulationControls />
          </div>
          <div className="site-details-container">
            <CellSiteDetails site={selectedSite} />
          </div>
        </div>
        
        <Notifications />
      </div>
    </SocketProvider>
  );
}

export default App;
