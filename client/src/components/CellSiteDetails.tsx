import React, { useState } from 'react';
import '../styles/CellSiteDetails.css';

interface Alert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
}

interface Task {
  id: string;
  description: string;
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

interface CellSiteDetailsProps {
  site: CellSite | null;
}

const CellSiteDetails: React.FC<CellSiteDetailsProps> = ({ site }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'alerts' | 'tasks'>('overview');

  if (!site) {
    return (
      <div className="cell-site-details empty-state">
        <p>Select a cell site to view details</p>
      </div>
    );
  }

  const formatCoordinates = (lat: number, lng: number): string => {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  const getStatusClass = (status: string): string => {
    return `status-${status.toLowerCase()}`;
  };

  const getAlertSeverityClass = (severity: string): string => {
    return `alert-${severity.toLowerCase()}`;
  };

  const getTaskStatusClass = (status: string): string => {
    return `task-${status.toLowerCase()}`;
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'No date set';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return 'Invalid date';
    }
  };

  const renderOverviewTab = () => (
    <div className="tab-content overview-tab">
      <div className="detail-section">
        <h3>General Information</h3>
        <div className="detail-grid">
          <div className="detail-item">
            <span className="detail-label">ID:</span>
            <span className="detail-value">{site.id}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Name:</span>
            <span className="detail-value">{site.name}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Status:</span>
            <span className={`detail-value ${getStatusClass(site.status)}`}>
              {site.status}
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Technology:</span>
            <span className="detail-value">{site.technology}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Coordinates:</span>
            <span className="detail-value">
              {formatCoordinates(site.latitude, site.longitude)}
            </span>
          </div>
        </div>
      </div>

      <div className="detail-section">
        <h3>Summary</h3>
        <div className="summary-stats">
          <div className="stat-item">
            <div className="stat-value">{site.alerts?.length || 0}</div>
            <div className="stat-label">Alerts</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">
              {site.alerts?.filter(a => a.severity === 'critical').length || 0}
            </div>
            <div className="stat-label">Critical</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{site.tasks?.length || 0}</div>
            <div className="stat-label">Tasks</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">
              {site.tasks?.filter(t => t.status === 'pending').length || 0}
            </div>
            <div className="stat-label">Pending</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAlertsTab = () => (
    <div className="tab-content alerts-tab">
      {(!site.alerts || site.alerts.length === 0) ? (
        <div className="empty-state">
          <p>No alerts for this cell site</p>
        </div>
      ) : (
        <div className="alerts-list">
          {site.alerts.map(alert => (
            <div key={alert.id} className={`alert-item ${getAlertSeverityClass(alert.severity)}`}>
              <div className="alert-severity">{alert.severity}</div>
              <div className="alert-message">{alert.message}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderTasksTab = () => (
    <div className="tab-content tasks-tab">
      {(!site.tasks || site.tasks.length === 0) ? (
        <div className="empty-state">
          <p>No tasks for this cell site</p>
        </div>
      ) : (
        <div className="tasks-list">
          {site.tasks.map(task => (
            <div key={task.id} className="task-item">
              <div className={`task-status ${getTaskStatusClass(task.status)}`}>
                {task.status}
              </div>
              <div className="task-description">{task.description}</div>
              <div className="task-due-date">Due: {formatDate(task.dueDate)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="cell-site-details">
      <div className="details-header">
        <h2>{site.name}</h2>
        <div className={`site-status ${getStatusClass(site.status)}`}>
          {site.status}
        </div>
      </div>

      <div className="tabs">
        <button 
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab-button ${activeTab === 'alerts' ? 'active' : ''}`}
          onClick={() => setActiveTab('alerts')}
        >
          Alerts {site.alerts && site.alerts.length > 0 && (
            <span className="badge">{site.alerts.length}</span>
          )}
        </button>
        <button 
          className={`tab-button ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          Tasks {site.tasks && site.tasks.length > 0 && (
            <span className="badge">{site.tasks.length}</span>
          )}
        </button>
      </div>

      {activeTab === 'overview' && renderOverviewTab()}
      {activeTab === 'alerts' && renderAlertsTab()}
      {activeTab === 'tasks' && renderTasksTab()}
    </div>
  );
};

export default CellSiteDetails;
