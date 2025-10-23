
export enum UserRole {
  Patient = 'Patient',
  Intern = 'Intern',
  Doctor = 'Doctor',
  Admin = 'Admin',
  Receptionist = 'Receptionist',
}

export interface TriageSuggestion {
  classification: 'Stable' | 'Moderate' | 'Critical';
  summary: string;
  potentialSpecialist: string;
}

export interface Vitals {
  bloodPressure: string;
  heartRate: number;
  temperature: number;
  spo2: number;
}

export interface AuditEntry {
    timestamp: string;
    action: string;
    user: {
        id: string;
        name: string;
        role: UserRole;
    };
    details?: Record<string, any>;
}

export interface Patient {
  id: number;
  name: string;
  dob: string;
  gender: 'Male' | 'Female' | 'Other';
  mobileNumber: string;
  email?: string;
  password?: string; // For demo login simulation
  previousPassword?: string; // To track password changes for admin
  isPregnant?: boolean;
  maritalStatus: 'Single' | 'Married';
  spouseName?: string;
  guardianName?: string;
  symptoms: string;
  registrationDate: string;
  status: 'Awaiting Check-in' | 'Awaiting Triage' | 'Awaiting Doctor' | 'Completed';
  vitals?: Vitals;
  triageSuggestion?: TriageSuggestion;
  isUrgentRequest: boolean;
  department?: string;
  chiefComplaintByIntern?: string;
  auditLog: AuditEntry[];
}

export interface Appointment {
  id: number;
  patientId: number;
  patient: Patient;
  doctor: string;
  date: string;
  reason: string;
  status: 'Pending Confirmation' | 'Slot Allocated' | 'Scheduled' | 'Completed' | 'Cancelled';
  notes?: string; // For SOAP notes
}

export interface ProfessionalUser {
    id: string;
    name: string;
    password?: string;
    role: UserRole;
}