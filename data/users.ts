import { UserRole, ProfessionalUser } from '../types';

export const professionalUsers: ProfessionalUser[] = [
    { id: 'DID000067', name: 'Dr. Evelyn Reed', password: 'password123', role: UserRole.Doctor },
    { id: 'IID000045', name: 'Alex Carter', password: 'password123', role: UserRole.Intern },
    { id: 'RID000012', name: 'Samuel Jones', password: 'password123', role: UserRole.Receptionist },
    { id: 'AID000001', name: 'Chris Lee', password: 'password123', role: UserRole.Admin },
];