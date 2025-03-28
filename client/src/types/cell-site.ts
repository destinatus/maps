export interface CellSite {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'maintenance';
  technology: string;
  latitude: number;
  longitude: number;
  alerts?: {
    id: string;
    severity: 'critical' | 'warning' | 'info';
    message: string;
  }[];
  tasks?: {
    id: string;
    description: string;
    status: 'pending' | 'in-progress' | 'completed';
    dueDate?: string;
  }[];
}
