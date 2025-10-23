
import React, { useState, useCallback } from 'react';
import { UserRole, Patient, Appointment, Vitals, TriageSuggestion, ProfessionalUser } from './types';
import Header from './components/Header';
import PatientView from './components/PatientView';
import InternView from './components/InternView';
import DoctorView from './components/DoctorView';
import AdminView from './components/AdminView';
import Dashboard from './components/Dashboard';
import ReceptionistView from './components/ReceptionistView';
import ProfessionalLogin from './components/ProfessionalLogin';

const App: React.FC = () => {
  const [activeRole, setActiveRole] = useState<UserRole | null>(null);
  const [loggedInProfessional, setLoggedInProfessional] = useState<ProfessionalUser | null>(null);
  const [patientDatabase, setPatientDatabase] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const createAuditEntry = (user: ProfessionalUser, action: string, details?: Record<string, any>) => ({
    timestamp: new Date().toISOString(),
    user: { id: user.id, name: user.name, role: user.role },
    action,
    details,
  });

  const registerPatient = useCallback((patientData: Omit<Patient, 'id' | 'registrationDate' | 'status' | 'auditLog'>): Patient => {
    const newPatientId = (patientDatabase.length > 0) ? Math.max(...patientDatabase.map(p => p.id), 0) + 1 : 100001;
    
    const newPatient: Patient = {
        ...patientData,
        id: newPatientId,
        registrationDate: new Date().toISOString(),
        status: 'Awaiting Check-in',
        previousPassword: undefined,
        auditLog: [{
            timestamp: new Date().toISOString(),
            action: 'Patient Registered',
            user: { id: 'System', name: 'Patient Portal', role: UserRole.Patient },
        }],
    };
    
    setPatientDatabase(prev => [...prev, newPatient]);
    return newPatient;
  }, [patientDatabase]);

  const requestAppointment = useCallback((patient: Patient, appointmentDetails: {symptoms: string, department: string, isUrgentRequest: boolean, appointmentDateTime: string}) => {
    
    setPatientDatabase(prev => prev.map(p => 
        p.id === patient.id 
            ? { ...p, 
                symptoms: appointmentDetails.symptoms, 
                department: appointmentDetails.department,
                isUrgentRequest: appointmentDetails.isUrgentRequest,
                status: 'Awaiting Check-in',
                auditLog: [...p.auditLog, {
                    timestamp: new Date().toISOString(),
                    action: 'Appointment Requested',
                    user: { id: String(p.id), name: p.name, role: UserRole.Patient },
                    details: { department: appointmentDetails.department, time: appointmentDetails.appointmentDateTime }
                }]
              } 
            : p
    ));

    const newAppointment: Appointment = {
        id: (appointments.length > 0 ? Math.max(...appointments.map(a => a.id)) : 0) + 1,
        patientId: patient.id,
        patient: { ...patient, ...appointmentDetails },
        doctor: 'To be assigned',
        date: appointmentDetails.appointmentDateTime,
        reason: appointmentDetails.symptoms,
        status: 'Pending Confirmation',
    };

    setAppointments(prev => [...prev, newAppointment]);
  }, [appointments]);

  const requestWalkInAppointment = useCallback((patientData: Omit<Patient, 'id' | 'registrationDate' | 'status' | 'auditLog'>, isWalkIn: boolean = false, user: ProfessionalUser) => {
    const newPatient = registerPatient(patientData);
    
    setPatientDatabase(prev => prev.map(p => p.id === newPatient.id ? { ...p, status: 'Awaiting Triage', auditLog: [...p.auditLog, createAuditEntry(user, 'Registered as Walk-in')] } : p));
  }, [registerPatient]);

  const allocateSlot = useCallback((appointmentId: number, user: ProfessionalUser) => {
    let patientId: number | undefined;
    setAppointments(prev => prev.map(appt => {
        if(appt.id === appointmentId) {
            patientId = appt.patientId;
            return { ...appt, status: 'Slot Allocated' };
        }
        return appt;
    }));
    if (patientId) {
        setPatientDatabase(prev => prev.map(p => p.id === patientId ? {...p, auditLog: [...p.auditLog, createAuditEntry(user, 'Appointment Slot Allocated')]} : p));
    }
  }, []);

  const rejectAppointment = useCallback((appointmentId: number, user: ProfessionalUser) => {
    let patientId: number | undefined;
    setAppointments(prev => prev.map(appt => {
        if(appt.id === appointmentId) {
            patientId = appt.patientId;
            return { ...appt, status: 'Cancelled' };
        }
        return appt;
    }));
    if (patientId) {
        setPatientDatabase(prev => prev.map(p => p.id === patientId ? {...p, auditLog: [...p.auditLog, createAuditEntry(user, 'Appointment Rejected')]} : p));
    }
  }, []);

  const checkInPatient = useCallback((patientId: number, user: ProfessionalUser) => {
    setPatientDatabase(prev => prev.map(p => 
        p.id === patientId ? { ...p, status: 'Awaiting Triage', auditLog: [...p.auditLog, createAuditEntry(user, 'Patient Checked In (Offline)')] } : p
    ));
    setAppointments(prev => prev.map(a => a.patientId === patientId && a.status === 'Slot Allocated' ? {...a, status: 'Scheduled'} : a));
  }, []);

  const addVitals = useCallback((patientId: number, vitals: Vitals, user: ProfessionalUser) => {
    setPatientDatabase(prev => prev.map(p => p.id === patientId ? { ...p, vitals, auditLog: [...p.auditLog, createAuditEntry(user, 'Vitals Recorded', {vitals})] } : p));
  }, []);

  const assignToDoctor = useCallback((patientId: number, chiefComplaint: string, department: string, user: ProfessionalUser) => {
    setPatientDatabase(prev => prev.map(p => p.id === patientId ? { 
        ...p, 
        chiefComplaintByIntern: chiefComplaint,
        department: department, // Update patient's department based on intern's assignment
        status: 'Awaiting Doctor',
        auditLog: [
            ...p.auditLog,
            createAuditEntry(user, 'Chief Complaint Noted', { chiefComplaint }),
            createAuditEntry(user, 'Assigned to Department', { department })
        ] 
    } : p));

    setAppointments(prevAppointments => {
        const appointmentToSchedule = prevAppointments.find(
            a => a.patientId === patientId && (a.status === 'Scheduled' || a.status === 'Slot Allocated') // Find walk-in or pre-booked
        );

        if (!appointmentToSchedule) {
            console.error(`No active appointment found for patientId: ${patientId} to assign to doctor.`);
            // This could be a walk-in who doesn't have an appointment object yet. Let's create one.
             const patient = patientDatabase.find(p => p.id === patientId);
             if(!patient) return prevAppointments;

             const lastAppointmentInDept = prevAppointments
                .filter(a => a.status === 'Scheduled' && a.doctor === department)
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
            
            const now = new Date();
            let newAppointmentTime: Date;

            if (lastAppointmentInDept) {
                const lastAppointmentTime = new Date(lastAppointmentInDept.date);
                const proposedTime = new Date(lastAppointmentTime.getTime() + 15 * 60 * 1000);
                newAppointmentTime = proposedTime > now ? proposedTime : new Date(now.getTime() + 5 * 60 * 1000);
            } else {
                newAppointmentTime = new Date(now.getTime() + 5 * 60 * 1000);
            }

             const newAppointment: Appointment = {
                id: (prevAppointments.length > 0 ? Math.max(...prevAppointments.map(a => a.id)) : 0) + 1,
                patientId: patient.id,
                patient: patient,
                doctor: department,
                date: newAppointmentTime.toISOString(),
                reason: patient.symptoms,
                status: 'Scheduled',
            };
            return [...prevAppointments, newAppointment];
        }
        
        const lastAppointmentInDept = prevAppointments
            .filter(a => a.status === 'Scheduled' && a.doctor === department)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
            
        const now = new Date();
        let newAppointmentTime: Date;

        if (lastAppointmentInDept) {
            const lastAppointmentTime = new Date(lastAppointmentInDept.date);
            const proposedTime = new Date(lastAppointmentTime.getTime() + 15 * 60 * 1000);
            newAppointmentTime = proposedTime > now ? proposedTime : new Date(now.getTime() + 5 * 60 * 1000);
        } else {
            newAppointmentTime = new Date(now.getTime() + 5 * 60 * 1000);
        }
        
        return prevAppointments.map(appt => 
            appt.id === appointmentToSchedule.id
                ? { 
                    ...appt, 
                    status: 'Scheduled', 
                    doctor: department,
                    date: newAppointmentTime.toISOString()
                  } 
                : appt
        );
    });
  }, [patientDatabase]);
  
  const addDoctorNote = useCallback((appointmentId: number, notes: string, user: ProfessionalUser) => {
      let patientId: number | null = null;
      setAppointments(prev => prev.map(appt => {
          if (appt.id === appointmentId) {
              patientId = appt.patientId;
              return { ...appt, notes, status: 'Completed' };
          }
          return appt;
      }));

      if (patientId) {
          setPatientDatabase(prev => prev.map(p => p.id === patientId ? { ...p, status: 'Completed', auditLog: [...p.auditLog, createAuditEntry(user, "Doctor's Notes Added", {noteLength: notes.length})] } : p));
      }
  }, []);
  
  const updatePatientPassword = useCallback((patientId: number, newPassword: string) => {
    setPatientDatabase(prev => prev.map(p => {
        if (p.id === patientId) {
            const auditEntry = {
                timestamp: new Date().toISOString(),
                action: 'Password Changed',
                user: { id: String(p.id), name: p.name, role: UserRole.Patient },
            };
            return { ...p, previousPassword: p.password, password: newPassword, auditLog: [...p.auditLog, auditEntry] };
        }
        return p;
    }));
  }, []);

  const handleBackToDashboard = () => {
      setActiveRole(null);
      setLoggedInProfessional(null);
  }

  const renderView = () => {
    if (activeRole === null) {
        return <Dashboard onSelectRole={setActiveRole} />;
    }
    
    if (activeRole === UserRole.Patient) {
        return <PatientView 
            requestAppointment={requestAppointment} 
            appointments={appointments} 
            onBack={handleBackToDashboard} 
            registeredPatients={patientDatabase}
            onRegister={(data) => registerPatient(data)}
            onUpdatePassword={updatePatientPassword}
        />;
    }

    if (!loggedInProfessional || loggedInProfessional.role !== activeRole) {
        return <ProfessionalLogin
            role={activeRole}
            onLoginSuccess={(user) => {
                setLoggedInProfessional(user);
            }}
            onBack={() => setActiveRole(null)}
        />
    }

    switch (activeRole) {
      case UserRole.Intern:
        const triageQueue = patientDatabase.filter(p => p.status === 'Awaiting Triage');
        return <InternView user={loggedInProfessional} patients={triageQueue} addVitals={(id, vitals) => addVitals(id, vitals, loggedInProfessional)} assignToDoctor={(id, complaint, dept) => assignToDoctor(id, complaint, dept, loggedInProfessional)} onBack={handleBackToDashboard} appointments={appointments} />;
      case UserRole.Doctor:
        return <DoctorView user={loggedInProfessional} appointments={appointments} addDoctorNote={(id, notes) => addDoctorNote(id, notes, loggedInProfessional)} onBack={handleBackToDashboard}/>;
      case UserRole.Admin:
        return <AdminView user={loggedInProfessional} appointments={appointments} allPatients={patientDatabase} onBack={handleBackToDashboard}/>;
      case UserRole.Receptionist:
        return <ReceptionistView user={loggedInProfessional} appointments={appointments} requestAppointment={(data, isWalkin) => requestWalkInAppointment(data, isWalkin, loggedInProfessional)} allocateSlot={(id) => allocateSlot(id, loggedInProfessional)} checkInPatient={(id) => checkInPatient(id, loggedInProfessional)} rejectAppointment={(id) => rejectAppointment(id, loggedInProfessional)} onBack={handleBackToDashboard} />;
      default:
        return <Dashboard onSelectRole={setActiveRole} />;
    }
  };

  return (
    <div className="min-h-screen bg-light font-sans">
      <Header />
      <main className="p-4 sm:p-6 lg:p-8 container mx-auto">
        {renderView()}
      </main>
    </div>
  );
};

export default App;
