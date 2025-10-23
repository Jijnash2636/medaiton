import React, { useState, useMemo } from 'react';
import Button from './common/Button';
import Card from './common/Card';
import { Calendar, Tag, AlertTriangle, ArrowLeft } from 'lucide-react';

interface AppointmentBookingScreenProps {
  onSubmit: (data: { symptoms: string; isUrgentRequest: boolean; department: string; appointmentDate: string }) => void;
  onBack: () => void;
}

// Function to generate deterministic, pseudo-random availability data
const getSimulatedAvailability = (dateString: string, department: string): { slots: number; waiting: number } => {
    let hash = 0;
    const combinedString = dateString + department;
    if (combinedString.length === 0) return { slots: 10, waiting: 0 };
    for (let i = 0; i < combinedString.length; i++) {
        const char = combinedString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    const waiting = Math.abs(hash) % 16;
    const slots = Math.max(0, 15 - waiting + (Math.abs(hash % 5) - 2)); // Make it a bit variable
    return { slots, waiting };
};

const departments = ['General Medicine', 'Cardiology', 'Pediatrics', 'Orthopedics', 'Neurology', 'Dermatology'];
const commonSymptoms = [
    'fever', 'cough', 'fatigue', 'shortness of breath', 'chest pain', 'headache',
    'dizziness', 'sore throat', 'nausea', 'vomiting', 'abdominal pain', 'diarrhea',
    'rash', 'confusion', 'weakness', 'back pain', 'palpitations', 'syncope',
    'bleeding', 'loss of appetite', 'anosmia'
  ];

const AppointmentBookingScreen: React.FC<AppointmentBookingScreenProps> = ({ onSubmit, onBack }) => {
  const [appointmentData, setAppointmentData] = useState({
    appointmentDate: new Date().toISOString().split('T')[0],
    department: 'General Medicine',
    symptoms: '',
    isUrgentRequest: false,
  });

  const availability = useMemo(() => {
    return getSimulatedAvailability(appointmentData.appointmentDate, appointmentData.department);
  }, [appointmentData.appointmentDate, appointmentData.department]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setAppointmentData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

   const handleSymptomClick = (symptom: string) => {
    const symptomToAdd = symptom.charAt(0).toUpperCase() + symptom.slice(1);
    setAppointmentData(prev => {
        const currentSymptoms = prev.symptoms.trim();
        const symptomsList = currentSymptoms.split(',').map(s => s.trim().toLowerCase());
        if (symptomsList.includes(symptom.toLowerCase())) return prev;
        return { ...prev, symptoms: currentSymptoms ? `${currentSymptoms}, ${symptomToAdd}` : symptomToAdd };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointmentData.symptoms) {
      alert('Please describe your symptoms.');
      return;
    }
    onSubmit(appointmentData);
  };

  return (
    <Card>
        <div className="flex items-center mb-6">
            <Button onClick={onBack} variant="secondary" className="!p-2 mr-4">
                <ArrowLeft size={16} />
            </Button>
            <h2 className="text-2xl font-bold text-dark">Book an Appointment</h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Date and Department Selection */}
                <div>
                    <label htmlFor="appointmentDate" className="flex items-center text-sm font-medium text-gray-700 mb-1"><Calendar size={16} className="mr-2 text-secondary"/> Select Date</label>
                    <input type="date" id="appointmentDate" name="appointmentDate" value={appointmentData.appointmentDate} onChange={handleChange} className="block w-full input" min={new Date().toISOString().split('T')[0]} />
                </div>
                <div>
                    <label htmlFor="department" className="flex items-center text-sm font-medium text-gray-700 mb-1"><Tag size={16} className="mr-2 text-secondary"/> Select Department</label>
                    <select id="department" name="department" value={appointmentData.department} onChange={handleChange} className="block w-full input">
                        {departments.map(dep => <option key={dep} value={dep}>{dep}</option>)}
                    </select>
                </div>
            </div>

            {/* Real-Time Availability Widget */}
            <div className="p-4 bg-brand/10 border border-brand/20 rounded-lg flex justify-around text-center">
                <div>
                    <p className="text-2xl font-bold text-brand">{availability.slots}</p>
                    <p className="text-sm text-brand/80">Available Slots</p>
                </div>
                <div>
                    <p className="text-2xl font-bold text-brand">{availability.waiting}</p>
                    <p className="text-sm text-brand/80">Waiting List Size</p>
                </div>
            </div>
            
            {/* Symptoms Input */}
            <div>
                <label htmlFor="symptoms" className="block text-sm font-medium text-gray-700">Chief Complaint / Reason for Visit</label>
                <textarea id="symptoms" name="symptoms" rows={5} value={appointmentData.symptoms} onChange={handleChange} className="mt-1 block w-full input" placeholder="Describe your symptoms in detail. This information will be used by our AI Triage Agent." required></textarea>
                 <div className="mt-3">
                    <p className="text-xs text-gray-600 mb-2">Or click to add common symptoms:</p>
                    <div className="flex flex-wrap gap-2">
                        {commonSymptoms.map(symptom => (
                            <button type="button" key={symptom} onClick={() => handleSymptomClick(symptom)} className="px-3 py-1 bg-light text-brand text-xs font-semibold rounded-full hover:bg-gray-200 transition-colors">
                                {symptom.charAt(0).toUpperCase() + symptom.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Urgent Request */}
            <div 
                className={`p-4 rounded-lg cursor-pointer transition-all duration-300 flex items-center ${appointmentData.isUrgentRequest ? 'bg-danger/10 border-danger' : 'bg-warning/10 border-warning'}`}
                onClick={() => setAppointmentData(p => ({...p, isUrgentRequest: !p.isUrgentRequest}))}
            >
                <AlertTriangle size={24} className={`mr-4 ${appointmentData.isUrgentRequest ? 'text-danger' : 'text-warning'}`} />
                <div>
                    <h4 className={`font-bold ${appointmentData.isUrgentRequest ? 'text-danger' : 'text-warning'}`}>
                        {appointmentData.isUrgentRequest ? 'This is an Emergency Request' : 'Request Urgent Attention'}
                    </h4>
                    <p className="text-sm text-gray-600">
                        {appointmentData.isUrgentRequest 
                            ? "Your request will be prioritized. If this is a life-threatening emergency, please call emergency services immediately."
                            : "Check this if you believe your condition requires immediate attention."
                        }
                    </p>
                </div>
                 <input readOnly type="checkbox" name="isUrgentRequest" checked={appointmentData.isUrgentRequest} className="ml-auto h-5 w-5 text-secondary focus:ring-secondary border-gray-300 rounded" />
            </div>

            <div className="text-right pt-4">
                <Button type="submit">Send Request to Nurse</Button>
            </div>
        </form>
    </Card>
  );
};

export default AppointmentBookingScreen;