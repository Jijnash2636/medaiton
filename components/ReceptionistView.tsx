
import React, { useState } from 'react';
import { Patient, Appointment, ProfessionalUser, UserRole } from '../types';
import Button from './common/Button';
import Card from './common/Card';
import PatientProfileView from './PatientProfileView';
import { ArrowLeft, UserPlus, Search, CheckCircle, Eye, User, Cake, VenetianMask, Phone, Heart, ClipboardList, AlertTriangle, Bell } from 'lucide-react';

interface ReceptionistViewProps {
  user: ProfessionalUser;
  appointments: Appointment[];
  requestAppointment: (patient: Omit<Patient, 'id' | 'registrationDate' | 'status' | 'auditLog'>, isWalkIn: boolean) => void;
  allocateSlot: (appointmentId: number) => void;
  rejectAppointment: (appointmentId: number) => void;
  checkInPatient: (patientId: number) => void;
  onBack: () => void;
}

const WalkinRegistrationModal: React.FC<{onClose: () => void, onSubmit: (data: Omit<Patient, 'id' | 'registrationDate' | 'status' | 'auditLog'>, isWalkIn: boolean) => void}> = ({ onClose, onSubmit }) => {
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

        const walkInPatient: Omit<Patient, 'id' | 'registrationDate' | 'status' | 'auditLog'> = {
            name: formData.name,
            dob: formData.dob,
            gender: formData.gender as Patient['gender'],
            mobileNumber: formData.mobileNumber,
            password: Math.random().toString(36).slice(-8), // Assign random password
            symptoms: formData.symptoms,
            department: formData.department,
            isUrgentRequest: formData.isUrgentRequest,
            maritalStatus: 'Single',
            guardianName: 'N/A', // Default for walk-ins
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
};

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

const PatientDetailModal: React.FC<{ appointment: Appointment, onClose: () => void, onConfirm: (appointmentId: number) => void, onReject: (appointmentId: number) => void }> = ({ appointment, onClose, onConfirm, onReject }) => {
    const { patient } = appointment;
    const age = getAge(patient.dob);

    const handleConfirm = () => {
        onConfirm(appointment.id);
        onClose();
    };

    const handleReject = () => {
        onReject(appointment.id);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-lg">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-brand">Verify Patient Appointment</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl leading-none">&times;</button>
                </div>

                <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg border">
                        <div className="flex items-center mb-2">
                            <User size={20} className="mr-3 text-secondary"/>
                            <p className="text-lg font-bold text-dark">{patient.name}</p>
                        </div>
                        <p className="text-sm text-gray-600">Patient ID: <span className="font-medium">PID{String(patient.id).padStart(6, '0')}</span></p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-start"><Cake size={16} className="text-gray-500 mr-2 mt-0.5 flex-shrink-0" /><p><strong className="font-medium">DOB:</strong> {new Date(patient.dob).toLocaleDateString()} ({age} years)</p></div>
                        <div className="flex items-start"><VenetianMask size={16} className="text-gray-500 mr-2 mt-0.5 flex-shrink-0" /><p><strong className="font-medium">Gender:</strong> {patient.gender}</p></div>
                        <div className="flex items-start"><Phone size={16} className="text-gray-500 mr-2 mt-0.5 flex-shrink-0" /><p><strong className="font-medium">Mobile:</strong> {patient.mobileNumber}</p></div>
                        <div className="flex items-start"><Heart size={16} className="text-gray-500 mr-2 mt-0.5 flex-shrink-0" /><p><strong className="font-medium">Department:</strong> {patient.department}</p></div>
                    </div>

                    <div>
                        <h4 className="font-semibold text-gray-800 mb-1 flex items-center"><ClipboardList size={16} className="mr-2 text-secondary"/> Reason for Visit</h4>
                        <p className="text-sm text-gray-700 bg-gray-100 p-3 rounded-md whitespace-pre-wrap">{appointment.reason}</p>
                    </div>
                    
                    {patient.isUrgentRequest && (
                        <div className="flex items-center p-3 bg-red-50 text-red-700 rounded-lg border border-red-200">
                            <AlertTriangle size={20} className="mr-3" />
                            <p className="font-semibold">This is an urgent request.</p>
                        </div>
                    )}

                </div>

                <div className="mt-6 flex justify-end space-x-3">
                    <Button variant="danger" onClick={handleReject}>Reject</Button>
                    <Button variant="primary" onClick={handleConfirm} className="bg-success hover:bg-success/90">Allocate Slot</Button>
                </div>
            </Card>
        </div>
    );
};


const ReceptionistView: React.FC<ReceptionistViewProps> = ({ user, appointments, requestAppointment, allocateSlot, rejectAppointment, checkInPatient, onBack }) => {
    const [showWalkinModal, setShowWalkinModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchedPatient, setSearchedPatient] = useState<Appointment | null>(null);
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [viewingPatient, setViewingPatient] = useState<Patient | null>(null);
    const [activeTab, setActiveTab] = useState<'expected' | 'checkedin'>('expected');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const found = appointments.find(a =>
            (String(a.patientId) === searchTerm || `PID${a.patientId}`.toLowerCase() === searchTerm.toLowerCase() || a.patient.mobileNumber === searchTerm) && a.status === 'Slot Allocated'
        );
        if (found) {
            setSearchedPatient(found);
        } else {
            alert('No patient with an allocated slot found for this Patient ID or Mobile Number. They may have already checked in or not have a confirmed slot.');
            setSearchedPatient(null);
        }
    }

    const handleCheckIn = (patientId: number) => {
        checkInPatient(patientId);
        alert(`Patient PID${String(patientId).padStart(6,'0')} checked in and sent to the intern's triage queue.`);
        setSearchedPatient(null);
        setSearchTerm('');
    }
    
    const handleSendAlert = (patient: Patient) => {
        alert(`Reminder alert sent to ${patient.name} at ${patient.mobileNumber}.`);
    };

    const pendingConfirmation = appointments.filter(a => a.status === 'Pending Confirmation');
    const expectedArrivals = appointments.filter(a => a.status === 'Slot Allocated');
    const checkedInToday = appointments.filter(a => a.status === 'Scheduled');
    const rejectedToday = appointments.filter(a => a.status === 'Cancelled');
    
    return (
        <div>
            <style>{`.input { padding: 0.5rem 0.75rem; border: 1px solid #D1D5DB; border-radius: 0.375rem; box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05); outline: none; transition: all 0.2s; } .input:focus { border-color: #00796B; box-shadow: 0 0 0 2px rgba(0, 121, 107, 0.5); }`}</style>
            {showWalkinModal && <WalkinRegistrationModal onClose={() => setShowWalkinModal(false)} onSubmit={requestAppointment} />}
            {viewingPatient && <PatientProfileView patient={viewingPatient} appointments={appointments} onClose={() => setViewingPatient(null)} />}
            {selectedAppointment && (
                <PatientDetailModal 
                    appointment={selectedAppointment}
                    onClose={() => setSelectedAppointment(null)}
                    onConfirm={allocateSlot}
                    onReject={rejectAppointment}
                />
            )}
            
            <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                <Button onClick={onBack} variant="secondary" className="!px-3 !py-1 text-sm">
                    <ArrowLeft size={16} className="mr-2" />
                    Back to Dashboard
                </Button>
                <h2 className="text-3xl font-bold text-dark">Receptionist Dashboard ({user.name})</h2>
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
                            <div key={appt.id} className="p-3 bg-gray-50 rounded-lg border flex flex-wrap justify-between items-center gap-2">
                                <div>
                                    <p className="font-semibold text-gray-800">{appt.patient.name}</p>
                                    <p className="text-sm text-gray-600">Department: {appt.patient.department}</p>
                                    <p className="text-xs text-gray-500 mt-1">Symptoms: {appt.reason}</p>
                                </div>
                                <div className="flex-shrink-0">
                                    <Button onClick={() => setSelectedAppointment(appt)} className="!py-1 !px-2 !text-xs">
                                        <Eye size={14} className="mr-1"/>
                                        View Details
                                    </Button>
                                </div>
                            </div>
                        ))}
                        {pendingConfirmation.length === 0 && <p className="text-gray-500 text-center py-4">No appointments to verify.</p>}
                    </div>
                </Card>

                {/* PATIENT CHECK IN */}
                <Card title="Patient Check-in (Final Confirmation)">
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
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                             <h4 className="font-bold text-lg text-blue-800">{searchedPatient.patient.name}</h4>
                             <p className="text-sm text-blue-700">PID: {String(searchedPatient.patientId).padStart(6, '0')}</p>
                             <p className="text-sm text-blue-700">Department: {searchedPatient.patient.department}</p>
                             <Button onClick={() => handleCheckIn(searchedPatient.patientId)} className="mt-4 w-full">
                                <CheckCircle size={16} className="mr-2" />
                                 Check In & Send to Intern
                             </Button>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <p>Search for a patient with an allocated slot to check them in.</p>
                        </div>
                    )}
                </Card>

                {/* Today's Appointments */}
                <Card title="Today's Appointments" className="lg:col-span-2">
                     <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                            <button
                                onClick={() => setActiveTab('expected')}
                                className={`${activeTab === 'expected' ? 'border-brand text-brand' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors`}
                            >
                                Expected Arrivals ({expectedArrivals.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('checkedin')}
                                className={`${activeTab === 'checkedin' ? 'border-brand text-brand' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors`}
                            >
                                Checked-In ({checkedInToday.length})
                            </button>
                        </nav>
                    </div>
                    <div className="pt-4 space-y-3 max-h-96 overflow-y-auto pr-2">
                        {activeTab === 'expected' && (
                            <>
                                {expectedArrivals.map(appt => (
                                    <div key={appt.id} className="p-3 bg-yellow-50 rounded-lg border border-yellow-200 flex flex-wrap justify-between items-center gap-2">
                                        <div>
                                            <p className="font-semibold text-gray-800">{appt.patient.name}</p>
                                            <p className="text-sm text-gray-600">Department: {appt.patient.department}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button onClick={() => handleSendAlert(appt.patient)} className="!py-1 !px-2 !text-xs" variant="secondary"><Bell size={14} className="mr-1"/> Send Alert</Button>
                                            <Button onClick={() => setViewingPatient(appt.patient)} className="!py-1 !px-2 !text-xs"><Eye size={14} className="mr-1"/> Profile</Button>
                                        </div>
                                    </div>
                                ))}
                                {expectedArrivals.length === 0 && <p className="text-gray-500 text-center py-4">No patients are expected for check-in yet.</p>}
                           </>
                        )}
                         {activeTab === 'checkedin' && (
                            <>
                                {checkedInToday.map(appt => (
                                    <div key={appt.id} className="p-3 bg-green-50 rounded-lg border border-green-200 flex flex-wrap justify-between items-center gap-2">
                                        <div>
                                            <p className="font-semibold text-gray-800">{appt.patient.name}</p>
                                            <p className="text-sm text-gray-600">Time: {new Date(appt.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} | Dept: {appt.doctor}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button onClick={() => setViewingPatient(appt.patient)} className="!py-1 !px-2 !text-xs" variant="secondary"><Eye size={14} className="mr-1"/> Profile</Button>
                                        </div>
                                    </div>
                                ))}
                                {checkedInToday.length === 0 && <p className="text-gray-500 text-center py-4">No patients have been checked in yet today.</p>}
                           </>
                        )}
                    </div>
                </Card>

                {/* Rejected Appointments */}
                <Card title={`Today's Cancelled/Rejected Appointments (${rejectedToday.length})`}>
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                        {rejectedToday.map(appt => (
                            <div key={appt.id} className="p-3 bg-red-50 rounded-lg border border-red-200 flex justify-between items-center">
                                <div>
                                    <p className="font-semibold text-gray-800">{appt.patient.name}</p>
                                    <p className="text-sm text-gray-600">Department: {appt.patient.department}</p>
                                </div>
                                <span className="text-xs font-medium text-red-800">Cancelled</span>
                            </div>
                        ))}
                        {rejectedToday.length === 0 && <p className="text-gray-500 text-center py-4">No appointments cancelled or rejected yet today.</p>}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default ReceptionistView;