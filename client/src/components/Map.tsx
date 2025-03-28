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
    if (!map) return;
    
    setIsLoading(true);
    
    // Use a small delay to prevent too many updates during rapid map movements
    setTimeout(() => {
      try {
        // Get current map bounds - don't use mapBounds state to avoid circular dependency
        let bounds: L.LatLngBounds;
        try {
          bounds = map.getBounds();
        } catch (error) {
          console.warn('Error getting map bounds:', error);
          setIsLoading(false);
          return;
        }
        
        if (!bounds) {
          console.warn('Map bounds not available');
          setIsLoading(false);
          return;
        }
        
        // Don't update mapBounds state here to avoid circular dependency
        // setMapBounds(bounds);
        
        // Filter sites within the current bounds
        const visible = filteredSites.filter(site => {
          if (!site || typeof site.latitude !== 'number' || typeof site.longitude !== 'number') {
            return false;
          }
          try {
            return bounds.contains(L.latLng(site.latitude, site.longitude));
          } catch (error) {
            console.warn('Error checking if bounds contains point:', error);
            return false;
          }
        });
        
        setVisibleSites(visible);
      } catch (error) {
        console.error('Error updating visible sites:', error);
      } finally {
        setIsLoading(false);
      }
    }, 100);
  }, [map, filteredSites]); // Remove mapBounds from dependencies

  // Listen for real-time updates
  useEffect(() => {
    if (!socket || !isConnected) return;
    
    try {
      // Listen for cell site updates
      socket.on(EVENTS.CELL_SITE_UPDATED, (data: any) => {
        try {
          console.log('Cell site updated:', data);
          
          // Validate data
          if (!data || !data.cellSite || !data.cellSite.id) {
            console.warn('Invalid cell site update data:', data);
            return;
          }
          
          // Mark the site as recently updated for visual indication
          setRecentlyUpdatedSites(prev => ({
            ...prev,
            [data.cellSite.id]: true
          }));
          
          // Clear the "recently updated" status after 5 seconds
          setTimeout(() => {
            try {
              setRecentlyUpdatedSites(prev => {
                const updated = { ...prev };
                delete updated[data.cellSite.id];
                return updated;
              });
            } catch (error) {
              console.error('Error clearing recently updated status:', error);
            }
          }, 5000);
        } catch (error) {
          console.error('Error handling cell site update:', error);
        }
      });
      
      // Listen for cell site status changes
      socket.on(EVENTS.CELL_SITE_STATUS_CHANGE, (data: any) => {
        try {
          console.log('Cell site status changed:', data);
          
          // Validate data
          if (!data || !data.cellSiteId) {
            console.warn('Invalid cell site status change data:', data);
            return;
          }
          
          // Update marker appearance if we have it
          if (markers[data.cellSiteId]) {
            // We would update the marker here, but we'll rely on the full refresh for now
          }
        } catch (error) {
          console.error('Error handling cell site status change:', error);
        }
      });
    } catch (error) {
      console.error('Error setting up socket listeners:', error);
    }
    
    return () => {
      try {
        // Clean up listeners
        socket.off(EVENTS.CELL_SITE_UPDATED);
        socket.off(EVENTS.CELL_SITE_STATUS_CHANGE);
      } catch (error) {
        console.error('Error cleaning up socket listeners:', error);
      }
    };
  }, [socket, isConnected, markers]);
  
  // Initialize map - only run once on component mount
  useEffect(() => {
    try {
      const mapContainer = mapRef.current;
      if (!mapContainer) {
        console.warn('Map container not found');
        return;
      }
      
      // Clean up any existing map instance
      const existingMap = (mapContainer as any)._leaflet_map;
      if (existingMap) {
        existingMap.remove();
      }

      // Set max bounds to roughly the whole world, but prevent infinite scrolling
      const worldBounds = L.latLngBounds(
        L.latLng(-85, -180),  // Southwest corner
        L.latLng(85, 180)     // Northeast corner
      );
      
      // Initialize map with error handling
      let newMap: L.Map;
      try {
        newMap = L.map(mapContainer, {
          maxZoom: 19,
          minZoom: 2,
          maxBounds: worldBounds,
          maxBoundsViscosity: 1.0,  // How "sticky" the bounds are (1.0 = cannot move outside bounds)
          attributionControl: true,
          zoomControl: true
        }).setView([37.8, -96], 4);
      } catch (error) {
        console.error('Error initializing map:', error);
        return;
      }
      
      // Initialize marker cluster with error handling
      try {
        const markerCluster = (L as any).markerClusterGroup({
          chunkedLoading: true,
          disableClusteringAtZoom: 19, // Disable clustering at max zoom level
          maxClusterRadius: 80,        // Maximum radius of a cluster
          spiderfyOnMaxZoom: true,     // Spiderfy clusters at max zoom
          zoomToBoundsOnClick: true,   // Zoom to bounds of cluster on click
          chunkProgress: () => {
            // Update loading state during chunk processing
            setIsLoading(true);
          }
        });
        markerClusterRef.current = markerCluster;
      } catch (error) {
        console.error('Error initializing marker cluster:', error);
      }

      // Add tile layer with error handling
      try {
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19,
          minZoom: 2
        }).addTo(newMap);
      } catch (error) {
        console.error('Error adding tile layer:', error);
      }
      
      setMap(newMap);
      
      try {
        // Set initial bounds but don't update on every render
        const initialBounds = newMap.getBounds();
        if (initialBounds) {
          setMapBounds(initialBounds);
        }
      } catch (error) {
        console.error('Error getting initial map bounds:', error);
      }

      // Add loading control - wrapped in try/catch to prevent errors
      try {
        const LoadingControl = L.Control.extend({
          onAdd: () => {
            const div = L.DomUtil.create('div', 'map-loading-control');
            div.innerHTML = '<div class="loading-spinner"></div><span>Loading...</span>';
            return div;
          }
        });
        new LoadingControl({ position: 'bottomleft' }).addTo(newMap);
      } catch (error) {
        console.error('Error adding loading control:', error);
      }

      return () => {
        try {
          if (newMap) {
            // Clean up event listeners and map
            newMap.remove();
          }
        } catch (error) {
          console.error('Error cleaning up map:', error);
        }
      };
    } catch (error) {
      console.error('Unexpected error in map initialization:', error);
      return () => {};
    }
  }, []); // Empty dependency array - only run once on mount
  
  // Add event listeners when map or updateVisibleSites changes
  useEffect(() => {
    if (!map) return;
    
    try {
      // Add event listeners for map movement
      map.on('moveend', updateVisibleSites);
      map.on('zoomend', updateVisibleSites);
      
      // Initial update
      updateVisibleSites();
      
      return () => {
        try {
          // Clean up event listeners
          map.off('moveend', updateVisibleSites);
          map.off('zoomend', updateVisibleSites);
        } catch (error) {
          console.error('Error removing map event listeners:', error);
        }
      };
    } catch (error) {
      console.error('Error setting up map event listeners:', error);
    }
  }, [map, updateVisibleSites]);

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

  // Add marker cluster to map once
  useEffect(() => {
    if (!map || !markerClusterRef.current) return;
    
    try {
      // Add marker cluster to map once
      map.addLayer(markerClusterRef.current);
      
      return () => {
        try {
          // Remove marker cluster on cleanup
          map.removeLayer(markerClusterRef.current);
        } catch (error) {
          console.error('Error removing marker cluster:', error);
        }
      };
    } catch (error) {
      console.error('Error adding marker cluster to map:', error);
    }
  }, [map]); // Only run when map changes
  
  // Update markers when visible sites change
  useEffect(() => {
    if (!map || !markerClusterRef.current) return;
    
    // Performance optimization: Use requestAnimationFrame for smoother updates
    requestAnimationFrame(() => {
      try {
        // Clear existing markers
        markerClusterRef.current.clearLayers();
        const newMarkers: Record<string, L.Marker> = {};
        
        // Add markers for each visible cell site
        visibleSites.forEach(site => {
          if (!site || typeof site.latitude !== 'number' || typeof site.longitude !== 'number') {
            console.warn('Invalid site data:', site);
            return;
          }
          
          try {
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

            marker.on('click', () => {
              onSelectSite(site);
              
              // Join room for this cell site to get specific updates
              if (socket && isConnected) {
                joinRoom(`cell-site-${site.id}`);
              }
            });
            
            // Add marker to cluster
            markerClusterRef.current.addLayer(marker);
          } catch (error) {
            console.error('Error creating marker for site:', site.id, error);
          }
        });
        
        setMarkers(newMarkers);
      } catch (error) {
        console.error('Error updating markers:', error);
      } finally {
        setIsLoading(false);
      }
    });
  }, [visibleSites, recentlyUpdatedSites, iconMap, onSelectSite, socket, isConnected, joinRoom]); // Remove map from dependencies

  // Initial load of visible sites is now handled in the event listeners useEffect

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
