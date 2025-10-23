
import React, { useState, useCallback } from 'react';
import { UserRole, Patient, Appointment, Vitals, TriageSuggestion } from './types';
import Header from './components/Header';
import PatientView from './components/PatientView';
import NurseView from './components/NurseView';
import DoctorView from './components/DoctorView';
import AdminView from './components/AdminView';
import Dashboard from './components/Dashboard';

const App: React.FC = () => {
  const [activeRole, setActiveRole] = useState<UserRole | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const requestAppointment = useCallback((patientData: Omit<Patient, 'id' | 'registrationDate' | 'status'>) => {
    setPatients(prev => {
      const newPatient: Patient = {
        ...patientData,
        id: (prev.length > 0 ? Math.max(...prev.map(p => p.id)) : 0) + 1,
        registrationDate: new Date().toISOString(),
        status: 'Awaiting Triage',
      };
      return [...prev, newPatient];
    });
  }, []);

  const addVitals = useCallback((patientId: number, vitals: Vitals) => {
    setPatients(prev => prev.map(p => p.id === patientId ? { ...p, vitals } : p));
  }, []);

  const updatePatientTriage = useCallback((patientId: number, triage: TriageSuggestion) => {
    setPatients(prev => prev.map(p => p.id === patientId ? { ...p, triageSuggestion: triage, status: 'Awaiting Doctor' } : p));
  }, []);
  
  const scheduleAppointment = useCallback((patient: Patient) => {
      if (!patient.triageSuggestion) return;

      const appointmentDate = new Date();
      if (patient.triageSuggestion.classification !== 'Critical') {
        appointmentDate.setHours(appointmentDate.getHours() + 2); // Schedule for later today
      } else {
        appointmentDate.setMinutes(appointmentDate.getMinutes() + 5); // Schedule immediately
      }
      
      const newAppointment: Appointment = {
          id: (appointments.length > 0 ? Math.max(...appointments.map(a => a.id)) : 0) + 1,
          patientId: patient.id,
          patient: patient,
          doctor: patient.triageSuggestion.potentialSpecialist || 'General Practitioner',
          date: appointmentDate.toISOString(),
          reason: patient.symptoms,
          status: 'Scheduled',
      };
      setAppointments(prev => [...prev, newAppointment].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
      setPatients(prev => prev.filter(p => p.id !== patient.id));
  }, [appointments]);
  
  const addDoctorNote = useCallback((appointmentId: number, notes: string) => {
      setAppointments(prev => prev.map(appt => 
          appt.id === appointmentId ? { ...appt, notes, status: 'Completed' } : appt
      ));
  }, []);
  
  const handleBackToDashboard = () => {
      setActiveRole(null);
  }

  const renderView = () => {
    if (activeRole === null) {
        return <Dashboard onSelectRole={setActiveRole} />;
    }

    switch (activeRole) {
      case UserRole.Patient:
        return <PatientView requestAppointment={requestAppointment} appointments={appointments} onBack={handleBackToDashboard} />; 
      case UserRole.Nurse:
        return <NurseView patients={patients} addVitals={addVitals} updatePatientTriage={updatePatientTriage} scheduleAppointment={scheduleAppointment} onBack={handleBackToDashboard}/>;
      case UserRole.Doctor:
        return <DoctorView appointments={appointments} addDoctorNote={addDoctorNote} onBack={handleBackToDashboard}/>;
      case UserRole.Admin:
        const completedPatients = appointments.filter(a => a.status === 'Completed').map(a => a.patient);
        return <AdminView initialPatients={patients} appointments={appointments} allPatients={[...patients, ...completedPatients]} onBack={handleBackToDashboard}/>;
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
