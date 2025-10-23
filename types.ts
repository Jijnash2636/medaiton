export enum UserRole {
  Patient = 'Patient',
  Nurse = 'Nurse',
  Doctor = 'Doctor',
  Admin = 'Admin',
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

export interface Patient {
  id: number;
  name: string;
  dob: string;
  gender: 'Male' | 'Female' | 'Other';
  mobileNumber: string;
  email?: string;
  password?: string; // For demo login simulation
  isPregnant?: boolean;
  maritalStatus: 'Single' | 'Married';
  spouseName?: string;
  guardianName?: string;
  symptoms: string;
  registrationDate: string;
  status: 'Awaiting Triage' | 'Awaiting Doctor' | 'Completed';
  vitals?: Vitals;
  triageSuggestion?: TriageSuggestion;
  isUrgentRequest: boolean;
  department?: string;
}

export interface Appointment {
  id: number;
  patientId: number;
  patient: Patient;
  doctor: string;
  date: string;
  reason: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  notes?: string; // For SOAP notes
}