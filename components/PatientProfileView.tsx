

import React from 'react';
import { Patient, Appointment, UserRole, AuditEntry } from '../types';
import Card from './common/Card';
// FIX: Imported the missing 'UserPlus' icon from lucide-react.
import { User, Cake, VenetianMask, Phone, Mail, Heart, X, Thermometer, Gauge, HeartPulse, KeyRound, ArrowRightCircle, Stethoscope, UserCheck, Clipboard, FileText, UserPlus } from 'lucide-react';

interface PatientProfileViewProps {
  patient: Patient;
  appointments: Appointment[];
  onClose: () => void;
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

const getStatusBadge = (status: Appointment['status']) => {
    switch (status) {
        case 'Scheduled': return 'bg-blue-100 text-blue-800';
        case 'Completed': return 'bg-green-100 text-green-800';
        case 'Pending Confirmation': return 'bg-yellow-100 text-yellow-800';
        case 'Slot Allocated': return 'bg-purple-100 text-purple-800';
        case 'Cancelled': return 'bg-gray-100 text-gray-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};

const ClassificationBadge: React.FC<{ classification: 'Stable' | 'Moderate' | 'Critical' }> = ({ classification }) => {
    const colorMap = {
        'Stable': 'bg-green-100 text-green-800',
        'Moderate': 'bg-yellow-100 text-yellow-800',
        'Critical': 'bg-red-100 text-red-800'
    };
    return <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colorMap[classification]}`}>{classification}</span>
};

const TimelineIcon: React.FC<{action: string}> = ({ action }) => {
    const iconMap: Record<string, React.ElementType> = {
        'Patient Registered': UserPlus,
        'Appointment Requested': Clipboard,
        'Appointment Slot Allocated': UserCheck,
        'Patient Checked In (Offline)': UserCheck,
        'Vitals Recorded': Stethoscope,
        'Chief Complaint Noted': FileText,
        'Assigned to Department': ArrowRightCircle,
        "Doctor's Notes Added": FileText,
        'Password Changed': KeyRound,
        'Appointment Rejected': X,
    };
    const Icon = iconMap[action] || Clipboard;
    return <Icon className="h-5 w-5 text-white" />;
};

const PatientProfileView: React.FC<PatientProfileViewProps> = ({ patient, appointments, onClose }) => {
    const patientAppointments = appointments.filter(a => a.patientId === patient.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const age = getAge(patient.dob);

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fade-in">
            <style>{`.animate-fade-in { animation: fadeIn 0.3s ease-out; } @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
            <Card className="w-full max-w-6xl max-h-[95vh] flex flex-col">
                <div className="flex justify-between items-center pb-3 border-b mb-4">
                    <div className="flex items-center">
                        <div className="bg-brand text-white rounded-full h-10 w-10 flex items-center justify-center mr-3">
                           <User size={22} />
                        </div>
                        <div>
                             <h2 className="text-2xl font-bold text-brand">{patient.name}</h2>
                             <p className="text-sm text-gray-500">Patient ID: PID{String(patient.id).padStart(6, '0')}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-grow overflow-y-auto pr-2 space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                        {/* Left Column for Timeline */}
                        <div className="lg:col-span-2">
                            <Card title="Patient Journey Timeline">
                                <ol className="relative border-l border-gray-200">
                                    {patient.auditLog.map((log, index) => (
                                        <li key={index} className="mb-6 ml-6">
                                            <span className="absolute flex items-center justify-center w-8 h-8 bg-brand rounded-full -left-4 ring-4 ring-white">
                                                <TimelineIcon action={log.action} />
                                            </span>
                                            <h3 className="flex items-center mb-1 text-md font-semibold text-gray-900">{log.action}</h3>
                                            <time className="block mb-2 text-xs font-normal leading-none text-gray-500">{new Date(log.timestamp).toLocaleString()}</time>
                                            <p className="text-sm font-normal text-gray-600">
                                                By: <span className="font-medium">{log.user.name}</span> ({log.user.role})
                                            </p>
                                        </li>
                                    ))}
                                </ol>
                            </Card>
                        </div>

                        {/* Right Column for Details */}
                        <div className="lg:col-span-3 space-y-6">
                            {/* Demographics & Medical Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card title="Patient Information">
                                    <div className="space-y-3 text-sm text-gray-800">
                                        <div className="flex"><Cake size={16} className="text-secondary mr-3 mt-0.5 flex-shrink-0"/><p><strong>DOB:</strong> {new Date(patient.dob).toLocaleDateString()} ({age} years)</p></div>
                                        <div className="flex"><VenetianMask size={16} className="text-secondary mr-3 mt-0.5 flex-shrink-0"/><p><strong>Gender:</strong> {patient.gender}</p></div>
                                        <div className="flex"><Phone size={16} className="text-secondary mr-3 mt-0.5 flex-shrink-0"/><p><strong>Mobile:</strong> {patient.mobileNumber}</p></div>
                                        {patient.email && <div className="flex"><Mail size={16} className="text-secondary mr-3 mt-0.5 flex-shrink-0"/><p><strong>Email:</strong> {patient.email}</p></div>}
                                        <div className="flex"><Heart size={16} className="text-secondary mr-3 mt-0.5 flex-shrink-0"/><p><strong>Marital:</strong> {patient.maritalStatus}</p></div>
                                    </div>
                                </Card>
                                <Card title="Latest Medical Summary">
                                    {patient.vitals || patient.triageSuggestion ? (
                                        <div className="space-y-4">
                                            {patient.vitals && (
                                                <div>
                                                    <h4 className="font-semibold text-gray-700 mb-2">Vitals</h4>
                                                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
                                                        <div className="flex items-center"><Gauge size={14} className="mr-2 text-brand" /> BP: {patient.vitals.bloodPressure}</div>
                                                        <div className="flex items-center"><HeartPulse size={14} className="mr-2 text-brand" /> HR: {patient.vitals.heartRate} bpm</div>
                                                        <div className="flex items-center"><Thermometer size={14} className="mr-2 text-brand" /> Temp: {patient.vitals.temperature}°C</div>
                                                        <div className="flex items-center"><span className="font-bold mr-2 ml-px text-brand">O₂</span> SpO2: {patient.vitals.spo2}%</div>
                                                    </div>
                                                </div>
                                            )}
                                            {patient.chiefComplaintByIntern && (
                                                <div>
                                                    <h4 className="font-semibold text-gray-700 mb-2">Intern's Assessment</h4>
                                                    <p className="text-sm text-gray-800 bg-gray-50 p-2 border rounded">{patient.chiefComplaintByIntern}</p>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 text-center py-4">No vitals or triage information recorded yet.</p>
                                    )}
                                </Card>
                            </div>

                            {/* Appointment History */}
                            <Card title="Appointment History">
                                {patientAppointments.length > 0 ? (
                                    <div className="space-y-4 max-h-80 overflow-y-auto">
                                        {patientAppointments.map(appt => (
                                            <div key={appt.id} className="p-4 bg-gray-50 rounded-lg border">
                                                <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
                                                    <div>
                                                        <p className="font-bold text-brand">{appt.doctor !== 'To be assigned' ? appt.doctor : appt.patient.department}</p>
                                                        <p className="text-sm text-gray-600">
                                                            {new Date(appt.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                            {' at '}
                                                            {new Date(appt.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                                        </p>
                                                    </div>
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(appt.status)}`}>{appt.status}</span>
                                                </div>
                                                <p className="text-sm text-gray-800"><strong className="font-medium">Reason:</strong> {appt.reason}</p>
                                                {appt.notes && (
                                                    <div className="mt-3 pt-3 border-t">
                                                        <h5 className="font-semibold text-gray-700 text-sm mb-1">Doctor's SOAP Notes</h5>
                                                        <div className="text-xs text-gray-600 bg-white p-2 rounded border whitespace-pre-wrap">{appt.notes}</div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-center py-4">No appointment history found.</p>
                                )}
                            </Card>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default PatientProfileView;