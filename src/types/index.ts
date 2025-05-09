export interface Doctor {
  id: string;
  name: string;
  password?: string; // Actual password for reveal functionality
  email: string;
  phone: string;
  department: string;
  patientCount: number;
  permissions: 'Admin' | 'Doctor' | 'Read-Only';
  notes: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  medicalRecordNumber: string;
  attendingDoctorId: string;
  attendingDoctorName: string; // Denormalized for display
  videoCount: number;
  analysisCount: number;
}

export interface DataAnalysisDataPoint {
  date: string; // e.g., "Jan '24", "Feb '24"
  analyses: number;
}

export interface DashboardMetrics {
  doctorCount: number;
  patientCount: number;
  videoCount: number;
  dataAnalysisCount: number;
}
