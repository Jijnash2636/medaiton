

import React, { useState, useMemo } from 'react';
import Button from './common/Button';
import Card from './common/Card';
import { Calendar, Tag, AlertTriangle, ArrowLeft, Zap } from 'lucide-react';
import { Appointment } from '../types';

interface AppointmentBookingScreenProps {
  onSubmit: (data: { symptoms: string; isUrgentRequest: boolean; department: string; appointmentDateTime: string }) => void;
  onBack: () => void;
  appointments: Appointment[];
}

const departments = ['General Medicine', 'Cardiology', 'Pediatrics', 'Orthopedics', 'Neurology', 'Dermatology'];
const commonSymptoms = [
    'fever', 'cough', 'fatigue', 'shortness of breath', 'chest pain', 'headache',
    'dizziness', 'sore throat', 'nausea', 'vomiting', 'abdominal pain', 'diarrhea',
    'rash', 'confusion', 'weakness', 'back pain', 'palpitations', 'syncope',
    'bleeding', 'loss of appetite', 'anosmia'
];

const morningSlots = ['09:00', '09:15', '09:30', '09:45', '10:00', '10:15', '10:30', '10:45', '11:15', '11:30', '11:45', '12:00', '12:15', '12:30', '12:45'];
const lowAvailabilitySlots = ['14:00', '14:15', '14:30'];
const regularAfternoonSlots = ['14:45', '15:00', '15:15', '15:30', '15:45'];

const AppointmentBookingScreen: React.FC<AppointmentBookingScreenProps> = ({ onSubmit, onBack, appointments }) => {
  const [appointmentData, setAppointmentData] = useState({
    appointmentDate: new Date().toISOString().split('T')[0],
    department: 'General Medicine',
    symptoms: '',
    isUrgentRequest: false,
    appointmentTime: '',
  });

  const bookedSlots = useMemo(() => {
    const slots = new Set<string>();
    const selectedDateString = appointmentData.appointmentDate;

    appointments
        .filter(appt => {
            if (appt.patient.department !== appointmentData.department) return false;
            // Compare YYYY-MM-DD strings to avoid timezone issues
            const apptDateString = new Date(appt.date).toISOString().split('T')[0];
            return apptDateString === selectedDateString;
        })
        .forEach(appt => {
            const apptDate = new Date(appt.date);
            const hours = String(apptDate.getUTCHours()).padStart(2, '0');
            const minutes = String(apptDate.getUTCMinutes()).padStart(2, '0');
            slots.add(`${hours}:${minutes}`);
        });
    return slots;
  }, [appointments, appointmentData.appointmentDate, appointmentData.department]);


  const remainingLowSlots = useMemo(() => 
    lowAvailabilitySlots.filter(time => !bookedSlots.has(time)).length,
    [bookedSlots]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setAppointmentData(prev => ({ 
        ...prev, 
        [name]: type === 'checkbox' ? checked : value,
        // Reset time if date or department changes
        ...(name === 'appointmentDate' || name === 'department' ? { appointmentTime: '' } : {})
    }));
  };

   const handleSymptomClick = (symptom: string) => {
    const symptomToAdd = symptom.charAt(0).toUpperCase() + symptom.slice(1);
    setAppointmentData(prev => {
        const currentSymptoms = prev.symptoms.trim();
        if (currentSymptoms.toLowerCase().split(/, ?/).includes(symptom.toLowerCase())) return prev;
        return { ...prev, symptoms: currentSymptoms ? `${currentSymptoms}, ${symptomToAdd}` : symptomToAdd };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointmentData.symptoms) {
      alert('Please describe your symptoms.');
      return;
    }
    if (!appointmentData.appointmentTime) {
      alert('Please select an available time slot.');
      return;
    }
    const [hours, minutes] = appointmentData.appointmentTime.split(':');
    const appointmentDateTime = new Date(appointmentData.appointmentDate);
    // Use UTC methods to avoid timezone issues when setting time
    appointmentDateTime.setUTCHours(parseInt(hours), parseInt(minutes), 0, 0);

    onSubmit({
        symptoms: appointmentData.symptoms,
        isUrgentRequest: appointmentData.isUrgentRequest,
        department: appointmentData.department,
        appointmentDateTime: appointmentDateTime.toISOString()
    });
  };
  
  const TimeSlotButton: React.FC<{time: string}> = ({ time }) => {
    const isBooked = bookedSlots.has(time);
    const isSelected = appointmentData.appointmentTime === time;

    let buttonContent: React.ReactNode;
    let buttonClasses = '';

    if (isBooked) {
        buttonContent = 'Booked';
        buttonClasses = 'bg-gray-200 text-gray-500 cursor-not-allowed line-through';
    } else if (isSelected) {
        buttonContent = new Date(`1970-01-01T${time}:00Z`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'UTC' });
        buttonClasses = 'bg-brand text-white border-brand ring-2 ring-brand ring-offset-1';
    } else {
        buttonContent = new Date(`1970-01-01T${time}:00Z`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'UTC' });
        buttonClasses = 'bg-white hover:bg-brand/10 hover:border-brand text-brand border-gray-300';
    }
    
    return (
        <button
            key={time}
            type="button"
            disabled={isBooked}
            onClick={() => !isBooked && setAppointmentData(prev => ({ ...prev, appointmentTime: time }))}
            className={`p-2 text-sm rounded-md border text-center transition-colors font-medium ${buttonClasses}`}
        >
            {buttonContent}
        </button>
    );
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

            {/* Time Slot Selector */}
            <div className="p-4 bg-light rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Select an Available Time Slot</h3>
                
                <div className="mb-4">
                    <h4 className="font-semibold text-gray-700 mb-2">Morning</h4>
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                        {morningSlots.slice(0, 8).map(time => <TimeSlotButton key={time} time={time} />)}
                    </div>
                    <div className="col-span-full flex items-center justify-center my-3">
                        <div className="w-full border-t border-dashed border-gray-300"></div>
                        <span className="bg-light px-2 text-xs text-gray-500 whitespace-nowrap">11:00 - 11:15 AM Break</span>
                        <div className="w-full border-t border-dashed border-gray-300"></div>
                    </div>
                     <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                         {morningSlots.slice(8).map(time => <TimeSlotButton key={time} time={time} />)}
                    </div>
                </div>
                
                <div className="col-span-full flex items-center justify-center my-3">
                    <div className="w-full border-t border-solid border-gray-300"></div>
                    <span className="bg-light px-2 text-sm font-medium text-gray-600 whitespace-nowrap">1:00 PM - 2:00 PM Lunch Break</span>
                    <div className="w-full border-t border-solid border-gray-300"></div>
                </div>
                
                <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Afternoon</h4>
                    <div className="p-3 mb-3 rounded-md border border-amber-300 bg-amber-50">
                        <div className="flex justify-between items-center">
                            <h5 className="font-semibold text-amber-800 text-sm flex items-center"><Zap size={14} className="mr-2"/>Limited Availability (2:00 - 2:30 PM)</h5>
                            {remainingLowSlots > 0 && (
                                <span className="text-xs font-bold text-amber-700 bg-amber-200 px-2 py-0.5 rounded-full">{remainingLowSlots} {remainingLowSlots === 1 ? 'SLOT' : 'SLOTS'} LEFT</span>
                            )}
                        </div>
                        <p className="text-xs text-amber-600 mt-1">These time slots are in high demand due to specialist availability.</p>
                        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 mt-3">
                            {lowAvailabilitySlots.map(time => <TimeSlotButton key={time} time={time} />)}
                        </div>
                    </div>

                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                        {regularAfternoonSlots.map(time => <TimeSlotButton key={time} time={time} />)}
                    </div>
                </div>
            </div>
            
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