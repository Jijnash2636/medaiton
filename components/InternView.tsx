
import React, { useState } from 'react';
import { Patient, Vitals, ProfessionalUser, Appointment } from '../types';
import Card from './common/Card';
import Button from './common/Button';
import PatientProfileView from './PatientProfileView';
import { ArrowLeft, User, Stethoscope, ChevronDown, Check } from 'lucide-react';

interface InternViewProps {
  user: ProfessionalUser;
  patients: Patient[];
  appointments: Appointment[];
  addVitals: (patientId: number, vitals: Vitals) => void;
  assignToDoctor: (patientId: number, chiefComplaint: string, department: string) => void;
  onBack: () => void;
}

const getAge = (dobString: string): number => {
    if (!dobString) return 0;
    const today = new Date();
    const birthDate = new Date(dobString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};

const departments = ['General Medicine', 'Cardiology', 'Pediatrics', 'Orthopedics', 'Neurology', 'Dermatology'];

const PatientTriageCard: React.FC<{ 
    patient: Patient; 
    onViewProfile: (patient: Patient) => void;
    onAssign: (patientId: number, vitals: Vitals, chiefComplaint: string, department: string) => void;
}> = ({ patient, onViewProfile, onAssign }) => {
    const [vitals, setVitals] = useState({ bloodPressure: '120/80', heartRate: '70', temperature: '37.0', spo2: '98' });
    const [chiefComplaint, setChiefComplaint] = useState('');
    const [department, setDepartment] = useState(patient.department || 'General Medicine');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const age = getAge(patient.dob);

    const handleVitalsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setVitals(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!chiefComplaint) {
            alert("Please enter the patient's main cause for the visit.");
            return;
        }
        setIsSubmitting(true);
        const parsedVitals = {
            bloodPressure: vitals.bloodPressure,
            heartRate: parseInt(vitals.heartRate),
            temperature: parseFloat(vitals.temperature),
            spo2: parseInt(vitals.spo2),
        };
        onAssign(patient.id, parsedVitals, chiefComplaint, department);
        // The component will unmount on successful assignment, so no need to setIsSubmitting(false)
    };
    
    return (
        <Card className="w-full">
             <div className="flex justify-between items-start">
                <div>
                    <p className="text-xl font-bold text-brand cursor-pointer hover:underline" onClick={() => onViewProfile(patient)}>{patient.name}</p>
                    <p className="text-sm text-gray-500">{age} y/o, {patient.gender} (PID{String(patient.id).padStart(6, '0')})</p>
                </div>
                <span className="text-xs text-gray-400">{new Date(patient.registrationDate).toLocaleTimeString()}</span>
            </div>
            <div className="mt-4">
                <p className="font-semibold text-gray-700">Patient's Stated Symptoms:</p>
                <p className="text-gray-600 bg-gray-50 p-2 rounded-md whitespace-pre-wrap text-sm">{patient.symptoms}</p>
            </div>
            
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                {/* Vitals */}
                <div>
                    <h4 className="font-semibold text-md text-gray-800 mb-2">1. Record Vitals</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <input name="bloodPressure" value={vitals.bloodPressure} onChange={handleVitalsChange} placeholder="BP (e.g., 120/80)" className="p-2 border rounded" required />
                        <input name="heartRate" value={vitals.heartRate} onChange={handleVitalsChange} placeholder="HR (bpm)" className="p-2 border rounded" type="number" required />
                        <input name="temperature" value={vitals.temperature} onChange={handleVitalsChange} placeholder="Temp (°C)" className="p-2 border rounded" type="number" step="0.1" required/>
                        <input name="spo2" value={vitals.spo2} onChange={handleVitalsChange} placeholder="SpO2 (%)" className="p-2 border rounded" type="number" required/>
                    </div>
                </div>

                {/* Chief Complaint */}
                 <div>
                    <h4 className="font-semibold text-md text-gray-800 mb-2">2. Note Main Cause</h4>
                     <textarea 
                        value={chiefComplaint}
                        onChange={(e) => setChiefComplaint(e.target.value)}
                        rows={3}
                        className="w-full p-2 border rounded"
                        placeholder="Enter the primary reason for the patient's visit..."
                        required
                     />
                </div>

                {/* Department Assignment */}
                <div>
                    <h4 className="font-semibold text-md text-gray-800 mb-2">3. Assign to Department</h4>
                    <select value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full p-2 border rounded bg-white" required>
                         {departments.map(dep => <option key={dep} value={dep}>{dep}</option>)}
                    </select>
                </div>

                <div className="pt-2">
                    <Button type="submit" className="w-full" isLoading={isSubmitting}>
                        <Check size={16} className="mr-2" />
                        Submit & Assign to Doctor
                    </Button>
                </div>
            </form>
        </Card>
    );
};

const InternView: React.FC<InternViewProps> = ({ user, patients, appointments, addVitals, assignToDoctor, onBack }) => {
  const [viewingPatient, setViewingPatient] = useState<Patient | null>(null);
  
  const sortedPatients = [...patients].sort((a, b) => new Date(a.registrationDate).getTime() - new Date(b.registrationDate).getTime());

  const handleAssign = (patientId: number, vitals: Vitals, chiefComplaint: string, department: string) => {
    // Vitals are added first as a separate, auditable action
    addVitals(patientId, vitals);
    // Then the assignment action is called, which handles the rest
    assignToDoctor(patientId, chiefComplaint, department);
  };

  return (
    <div>
      <Button onClick={onBack} variant="secondary" className="mb-6 !px-3 !py-1 text-sm">
          <ArrowLeft size={16} className="mr-2" />
          Back to Dashboard
      </Button>
      {viewingPatient && <PatientProfileView patient={viewingPatient} appointments={appointments} onClose={() => setViewingPatient(null)} />}
      <h2 className="text-3xl font-bold text-dark mb-6">Intern's Triage Queue ({user.name})</h2>
      
      {sortedPatients.length === 0 ? (
        <Card>
            <p className="text-center text-gray-500">No patients in the queue.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedPatients.map(patient => (
                <PatientTriageCard 
                    key={patient.id} 
                    patient={patient} 
                    onViewProfile={setViewingPatient}
                    onAssign={handleAssign}
                />
            ))}
        </div>
      )}
    </div>
  );
};

export default InternView;
