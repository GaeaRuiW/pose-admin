
export interface Doctor {
  id: string; 
  username: string; 
  password?: string; 
  email: string;
  phone: string;
  department: string;
  role_id: number; 
  notes?: string; 
  create_time?: string;
  update_time?: string;
  patientCount?: number; 
}

export interface Patient {
  id: string; 
  username: string; 
  age: number;
  gender: 'Male' | 'Female' | 'Other'; 
  case_id: string; 
  doctor_id: string; 
  notes?: string; // Added notes field
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

