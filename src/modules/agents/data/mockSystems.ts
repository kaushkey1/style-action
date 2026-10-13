export type SystemStatus = 'operational' | 'degraded' | 'down';

export interface ConnectedSystem {
  id: string;
  name: string;
  status: SystemStatus;
  latency: number;
  errorRate: number;
  lastContact: string;
  description: string;
}

export const mockSystems: ConnectedSystem[] = [
  { id: 'cortex', name: 'Cortex', status: 'operational', latency: 45, errorRate: 0.1, lastContact: '2s ago', description: 'Planning Intelligence (Increff)' },
  { id: 'sap', name: 'SAP ERP', status: 'operational', latency: 120, errorRate: 0.3, lastContact: '5s ago', description: 'System of Record' },
  { id: 'fynd', name: 'Fynd OMS', status: 'operational', latency: 32, errorRate: 0.0, lastContact: '1s ago', description: 'Order Management' },
  { id: 'procuro', name: 'Procuro', status: 'operational', latency: 68, errorRate: 0.1, lastContact: '3s ago', description: 'Purchase Orders' },
  { id: 'intellimake', name: 'IntelliMake', status: 'operational', latency: 89, errorRate: 0.2, lastContact: '4s ago', description: 'Manufacturing Execution' },
  { id: 'intelliqc', name: 'IntelliQC', status: 'operational', latency: 55, errorRate: 0.0, lastContact: '2s ago', description: 'Quality Control' },
  { id: 'intellipack', name: 'IntelliPack', status: 'operational', latency: 72, errorRate: 0.1, lastContact: '3s ago', description: 'Scan, Pack & Ship' },
  { id: 'recolect', name: 'Recolect', status: 'operational', latency: 48, errorRate: 0.0, lastContact: '2s ago', description: 'Reconciliation' },
  { id: 'gmetri', name: 'GMetri', status: 'degraded', latency: 340, errorRate: 2.1, lastContact: '15s ago', description: '3D Store Twin & VM' },
  { id: 'plm', name: 'PLM / Centric', status: 'operational', latency: 95, errorRate: 0.1, lastContact: '6s ago', description: 'Product Lifecycle' },
  { id: 'ftf', name: 'FTF', status: 'operational', latency: 62, errorRate: 0.0, lastContact: '4s ago', description: 'Fashion Trend Forecasting' },
  { id: 'costing', name: 'Costing Engine', status: 'operational', latency: 38, errorRate: 0.0, lastContact: '2s ago', description: 'Cost & Margin' },
  { id: 'pulsepoint', name: 'PulsePoint', status: 'operational', latency: 51, errorRate: 0.1, lastContact: '3s ago', description: 'Store Task Management' },
  { id: 'ucp', name: 'UCP', status: 'operational', latency: 44, errorRate: 0.0, lastContact: '1s ago', description: 'Unified Customer Profile' },
];

export const systemSummary = {
  total: mockSystems.length,
  operational: mockSystems.filter((s) => s.status === 'operational').length,
  degraded: mockSystems.filter((s) => s.status === 'degraded').length,
  down: mockSystems.filter((s) => s.status === 'down').length,
};
