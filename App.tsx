
import React, { useState, useCallback } from 'react';
import { UserRole, Patient, Appointment, Vitals, TriageSuggestion } from './types';
import Header from './components/Header';
import PatientView from './components/PatientView';
import NurseView from './components/NurseView';
import DoctorView from './components/DoctorView';
import AdminView from './components/AdminView';
import Dashboard from './components/Dashboard';
import ReceptionistView from './components/ReceptionistView';

const App: React.FC = () => {
  const [activeRole, setActiveRole] = useState<UserRole | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const requestAppointment = useCallback((patientData: Omit<Patient, 'id' | 'registrationDate' | 'status'>, isWalkIn: boolean = false) => {
    const newPatientId = (patients.length > 0 || appointments.length > 0) ? Math.max(
        ...patients.map(p => p.id), 
        ...appointments.map(a => a.patient.id),
        0
    ) + 1 : 1;
    
    const newPatient: Patient = {
        ...patientData,
        id: newPatientId,
        registrationDate: new Date().toISOString(),
        status: isWalkIn ? 'Awaiting Triage' : 'Awaiting Check-in',
    };
    
    if (isWalkIn) {
        setPatients(prev => [...prev, newPatient]);
        return;
    }

    const newAppointment: Appointment = {
        id: (appointments.length > 0 ? Math.max(...appointments.map(a => a.id)) : 0) + 1,
        patientId: newPatient.id,
        patient: newPatient,
        doctor: 'To be assigned',
        date: new Date().toISOString(), // This will be updated on confirmation
        reason: patientData.symptoms,
        status: 'Pending Confirmation',
    };

    setAppointments(prev => [...prev, newAppointment]);
  }, [patients, appointments]);

  const confirmAppointment = useCallback((appointmentId: number) => {
      setAppointments(prev => prev.map(appt => 
          appt.id === appointmentId 
              ? { ...appt, status: 'Scheduled', doctor: appt.patient.department || 'General Practitioner' } 
              : appt
      ));
  }, []);

  const checkInPatient = useCallback((patientId: number) => {
      setAppointments(prevAppointments => {
          const appointmentToCheckIn = prevAppointments.find(a => a.patientId === patientId && a.status === 'Scheduled');
          if (appointmentToCheckIn) {
              const patient = { ...appointmentToCheckIn.patient, status: 'Awaiting Triage' as const };
              setPatients(prevPatients => [...prevPatients, patient]);
              // Remove from appointments to avoid re-checkin, or just update status if needed elsewhere
              return prevAppointments.filter(a => a.id !== appointmentToCheckIn.id);
          }
          return prevAppointments;
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
        return <NurseView patients={patients.filter(p => p.status === 'Awaiting Triage' || p.status === 'Awaiting Doctor')} addVitals={addVitals} updatePatientTriage={updatePatientTriage} scheduleAppointment={scheduleAppointment} onBack={handleBackToDashboard}/>;
      case UserRole.Doctor:
        return <DoctorView appointments={appointments} addDoctorNote={addDoctorNote} onBack={handleBackToDashboard}/>;
      case UserRole.Admin:
        const completedPatients = appointments.filter(a => a.status === 'Completed').map(a => a.patient);
        return <AdminView initialPatients={patients} appointments={appointments} allPatients={[...patients, ...completedPatients]} onBack={handleBackToDashboard}/>;
      case UserRole.Receptionist:
        return <ReceptionistView patients={patients} appointments={appointments} requestAppointment={requestAppointment} confirmAppointment={confirmAppointment} checkInPatient={checkInPatient} onBack={handleBackToDashboard} />;
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
