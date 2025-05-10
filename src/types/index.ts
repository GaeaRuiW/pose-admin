
export interface Doctor {
  id: string; 
  username: string; 
  password?: string; 
  email: string;
  phone: string | null; // Allow null
  department: string | null; // Allow null
  role_id: number | null; // Allow null
  notes?: string | null; // Allow null
  create_time?: string;
  update_time?: string;
  patientCount?: number; 
}

export interface Patient {
  id: string; 
  username: string; 
  age: number | null; // Allow null
  gender: 'Male' | 'Female' | 'Other' | null; // Allow null
  case_id: string; 
  doctor_id: string | null; // Allow null
  notes?: string | null; 
  create_time?: string;
  update_time?: string;
  attendingDoctorName?: string; 
  videoCount?: number;
  analysisCount?: number;
}

export interface DataAnalysisDataPoint {
  date: string; 
  analyses: number;
}

export interface DashboardMetrics {
  doctorCount: number;
  patientCount: number;
  videoCount: number;
  dataAnalysisCount: number;
}

export interface User { 
  id: string; 
  name: string; 
  email: string;
  avatarUrl?: string;
  role_id?: number; 
}
