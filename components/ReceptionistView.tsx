
import React, { useState } from 'react';
import { Patient, Appointment } from '../types';
import Button from './common/Button';
import Card from './common/Card';
import { ArrowLeft, UserPlus, Search, CheckCircle } from 'lucide-react';

interface ReceptionistViewProps {
  patients: Patient[];
  appointments: Appointment[];
  requestAppointment: (patient: Omit<Patient, 'id' | 'registrationDate' | 'status'>, isWalkIn: boolean) => void;
  confirmAppointment: (appointmentId: number) => void;
  checkInPatient: (patientId: number) => void;
  onBack: () => void;
}

const WalkinRegistrationModal: React.FC<{onClose: () => void, onSubmit: (data: Omit<Patient, 'id' | 'registrationDate' | 'status'>, isWalkIn: boolean) => void}> = ({ onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
        name: '',
        dob: '',
        gender: '' as Patient['gender'] | '',
        mobileNumber: '',
        symptoms: '',
        department: 'General Medicine',
        isUrgentRequest: false,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({...prev, [name]: type === 'checkbox' ? checked : value}));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!formData.name || !formData.dob || !formData.gender || !formData.mobileNumber || !formData.symptoms) {
            alert('Please fill all required fields.');
            return;
        }

        const walkInPatient: Omit<Patient, 'id' | 'registrationDate' | 'status'> = {
            name: formData.name,
            dob: formData.dob,
            gender: formData.gender as Patient['gender'],
            mobileNumber: formData.mobileNumber,
            symptoms: formData.symptoms,
            department: formData.department,
            isUrgentRequest: formData.isUrgentRequest,
            maritalStatus: 'Single',
            guardianName: 'N/A',
        };
        onSubmit(walkInPatient, true);
        alert(`Patient ${formData.name} has been registered and sent to the triage queue.`);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card title="Register Walk-in Patient" className="w-full max-w-2xl">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
                            <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full input" required />
                        </div>
                        <div>
                            <label htmlFor="mobileNumber" className="block text-sm font-medium text-gray-700">Mobile Number</label>
                            <input type="tel" name="mobileNumber" id="mobileNumber" value={formData.mobileNumber} onChange={handleChange} className="mt-1 block w-full input" required />
                        </div>
                        <div>
                            <label htmlFor="dob" className="block text-sm font-medium text-gray-700">Date of Birth</label>
                            <input type="date" name="dob" id="dob" value={formData.dob} onChange={handleChange} className="mt-1 block w-full input" required />
                        </div>
                         <div>
                            <label htmlFor="gender" className="block text-sm font-medium text-gray-700">Gender</label>
                            <select name="gender" id="gender" value={formData.gender} onChange={handleChange} className="mt-1 block w-full input" required>
                                <option value="" disabled>Select Gender</option>
                                <option>Female</option>
                                <option>Male</option>
                                <option>Other</option>
                            </select>
                        </div>
                         <div className="md:col-span-2">
                            <label htmlFor="department" className="block text-sm font-medium text-gray-700">Department</label>
                            <select name="department" id="department" value={formData.department} onChange={handleChange} className="mt-1 block w-full input" required>
                                <option>General Medicine</option>
                                <option>Cardiology</option>
                                <option>Pediatrics</option>
                                <option>Orthopedics</option>
                                <option>Neurology</option>
                                <option>Dermatology</option>
                            </select>
                         </div>
                        <div className="md:col-span-2">
                            <label htmlFor="symptoms" className="block text-sm font-medium text-gray-700">Symptoms</label>
                            <textarea name="symptoms" id="symptoms" rows={3} value={formData.symptoms} onChange={handleChange} className="mt-1 block w-full input" required></textarea>
                        </div>
                         <div className="md:col-span-2">
                            <label className="flex items-center">
                                <input type="checkbox" name="isUrgentRequest" checked={formData.isUrgentRequest} onChange={handleChange} className="h-4 w-4 text-brand border-gray-300 rounded focus:ring-brand" />
                                <span className="ml-2 text-sm text-gray-600">Mark as Urgent Request</span>
                            </label>
                        </div>
                    </div>
                    <div className="flex justify-end space-x-2 pt-2">
                        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                        <Button type="submit">Register Patient</Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}

const ReceptionistView: React.FC<ReceptionistViewProps> = ({ appointments, requestAppointment, confirmAppointment, checkInPatient, onBack }) => {
    const [showWalkinModal, setShowWalkinModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchedPatient, setSearchedPatient] = useState<Appointment | null>(null);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const found = appointments.find(a =>
            (String(a.patientId) === searchTerm || a.patient.mobileNumber === searchTerm) && a.status === 'Scheduled'
        );
        if (found) {
            setSearchedPatient(found);
        } else {
            alert('No scheduled appointment found for this Patient ID or Mobile Number.');
            setSearchedPatient(null);
        }
    }

    const handleCheckIn = (patientId: number) => {
        checkInPatient(patientId);
        alert(`Patient PID${String(patientId).padStart(6,'0')} checked in and sent to triage.`);
        setSearchedPatient(null);
        setSearchTerm('');
    }
    
    const pendingConfirmation = appointments.filter(a => a.status === 'Pending Confirmation');
    
    return (
        <div>
            <style>{`.input { padding: 0.5rem 0.75rem; border: 1px solid #D1D5DB; border-radius: 0.375rem; box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05); outline: none; transition: all 0.2s; } .input:focus { border-color: #00796B; box-shadow: 0 0 0 2px rgba(0, 121, 107, 0.5); }`}</style>
            {showWalkinModal && <WalkinRegistrationModal onClose={() => setShowWalkinModal(false)} onSubmit={requestAppointment} />}
            
            <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                <Button onClick={onBack} variant="secondary" className="!px-3 !py-1 text-sm">
                    <ArrowLeft size={16} className="mr-2" />
                    Back to Dashboard
                </Button>
                <h2 className="text-3xl font-bold text-dark">Receptionist Dashboard</h2>
                <Button onClick={() => setShowWalkinModal(true)}>
                    <UserPlus size={18} className="mr-2"/>
                    Register Walk-in Patient
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* APPOINTMENT VERIFICATION */}
                <Card title={`Appointment Verification Queue (${pendingConfirmation.length})`}>
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                        {pendingConfirmation.map(appt => (
                            <div key={appt.id} className="p-3 bg-gray-50 rounded-lg border flex justify-between items-center">
                                <div>
                                    <p className="font-semibold text-gray-800">{appt.patient.name}</p>
                                    <p className="text-sm text-gray-600">Department: {appt.patient.department}</p>
                                    <p className="text-xs text-gray-500 mt-1">Symptoms: {appt.reason}</p>
                                </div>
                                <Button onClick={() => confirmAppointment(appt.id)} className="!py-1 !px-2 !text-xs">
                                    Confirm
                                </Button>
                            </div>
                        ))}
                        {pendingConfirmation.length === 0 && <p className="text-gray-500 text-center py-4">No appointments to verify.</p>}
                    </div>
                </Card>

                {/* PATIENT CHECK IN */}
                <Card title="Patient Check-in">
                    <form onSubmit={handleSearch} className="flex gap-2 mb-4">
                        <input 
                            type="text" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="flex-grow input" 
                            placeholder="Search PID or Mobile Number..."
                        />
                        <Button type="submit" className="!px-4">
                            <Search size={18}/>
                        </Button>
                    </form>
                    {searchedPatient ? (
                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                             <h4 className="font-bold text-lg text-green-800">{searchedPatient.patient.name}</h4>
                             <p className="text-sm text-green-700">PID: {String(searchedPatient.patientId).padStart(6, '0')}</p>
                             <p className="text-sm text-green-700">Appointment with: {searchedPatient.doctor}</p>
                             <Button onClick={() => handleCheckIn(searchedPatient.patientId)} className="mt-4 w-full">
                                <CheckCircle size={16} className="mr-2" />
                                 Check In Patient
                             </Button>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <p>Search for a patient to check them in.</p>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default ReceptionistView;
