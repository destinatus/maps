import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import { useSocket } from '../context/SocketContext';
import { EVENTS } from '../context/SocketContext';
import '../styles/Map.css';

interface Alert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
}

interface Task {
  id: string;
  type: string;
  status: 'pending' | 'in-progress' | 'completed';
}

interface CellSite {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  technology: 'LTE' | '5G' | 'mmWave';
  status: 'active' | 'maintenance' | 'outage';
  alerts: Alert[];
  tasks: Task[];
}

interface MapProps {
  cellSites: CellSite[];
  onSelectSite: (site: CellSite) => void;
  activeFilters: {
    technologies: string[];
    statuses: string[];
  };
}

interface SocketContextType {
  socket: any;
  isConnected: boolean;
  lastMessage: any;
  joinRoom: (room: string) => void;
  leaveRoom: (room: string) => void;
}

const Map = ({ cellSites, onSelectSite, activeFilters }: MapProps) => {
  const { socket, isConnected, lastMessage, joinRoom } = useSocket() as SocketContextType;
  const [recentlyUpdatedSites, setRecentlyUpdatedSites] = useState<Record<string, boolean>>({});
  const [map, setMap] = useState<L.Map | null>(null);
  const [markers, setMarkers] = useState<Record<string, L.Marker>>({});
  const markerClusterRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [visibleSites, setVisibleSites] = useState<CellSite[]>([]);
  const [mapBounds, setMapBounds] = useState<L.LatLngBounds | null>(null);
  
  // Performance optimization: Memoize the filtered cell sites
  const filteredSites = useMemo(() => {
    if (!cellSites) return [];
    
    return cellSites.filter(site => {
      if (!site) return false;
      
      // Technology filter - check if active tech matches site's technology
      const techMatch = activeFilters.technologies.length === 0 || 
        (site.technology && activeFilters.technologies.includes(site.technology));
      
      // Status filter
      const statusMatch = activeFilters.statuses.length === 0 || 
        (site.status && activeFilters.statuses.includes(site.status));
      
      return techMatch && statusMatch;
    });
  }, [cellSites, activeFilters.technologies, activeFilters.statuses]);

  // Performance optimization: Only render markers for sites within the current map bounds
  const updateVisibleSites = useCallback(() => {
    if (!map || !mapBounds) return;
    
    setIsLoading(true);
    
    // Use a small delay to prevent too many updates during rapid map movements
    setTimeout(() => {
      const bounds = map.getBounds();
      setMapBounds(bounds);
      
      const visible = filteredSites.filter(site => {
        return bounds.contains(L.latLng(site.latitude, site.longitude));
      });
      
      setVisibleSites(visible);
      setIsLoading(false);
    }, 100);
  }, [map, mapBounds, filteredSites]);

  // Listen for real-time updates
  useEffect(() => {
    if (!socket || !isConnected) return;
    
    // Listen for cell site updates
    socket.on(EVENTS.CELL_SITE_UPDATED, (data: any) => {
      console.log('Cell site updated:', data);
      // Mark the site as recently updated for visual indication
      setRecentlyUpdatedSites(prev => ({
        ...prev,
        [data.cellSite.id]: true
      }));
      
      // Clear the "recently updated" status after 5 seconds
      setTimeout(() => {
        setRecentlyUpdatedSites(prev => {
          const updated = { ...prev };
          delete updated[data.cellSite.id];
          return updated;
        });
      }, 5000);
    });
    
    // Listen for cell site status changes
    socket.on(EVENTS.CELL_SITE_STATUS_CHANGE, (data: any) => {
      console.log('Cell site status changed:', data);
      // Update marker appearance if we have it
      if (markers[data.cellSiteId]) {
        // We would update the marker here, but we'll rely on the full refresh for now
      }
    });
    
    return () => {
      // Clean up listeners
      socket.off(EVENTS.CELL_SITE_UPDATED);
      socket.off(EVENTS.CELL_SITE_STATUS_CHANGE);
    };
  }, [socket, isConnected, markers]);
  
  // Initialize map
  useEffect(() => {
    const mapContainer = mapRef.current;
    if (!mapContainer) return;
    
    // Clean up any existing map instance
    const existingMap = (mapContainer as any)._leaflet_map;
    if (existingMap) {
      existingMap.remove();
    }

    const newMap = L.map(mapContainer).setView([37.8, -96], 4);
    const markerCluster = (L as any).markerClusterGroup({
      chunkedLoading: true,
      chunkProgress: () => {
        // Update loading state during chunk processing
        setIsLoading(true);
      }
    });
    markerClusterRef.current = markerCluster;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(newMap);
    
    setMap(newMap);
    setMapBounds(newMap.getBounds());

    // Add event listeners for map movement
    newMap.on('moveend', updateVisibleSites);
    newMap.on('zoomend', updateVisibleSites);
    
    // Add loading control
    const loadingControl = L.Control.extend({
      onAdd: () => {
        const div = L.DomUtil.create('div', 'map-loading-control');
        div.innerHTML = '<div class="loading-spinner"></div><span>Loading...</span>';
        return div;
      }
    });
    new loadingControl({ position: 'bottomleft' }).addTo(newMap);

    return () => {
      newMap.off('moveend', updateVisibleSites);
      newMap.off('zoomend', updateVisibleSites);
      newMap.remove();
    };
  }, [updateVisibleSites]);

  // Custom icons for different technologies and states - memoized for performance
  const iconMap = useMemo(() => ({
    'LTE': {
      'default': L.icon({
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/984/984315.png',
        iconSize: [25, 25]
      }),
      'updated': L.icon({
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/984/984315.png',
        iconSize: [30, 30] // Slightly larger for updated sites
      })
    },
    '5G': {
      'default': L.icon({
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/984/984316.png',
        iconSize: [25, 25]
      }),
      'updated': L.icon({
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/984/984316.png',
        iconSize: [30, 30]
      })
    },
    'mmWave': {
      'default': L.icon({
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/984/984317.png',
        iconSize: [25, 25]
      }),
      'updated': L.icon({
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/984/984317.png',
        iconSize: [30, 30]
      })
    }
  }), []);

  // Update markers when visible sites change
  useEffect(() => {
    if (!map || !markerClusterRef.current) return;
    
    // Performance optimization: Use requestAnimationFrame for smoother updates
    requestAnimationFrame(() => {
      // Clear existing markers
      markerClusterRef.current.clearLayers();
      const newMarkers: Record<string, L.Marker> = {};
      
      // Add markers for each visible cell site
      visibleSites.forEach(site => {
        // Determine if this site was recently updated
        const isRecentlyUpdated = recentlyUpdatedSites[site.id] || false;
        
        // Choose the appropriate icon based on technology and update status
        const iconState = isRecentlyUpdated ? 'updated' : 'default';
        const icon = iconMap[site.technology]?.[iconState] || L.icon({
          iconUrl: 'https://cdn-icons-png.flaticon.com/512/984/984314.png',
          iconSize: isRecentlyUpdated ? [30, 30] : [25, 25]
        });
        
        const marker = L.marker([site.latitude, site.longitude], { icon });
        
        // Store marker reference for later updates
        newMarkers[site.id] = marker;

        // Add popup with site details
        const criticalAlerts = site.alerts && Array.isArray(site.alerts) 
          ? site.alerts.filter(a => a.severity === 'critical').length 
          : 0;
        const pendingTasks = site.tasks && Array.isArray(site.tasks) 
          ? site.tasks.filter(t => t.status === 'pending').length 
          : 0;
        
        // Add real-time update indicator if site was recently updated
        const updateIndicator = isRecentlyUpdated 
          ? `<p class="update-indicator">Recently Updated</p>` 
          : '';
        
        marker.bindPopup(`
          <div style="min-width: 200px">
            <h3>${site.name}</h3>
            <p><strong>Technology:</strong> ${site.technology}</p>
            <p><strong>Status:</strong> ${site.status}</p>
            ${criticalAlerts > 0 ? `<p class="alert-critical">Critical Alerts: ${criticalAlerts}</p>` : ''}
            ${pendingTasks > 0 ? `<p class="task-pending">Pending Tasks: ${pendingTasks}</p>` : ''}
            ${updateIndicator}
          </div>
        `);

        markerClusterRef.current.addLayer(marker);

        marker.on('click', () => {
          onSelectSite(site);
          
          // Join room for this cell site to get specific updates
          if (socket && isConnected) {
            joinRoom(`cell-site-${site.id}`);
          }
        });
      });

      map.addLayer(markerClusterRef.current);
      setMarkers(newMarkers);
      setIsLoading(false);
    });
  }, [visibleSites, map, recentlyUpdatedSites, iconMap, onSelectSite, socket, isConnected, joinRoom]);

  // Initial load of visible sites
  useEffect(() => {
    if (map && filteredSites.length > 0) {
      updateVisibleSites();
    }
  }, [map, filteredSites, updateVisibleSites]);

  const mapRef = useRef<HTMLDivElement>(null);
  return (
    <div className="map-wrapper">
      <div ref={mapRef} className="map-container-inner" />
      {isLoading && (
        <div className="map-loading-indicator">
          <div className="loading-spinner"></div>
          <span>Loading map data...</span>
        </div>
      )}
      <div className="map-stats">
        <span>Showing {visibleSites.length} of {filteredSites.length} cell sites</span>
      </div>
    </div>
  );
};

export default Map;
