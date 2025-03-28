import React from 'react';
import '../styles/SiteTiles.css';

interface Alert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
}

interface Task {
  id: string;
  description?: string;
  status: 'pending' | 'in-progress' | 'completed';
  dueDate?: string;
}

interface CellSite {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'maintenance';
  technology: string;
  latitude: number;
  longitude: number;
  alerts?: Alert[];
  tasks?: Task[];
}

interface SiteTilesProps {
  sites: CellSite[];
  onSelectSite: (site: CellSite) => void;
  selectedSiteId?: string;
}

const SiteTiles: React.FC<SiteTilesProps> = ({ sites, onSelectSite, selectedSiteId }) => {
  // Helper function to normalize technology string for CSS class
  const normalizeTechClass = (tech: string): string => {
    // Handle comma-separated technologies
    if (tech.includes(',')) {
      return 'tech-' + tech.split(',')[0].trim().toLowerCase().replace(/\s+/g, '');
    }
    return 'tech-' + tech.toLowerCase().replace(/\s+/g, '');
  };

  // Count alerts by severity
  const getAlertCounts = (site: CellSite) => {
    if (!site.alerts || site.alerts.length === 0) return null;
    
    const counts = {
      critical: 0,
      warning: 0,
      info: 0
    };
    
    site.alerts.forEach(alert => {
      counts[alert.severity]++;
    });
    
    return counts;
  };

  return (
    <div className="site-tiles-container">
      {sites.length === 0 ? (
        <div className="no-sites">No cell sites available</div>
      ) : (
        <div className="site-tiles-grid">
          {sites.map(site => {
            const isSelected = selectedSiteId === site.id;
            const alertCounts = getAlertCounts(site);
            
            return (
              <div 
                key={site.id}
                className={`site-tile ${isSelected ? 'selected' : ''}`}
                onClick={() => onSelectSite(site)}
                role="button"
                tabIndex={0}
                aria-label={`Select ${site.name}`}
                aria-pressed={isSelected}
              >
                <div className="tile-header">
                  <h4 title={site.name}>{site.name}</h4>
                  <span className={`status-badge status-${site.status}`}>
                    {site.status}
                  </span>
                </div>
                
                <div className="tile-body">
                  <span className={`tech-badge ${normalizeTechClass(site.technology)}`}>
                    {site.technology}
                  </span>
                  
                  {alertCounts && (
                    <div className="alert-indicators">
                      {alertCounts.critical > 0 && (
                        <span className="alert-indicator critical" title={`${alertCounts.critical} critical alerts`}>
                          {alertCounts.critical}
                        </span>
                      )}
                      {alertCounts.warning > 0 && (
                        <span className="alert-indicator warning" title={`${alertCounts.warning} warning alerts`}>
                          {alertCounts.warning}
                        </span>
                      )}
                      {alertCounts.info > 0 && (
                        <span className="alert-indicator info" title={`${alertCounts.info} info alerts`}>
                          {alertCounts.info}
                        </span>
                      )}
                    </div>
                  )}
                  
                  {site.tasks && site.tasks.length > 0 && (
                    <div className="task-count" title={`${site.tasks.length} tasks`}>
                      {site.tasks.length} task{site.tasks.length !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SiteTiles;
