
export interface Doctor {
  id: string; // Matches backend 'id' (int, but string in frontend is common)
  username: string; // Matches backend 'username', was 'name'
  password?: string; // Frontend only, for setting/changing. Not stored as plaintext.
  email: string;
  phone: string;
  department: string;
  role_id: number; // Matches backend 'role_id' (e.g., 1 for Admin, 2 for Doctor)
  notes?: string; // Matches new backend 'notes' field
  create_time?: string;
  update_time?: string;
  // Frontend specific, will be derived or calculated from API calls if needed by table
  patientCount?: number; 
}

export interface Patient {
  id: string; // Matches backend 'id'
  username: string; // Matches backend 'username', was 'name'
  age: number;
  gender: 'Male' | 'Female' | 'Other'; // Backend stores as string
  case_id: string; // Matches backend 'case_id', was 'medicalRecordNumber'
  doctor_id: string; // Matches backend 'doctor_id', was 'attendingDoctorId'
  create_time?: string;
  update_time?: string;
  // Frontend specific, will be derived from API calls
  attendingDoctorName?: string; 
  videoCount?: number;
  analysisCount?: number;
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

export interface User { // For AuthContext currentUser
  id: string; // Corresponds to doctor's ID from backend
  name: string; // Corresponds to doctor's username from backend
  email: string;
  avatarUrl?: string;
  role_id?: number; // Add role_id for permission checks
}
