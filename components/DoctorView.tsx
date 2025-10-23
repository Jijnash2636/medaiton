import React, { useState } from 'react';
import { Appointment, Patient } from '../types';
import Card from './common/Card';
import Button from './common/Button';
import Spinner from './common/Spinner';
import { generateSOAPNotes } from '../services/geminiService';
import { ArrowLeft } from 'lucide-react';

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

const DoctorModal: React.FC<{ appointment: Appointment, onClose: () => void, onSaveNote: (id: number, note: string) => void }> = ({ appointment, onClose, onSaveNote }) => {
    const { patient } = appointment;
    const [isLoading, setIsLoading] = useState(false);
    const [note, setNote] = useState(appointment.notes || '');
    const age = getAge(patient.dob);

    const handleGenerateNote = async () => {
        setIsLoading(true);
        try {
            const generatedNote = await generateSOAPNotes(patient, appointment);
            setNote(generatedNote);
        } catch (error) {
            alert('Failed to generate SOAP notes.');
        } finally {
            setIsLoading(false);
        }
    }
    
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-brand">Consultation: {patient.name}</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800">&times;</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 className="font-semibold text-gray-800 mb-2">Patient Details</h4>
                        <p><strong>Age:</strong> {age}</p>
                        <p><strong>Gender:</strong> {patient.gender}</p>
                        <p><strong>Symptoms:</strong> {patient.symptoms}</p>
                         {patient.vitals && <div className="mt-2">
                            <strong>Vitals:</strong> BP {patient.vitals.bloodPressure}, HR {patient.vitals.heartRate}, Temp {patient.vitals.temperature}°C, SpO2 {patient.vitals.spo2}%
                         </div>}
                         {patient.triageSuggestion && <div className="mt-2">
                             <p><strong>Triage Summary:</strong> {patient.triageSuggestion.summary}</p>
                             <p><strong>Classification:</strong> {patient.triageSuggestion.classification}</p>
                         </div>}
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-800 mb-2">Doctor Copilot AI</h4>
                        <Button onClick={handleGenerateNote} isLoading={isLoading}>Generate SOAP Notes</Button>
                        <textarea 
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          rows={12} 
                          className="w-full mt-2 p-2 border rounded bg-gray-50 text-sm whitespace-pre-wrap" 
                          placeholder="SOAP notes will appear here..."></textarea>
                    </div>
                </div>
                 <div className="mt-6 flex justify-end space-x-3">
                    <Button variant="secondary" onClick={onClose}>Close</Button>
                    <Button onClick={() => onSaveNote(appointment.id, note)} disabled={!note}>Save Note & Complete</Button>
                </div>
            </Card>
        </div>
    )
}

const AppointmentRow: React.FC<{appointment: Appointment, onSelect: (appt: Appointment) => void}> = ({appointment, onSelect}) => {
    const classification = appointment.patient.triageSuggestion?.classification;
    const rowColor = {
        'Critical': 'bg-red-50 border-l-4 border-danger',
        'Moderate': 'bg-yellow-50 border-l-4 border-warning',
        'Stable': 'bg-white'
    }
    const statusColor = {
        'Scheduled': 'bg-blue-100 text-blue-800',
        'Completed': 'bg-green-100 text-green-800',
        'Cancelled': 'bg-gray-100 text-gray-800',
    }
    
    return (
      <tr className={`${rowColor[classification || 'Stable']} hover:bg-gray-100`}>
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{appointment.patient.name}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(appointment.date).toLocaleTimeString()}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{classification}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">{appointment.reason}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm">
           <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor[appointment.status]}`}>
             {appointment.status}
           </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
            {appointment.status === 'Scheduled' && 
                <Button onClick={() => onSelect(appointment)} className="!text-xs !py-1">View Details</Button>
            }
        </td>
      </tr>
    )
}

const DoctorView: React.FC<{ appointments: Appointment[], addDoctorNote: (id: number, note: string) => void, onBack: () => void }> = ({ appointments, addDoctorNote, onBack }) => {
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  
  const emergencyQueue = appointments.filter(a => a.patient.triageSuggestion?.classification === 'Critical' && a.status === 'Scheduled');
  const scheduledAppointments = appointments.filter(a => a.patient.triageSuggestion?.classification !== 'Critical' && a.status === 'Scheduled');
  const completedAppointments = appointments.filter(a => a.status === 'Completed');
  
  const handleSaveNote = (id: number, note: string) => {
    addDoctorNote(id, note);
    setSelectedAppointment(null);
  }

  const renderTable = (title: string, data: Appointment[]) => (
    <Card className="mb-8">
        <h3 className="text-xl font-semibold text-gray-700 mb-4 px-4 pt-2">{title} ({data.length})</h3>
        {data.length === 0 ? <p className="text-center text-gray-500 pb-4">No appointments in this queue.</p> :
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Urgency</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.map(appt => <AppointmentRow key={appt.id} appointment={appt} onSelect={setSelectedAppointment} />)}
                  </tbody>
                </table>
            </div>
        }
    </Card>
  );

  return (
    <div>
        <Button onClick={onBack} variant="secondary" className="mb-6 !px-3 !py-1 text-sm">
            <ArrowLeft size={16} className="mr-2" />
            Back to Dashboard
        </Button>
      <h2 className="text-3xl font-bold text-dark mb-6">Doctor's Dashboard (DID000067)</h2>
      {selectedAppointment && <DoctorModal appointment={selectedAppointment} onClose={() => setSelectedAppointment(null)} onSaveNote={handleSaveNote} />}
      
      {renderTable('Emergency Queue', emergencyQueue)}
      {renderTable('Scheduled Appointments', scheduledAppointments)}
      {renderTable('Completed Consultations', completedAppointments)}
    </div>
  );
};

export default DoctorView;
