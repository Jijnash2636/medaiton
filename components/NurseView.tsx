import React, { useState } from 'react';
import { Patient, TriageSuggestion, Vitals } from '../types';
import { getTriageSuggestion } from '../services/geminiService';
import Card from './common/Card';
import Button from './common/Button';
import Spinner from './common/Spinner';
import { AlertTriangle, HeartPulse, Thermometer, Gauge, ArrowLeft } from 'lucide-react';

interface NurseViewProps {
  patients: Patient[];
  addVitals: (patientId: number, vitals: Vitals) => void;
  updatePatientTriage: (patientId: number, triage: TriageSuggestion) => void;
  scheduleAppointment: (patient: Patient) => void;
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

const ClassificationBadge: React.FC<{ classification: TriageSuggestion['classification'] }> = ({ classification }) => {
    const colorMap = {
        'Stable': 'bg-green-100 text-green-800',
        'Moderate': 'bg-yellow-100 text-yellow-800',
        'Critical': 'bg-red-100 text-red-800'
    };
    return <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colorMap[classification]}`}>{classification}</span>
}

const VitalsForm: React.FC<{ patientId: number, onSave: (id: number, vitals: Vitals) => void }> = ({ patientId, onSave }) => {
    const [vitals, setVitals] = useState({ bloodPressure: '120/80', heartRate: '70', temperature: '37.0', spo2: '98' });
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setVitals(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(patientId, {
            bloodPressure: vitals.bloodPressure,
            heartRate: parseInt(vitals.heartRate),
            temperature: parseFloat(vitals.temperature),
            spo2: parseInt(vitals.spo2),
        });
    };
    return (
        <form onSubmit={handleSubmit} className="mt-4 space-y-2 bg-gray-50 p-3 rounded-lg">
            <h4 className="font-semibold text-sm text-gray-700 mb-2">Record Vitals</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
                <input name="bloodPressure" value={vitals.bloodPressure} onChange={handleChange} placeholder="BP (e.g., 120/80)" className="p-1 border rounded" />
                <input name="heartRate" value={vitals.heartRate} onChange={handleChange} placeholder="HR (bpm)" className="p-1 border rounded" type="number"/>
                <input name="temperature" value={vitals.temperature} onChange={handleChange} placeholder="Temp (°C)" className="p-1 border rounded" type="number" step="0.1" />
                <input name="spo2" value={vitals.spo2} onChange={handleChange} placeholder="SpO2 (%)" className="p-1 border rounded" type="number"/>
            </div>
            <Button type="submit" className="w-full mt-2 !py-1 !text-xs">Save Vitals</Button>
        </form>
    )
}

const PatientCard: React.FC<{ patient: Patient; onVitalsSave: (id: number, vitals: Vitals) => void; onTriage: (id: number) => void; onSchedule: (patient: Patient) => void; isLoading: boolean, currentPatientId: number | null }> = ({ patient, onVitalsSave, onTriage, onSchedule, isLoading, currentPatientId }) => {
    const isThisPatientLoading = isLoading && currentPatientId === patient.id;
    const [showVitalsForm, setShowVitalsForm] = useState(false);
    const age = getAge(patient.dob);

    const handleSaveVitals = (id: number, vitals: Vitals) => {
        onVitalsSave(id, vitals);
        setShowVitalsForm(false);
    }
    
    return (
        <Card className={`w-full ${patient.isUrgentRequest ? 'border-2 border-danger' : ''}`}>
            {/* FIX: Moved title prop from AlertTriangle to parent div as lucide-react icons do not accept it. */}
            {patient.isUrgentRequest && <div className="absolute top-2 right-2 text-danger" title="Urgent Request"><AlertTriangle size={18} /></div>}
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-xl font-bold text-brand">{patient.name}</p>
                    <p className="text-sm text-gray-500">{age} y/o, {patient.gender} (PID{String(patient.id).padStart(6, '0')})</p>
                </div>
                <span className="text-xs text-gray-400">{new Date(patient.registrationDate).toLocaleTimeString()}</span>
            </div>
            <div className="mt-4">
                <p className="font-semibold text-gray-700">Symptoms:</p>
                <p className="text-gray-600 bg-gray-50 p-2 rounded-md whitespace-pre-wrap">{patient.symptoms}</p>
            </div>

            {patient.vitals && (
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-gray-700">
                    <div className="flex items-center"><Gauge size={14} className="mr-2 text-secondary" /> BP: {patient.vitals.bloodPressure}</div>
                    <div className="flex items-center"><HeartPulse size={14} className="mr-2 text-secondary" /> HR: {patient.vitals.heartRate} bpm</div>
                    <div className="flex items-center"><Thermometer size={14} className="mr-2 text-secondary" /> Temp: {patient.vitals.temperature}°C</div>
                    <div className="flex items-center"><span className="font-bold mr-2 ml-px text-secondary">O₂</span> SpO2: {patient.vitals.spo2}%</div>
                </div>
            )}

            {isThisPatientLoading && <Spinner />}
            
            {patient.triageSuggestion && !isThisPatientLoading && (
                 <div className="mt-4 space-y-2 text-sm bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-900 flex justify-between">AI Triage <ClassificationBadge classification={patient.triageSuggestion.classification} /></h4>
                    <p><strong className="text-blue-800">Summary:</strong> {patient.triageSuggestion.summary}</p>
                    <p><strong className="text-blue-800">Suggested Specialist:</strong> {patient.triageSuggestion.potentialSpecialist}</p>
                </div>
            )}
            
            {showVitalsForm && !patient.vitals && <VitalsForm patientId={patient.id} onSave={handleSaveVitals} />}

            <div className="mt-6 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 justify-end">
                {!patient.vitals && !showVitalsForm && <Button onClick={() => setShowVitalsForm(true)}>Record Vitals</Button>}
                {patient.vitals && !patient.triageSuggestion && (
                    <Button onClick={() => onTriage(patient.id)} isLoading={isThisPatientLoading}>
                        Get AI Triage
                    </Button>
                )}
                {patient.triageSuggestion && (
                     <Button variant="secondary" onClick={() => onSchedule(patient)}>
                        Send to Doctor Queue
                    </Button>
                )}
            </div>
        </Card>
    )
}

const NurseView: React.FC<NurseViewProps> = ({ patients, addVitals, updatePatientTriage, scheduleAppointment, onBack }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPatientId, setCurrentPatientId] = useState<number | null>(null);
  
  const sortedPatients = [...patients].sort((a, b) => (b.isUrgentRequest ? 1 : -1) - (a.isUrgentRequest ? 1 : -1) || new Date(a.registrationDate).getTime() - new Date(b.registrationDate).getTime());

  const handleTriage = async (patientId: number) => {
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;

    setIsLoading(true);
    setError(null);
    setCurrentPatientId(patientId);
    try {
      const suggestion = await getTriageSuggestion(patient);
      updatePatientTriage(patientId, suggestion);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
      setCurrentPatientId(null);
    }
  };

  return (
    <div>
      <Button onClick={onBack} variant="secondary" className="mb-6 !px-3 !py-1 text-sm">
          <ArrowLeft size={16} className="mr-2" />
          Back to Dashboard
      </Button>
      <h2 className="text-3xl font-bold text-dark mb-6">Patient Triage Queue (NID000045)</h2>
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}
      
      {sortedPatients.length === 0 ? (
        <Card>
            <p className="text-center text-gray-500">No patients in the queue.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedPatients.map(patient => (
                <PatientCard 
                    key={patient.id} 
                    patient={patient} 
                    onVitalsSave={addVitals}
                    onTriage={handleTriage}
                    onSchedule={scheduleAppointment}
                    isLoading={isLoading}
                    currentPatientId={currentPatientId}
                />
            ))}
        </div>
      )}
    </div>
  );
};

export default NurseView;