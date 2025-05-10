
import type { Doctor, Patient, DataAnalysisDataPoint, DashboardMetrics } from '@/types';

// Mock data is no longer the source of truth for Doctors and Patients on the User Management page.
// These can be kept for other parts of the app if needed, or removed entirely if User Management
// was their only consumer. For now, I will empty them to signify they are not used by User Management.

export const mockDoctors: Doctor[] = [];

export const mockPatients: Patient[] = [];

// Dashboard metrics and chart data might still be used by the dashboard page.
// If the dashboard also needs to be connected to real data, these would also be replaced.
export const mockDashboardMetrics: DashboardMetrics = {
  doctorCount: 0, // Will be updated dynamically if dashboard uses real data
  patientCount: 0, // Will be updated dynamically
  videoCount: 0,
  dataAnalysisCount: 0,
};

export const mockDataAnalysisChartData: DataAnalysisDataPoint[] = [
  { date: 'Jan \'24', analyses: 65 },
  { date: 'Feb \'24', analyses: 59 },
  { date: 'Mar \'24', analyses: 80 },
  { date: 'Apr \'24', analyses: 81 },
  { date: 'May \'24', analyses: 56 },
  { date: 'Jun \'24', analyses: 70 },
  { date: 'Jul \'24', analyses: 75 },
];
