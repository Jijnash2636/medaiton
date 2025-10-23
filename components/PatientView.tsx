import React, { useState, useMemo } from 'react';
import { Patient, Appointment } from '../types';
import Button from './common/Button';
import Card from './common/Card';
import AppointmentBookingScreen from './AppointmentBookingScreen';
import { ArrowLeft, UserPlus, LogIn, LogOut, ShieldCheck, PlusCircle, User, Cake, VenetianMask, Phone, Mail, Heart } from 'lucide-react';

interface PatientViewProps {
  requestAppointment: (patient: Omit<Patient, 'id' | 'registrationDate' | 'status'>) => void;
  appointments: Appointment[];
  onBack: () => void;
}

const PatientView: React.FC<PatientViewProps> = ({ requestAppointment, appointments, onBack }) => {
  const [view, setView] = useState<'AUTH' | 'SIGNUP' | 'LOGIN' | 'LOGGED_IN'>('AUTH');
  const [loggedInView, setLoggedInView] = useState<'DASHBOARD' | 'BOOKING'>('DASHBOARD');
  const [patient, setPatient] = useState<Patient | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [registeredUsers, setRegisteredUsers] = useState<Patient[]>([]);
  
  // Login State
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [identifierType, setIdentifierType] = useState<'PID' | 'Mobile'>('PID');

  // Signup State
  const [signupData, setSignupData] = useState({
    name: '',
    dob: '',
    gender: '' as Patient['gender'] | '',
    mobileNumber: '',
    email: '',
    password: '',
    confirmPassword: '',
    isPregnant: false,
    maritalStatus: 'Single' as Patient['maritalStatus'],
    spouseName: '',
    guardianName: '',
  });
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);

  const handleSignupChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setSignupData(prev => {
      let finalValue: string | boolean = type === 'checkbox' ? checked : value;
      
      if (name === 'mobileNumber') {
          const numericValue = value.replace(/[^0-9]/g, '');
          finalValue = numericValue.slice(0, 10);
      }

      const updatedData = { ...prev, [name]: finalValue };
      
      if (name === 'gender' && value !== 'Female') {
        updatedData.isPregnant = false;
      }
      
      return updatedData;
    });
  };
  
  const handleSendOtp = () => {
      if (!signupData.mobileNumber || !/^\d{10}$/.test(signupData.mobileNumber)) {
          alert('Please enter a valid 10-digit mobile number.');
          return;
      }
      setOtpSent(true);
      // In a real app, an API call would be made here.
      alert('An OTP has been sent to your mobile number. (For demo, use 123456)');
  };

  const handleVerifyOtp = () => {
      if (otpInput === '123456') { // Mock OTP check
          setOtpVerified(true);
          alert('Mobile number verified successfully!');
      } else {
          alert('Invalid OTP. Please try again.');
      }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    let foundPatient: Patient | undefined;

    if (identifierType === 'PID') {
        const pidToFind = parseInt(loginIdentifier.replace(/pid/i, ''));
        if (isNaN(pidToFind)) {
            alert('Invalid Patient ID format. Please use PID###### or just the number.');
            return;
        }
        foundPatient = registeredUsers.find(p => p.id === pidToFind);
    } else {
        foundPatient = registeredUsers.find(p => p.mobileNumber === loginIdentifier);
    }
    
    if (foundPatient && foundPatient.password === password) {
        setPatient(foundPatient);
        setView('LOGGED_IN');
        setLoggedInView('DASHBOARD');
        setLoginIdentifier('');
        setPassword('');
    } else {
        alert('Invalid credentials. Please check your details or sign up.');
    }
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupData.name || !signupData.dob || !signupData.gender || !signupData.mobileNumber || !signupData.password || (signupData.maritalStatus === 'Single' && !signupData.guardianName) || (signupData.maritalStatus === 'Married' && !signupData.spouseName)) {
      alert('Please fill in all required fields.');
      return;
    }
    if(signupData.password !== signupData.confirmPassword) {
        alert('Passwords do not match.');
        return;
    }
    if(!otpVerified) {
        alert('Please verify your mobile number before proceeding.');
        return;
    }
    const newPatient: Patient = {
      id: Math.floor(100000 + Math.random() * 900000),
      registrationDate: new Date().toISOString(),
      status: 'Awaiting Triage', // Placeholder
      name: signupData.name,
      dob: signupData.dob,
      gender: signupData.gender as Patient['gender'],
      mobileNumber: signupData.mobileNumber,
      email: signupData.email,
      password: signupData.password,
      isPregnant: signupData.isPregnant,
      maritalStatus: signupData.maritalStatus,
      spouseName: signupData.spouseName,
      guardianName: signupData.guardianName,
      symptoms: '', // To be filled in next step
      isUrgentRequest: false,
    };
    setRegisteredUsers(prev => [...prev, newPatient]);
    setPatient(newPatient);
    setLoggedInView('DASHBOARD');
    setView('LOGGED_IN');
    alert(`Registration successful! Your Patient ID is PID${String(newPatient.id).padStart(6, '0')}. Please save it for future logins.`);
  };

  const handleAppointmentSubmit = (data: { symptoms: string; isUrgentRequest: boolean; department: string; appointmentDate: string }) => {
    if (!patient) return;
    const finalPatientData: Omit<Patient, 'id' | 'registrationDate' | 'status'> = {
        name: patient.name,
        dob: patient.dob,
        gender: patient.gender,
        mobileNumber: patient.mobileNumber,
        email: patient.email,
        password: patient.password,
        isPregnant: patient.isPregnant,
        maritalStatus: patient.maritalStatus,
        spouseName: patient.spouseName,
        guardianName: patient.guardianName,
        symptoms: data.symptoms,
        department: data.department,
        isUrgentRequest: data.isUrgentRequest,
    };
    requestAppointment(finalPatientData);
    setSubmitted(true);
    setLoggedInView('DASHBOARD');
  };
  
  const patientAppointments = useMemo(() => {
    if (!patient) return [];
    return appointments.filter(a => a.patient.name === patient.name && a.patient.dob === patient.dob);
  }, [appointments, patient]);

  const renderContent = () => {
    switch (view) {
      case 'AUTH':
        return (
          <Card title="Patient Portal Access">
            <div className="flex flex-col sm:flex-row gap-4 justify-center p-8">
              <Button onClick={() => setView('LOGIN')} className="flex-1 !py-3">
                <LogIn size={20} className="mr-2" /> Login
              </Button>
              <Button onClick={() => setView('SIGNUP')} variant="secondary" className="flex-1 !py-3">
                <UserPlus size={20} className="mr-2" /> Sign Up / Register
              </Button>
            </div>
            {registeredUsers.length > 0 && (
                 <div className="text-center text-xs text-gray-500 -mt-4 mb-4 p-2 bg-gray-50 rounded">
                    <p>For demo purposes, you can log in with:</p>
                    <div className="flex flex-wrap gap-2 justify-center mt-1">
                        {registeredUsers.map(u => <code key={u.id} className="font-mono bg-gray-200 px-1 rounded">PID{String(u.id).padStart(6, '0')}</code>)}
                    </div>
                     <div className="flex flex-wrap gap-2 justify-center mt-1">
                        {registeredUsers.map(u => <code key={u.id} className="font-mono bg-gray-200 px-1 rounded">{u.mobileNumber}</code>)}
                    </div>
                 </div>
            )}
          </Card>
        );
      case 'LOGIN':
        return (
          <Card title="Patient Login">
            <form onSubmit={handleLogin} className="space-y-4">
               <div>
                  <label htmlFor="identifierType" className="block text-sm font-medium text-gray-700">Login with</label>
                  <select 
                    id="identifierType" 
                    name="identifierType" 
                    value={identifierType} 
                    onChange={(e) => setIdentifierType(e.target.value as 'PID' | 'Mobile')} 
                    className="mt-1 block w-full input"
                  >
                    <option value="PID">Patient ID (PID)</option>
                    <option value="Mobile">Mobile Number</option>
                  </select>
                </div>
              <div>
                <label htmlFor="loginIdentifier" className="block text-sm font-medium text-gray-700">{identifierType === 'PID' ? 'Patient ID' : 'Mobile Number'}</label>
                <input
                  type={identifierType === 'Mobile' ? 'tel' : 'text'}
                  id="loginIdentifier"
                  name="loginIdentifier"
                  value={loginIdentifier}
                  onChange={(e) => {
                    const { value } = e.target;
                    if (identifierType === 'Mobile') {
                      const numericValue = value.replace(/[^0-9]/g, '');
                      setLoginIdentifier(numericValue.slice(0, 10));
                    } else {
                      setLoginIdentifier(value.slice(0, 9));
                    }
                  }}
                  className="mt-1 block w-full input"
                  placeholder={identifierType === 'PID' ? 'e.g., PID123456' : 'e.g., 9876543210'}
                  required
                />
              </div>
               <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                  <input 
                    type="password" 
                    id="password" 
                    name="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    className="mt-1 block w-full input" 
                    required 
                  />
                </div>
                <div className="text-sm">
                    <a href="#" className="font-medium text-secondary hover:text-secondary/80">Forgot Password/PID?</a>
                </div>
              <div className="flex items-center justify-between pt-2">
                <Button type="button" variant="secondary" onClick={() => setView('AUTH')}>Back</Button>
                <Button type="submit">Login</Button>
              </div>
            </form>
          </Card>
        );
      case 'SIGNUP':
        return (
          <Card title="New Patient Registration">
            <form onSubmit={handleSignupSubmit} className="space-y-6">
              {/* Personal Details */}
              <div>
                  <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">1. Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name <span className="text-danger">*</span></label>
                      <input type="text" id="name" name="name" value={signupData.name} onChange={handleSignupChange} className="mt-1 block w-full input" required />
                    </div>
                    <div>
                      <label htmlFor="dob" className="block text-sm font-medium text-gray-700">Date of Birth <span className="text-danger">*</span></label>
                      <input type="date" id="dob" name="dob" value={signupData.dob} onChange={handleSignupChange} className="mt-1 block w-full input" required />
                    </div>
                    <div>
                      <label htmlFor="gender" className="block text-sm font-medium text-gray-700">Gender <span className="text-danger">*</span></label>
                      <select id="gender" name="gender" value={signupData.gender} onChange={handleSignupChange} className="mt-1 block w-full input" required>
                        <option value="" disabled>Select Gender</option>
                        <option>Female</option>
                        <option>Male</option>
                        <option>Other</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="maritalStatus" className="block text-sm font-medium text-gray-700">Marital Status <span className="text-danger">*</span></label>
                      <select id="maritalStatus" name="maritalStatus" value={signupData.maritalStatus} onChange={handleSignupChange} className="mt-1 block w-full input" required>
                        <option>Single</option>
                        <option>Married</option>
                      </select>
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address <span className="text-xs text-gray-500">(Optional)</span></label>
                        <input type="email" id="email" name="email" value={signupData.email} onChange={handleSignupChange} className="mt-1 block w-full input" />
                    </div>
                    {signupData.gender === 'Female' && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Are you pregnant?</label>
                        <div className="mt-2 flex rounded-md shadow-sm">
                             <button
                                type="button"
                                onClick={() => setSignupData(p => ({...p, isPregnant: true}))}
                                className={`relative inline-flex items-center justify-center w-1/2 px-4 py-2 rounded-l-md border text-sm font-medium focus:z-10 focus:outline-none focus:ring-1 focus:ring-secondary focus:border-secondary transition-colors duration-200 ${
                                    signupData.isPregnant ? 'bg-secondary text-white border-secondary' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                Yes
                            </button>
                            <button
                                type="button"
                                onClick={() => setSignupData(p => ({...p, isPregnant: false}))}
                                className={`-ml-px relative inline-flex items-center justify-center w-1/2 px-4 py-2 rounded-r-md border text-sm font-medium focus:z-10 focus:outline-none focus:ring-1 focus:ring-secondary focus:border-secondary transition-colors duration-200 ${
                                    !signupData.isPregnant ? 'bg-secondary text-white border-secondary' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                No
                            </button>
                        </div>
                      </div>
                    )}
                    {signupData.maritalStatus === 'Married' ? (
                      <div className="md:col-span-2">
                        <label htmlFor="spouseName" className="block text-sm font-medium text-gray-700">Spouse's Name <span className="text-danger">*</span></label>
                        <input type="text" id="spouseName" name="spouseName" value={signupData.spouseName} onChange={handleSignupChange} className="mt-1 block w-full input" required/>
                      </div>
                    ) : (
                      <div className="md:col-span-2">
                        <label htmlFor="guardianName" className="block text-sm font-medium text-gray-700">Guardian's Name <span className="text-danger">*</span></label>
                        <input type="text" id="guardianName" name="guardianName" value={signupData.guardianName} onChange={handleSignupChange} className="mt-1 block w-full input" required />
                      </div>
                    )}
                </div>
              </div>

              {/* Contact & Security */}
              <div>
                  <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">2. Contact & Security</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="md:col-span-2">
                        <label htmlFor="mobileNumber" className="block text-sm font-medium text-gray-700">Mobile Number for Alerts <span className="text-danger">*</span></label>
                        <div className="mt-1 flex gap-2">
                            <select className="input w-24" disabled><option>+91</option></select>
                            <input type="tel" id="mobileNumber" name="mobileNumber" value={signupData.mobileNumber} onChange={handleSignupChange} className="flex-1 block w-full input" placeholder="10-digit number" required disabled={otpVerified} />
                            {!otpSent && <Button type="button" onClick={handleSendOtp} className="!py-0 !px-3">Send OTP</Button>}
                            {otpVerified && <div className="flex items-center text-success"><ShieldCheck size={16} className="mr-1"/> Verified</div>}
                        </div>
                     </div>
                     {otpSent && !otpVerified && (
                        <div className="md:col-span-2">
                            <label htmlFor="otpInput" className="block text-sm font-medium text-gray-700">Enter OTP <span className="text-danger">*</span></label>
                             <div className="mt-1 flex gap-2">
                                <input type="text" id="otpInput" value={otpInput} onChange={(e) => setOtpInput(e.target.value)} className="block w-full input" maxLength={6} />
                                <Button type="button" onClick={handleVerifyOtp}>Verify OTP</Button>
                            </div>
                        </div>
                     )}
                    <div>
                        <label htmlFor="password-signup" className="block text-sm font-medium text-gray-700">Create Password <span className="text-danger">*</span></label>
                        <input type="password" id="password-signup" name="password" value={signupData.password} onChange={handleSignupChange} className="mt-1 block w-full input" required />
                    </div>
                     <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm Password <span className="text-danger">*</span></label>
                        <input type="password" id="confirmPassword" name="confirmPassword" value={signupData.confirmPassword} onChange={handleSignupChange} className="mt-1 block w-full input" required />
                    </div>
                  </div>
              </div>

              <div className="flex justify-between items-center pt-4">
                <Button type="button" variant="secondary" onClick={() => setView('AUTH')}>Back</Button>
                <Button type="submit" disabled={!otpVerified} title={!otpVerified ? "Please verify your mobile number first" : ""}>Register and Proceed</Button>
              </div>
            </form>
          </Card>
        );
      case 'LOGGED_IN':
        if (!patient) return null;
        return (
          <div>
            <div className="mb-8 p-4 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-wrap justify-between items-center gap-4">
                <div>
                    <h2 className="text-xl font-semibold text-brand">Welcome, {patient.name}</h2>
                    <p className="text-gray-600">Patient ID: <strong className="text-dark">PID{String(patient.id).padStart(6, '0')}</strong></p>
                </div>
                 <Button onClick={() => { setPatient(null); setView('AUTH'); setLoggedInView('DASHBOARD'); }} variant="danger" className="!py-1.5 !px-3 text-xs">
                    <LogOut size={14} className="mr-1.5" />
                    Logout
                </Button>
            </div>
            
            {submitted && loggedInView === 'DASHBOARD' && (
                <Card className="mb-6 bg-green-50 border-green-200">
                  <div className="text-center p-4">
                    <h3 className="text-xl font-semibold text-green-700">Request Sent Successfully!</h3>
                    <p className="text-green-600 mt-2">A nurse will review your request shortly. You will be contacted for the next steps.</p>
                    <Button onClick={() => setSubmitted(false)} className="mt-6">Acknowledge</Button>
                  </div>
                </Card>
            )}

            {loggedInView === 'DASHBOARD' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1">
                        <Card title="My Profile">
                            <div className="space-y-4 text-sm text-gray-800">
                                <div className="flex items-start">
                                    <Cake size={16} className="text-secondary mr-3 mt-1 flex-shrink-0"/>
                                    <div>
                                        <p className="text-xs text-gray-500">Date of Birth</p>
                                        <p className="font-medium">{new Date(patient.dob).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <VenetianMask size={16} className="text-secondary mr-3 mt-1 flex-shrink-0"/>
                                    <div>
                                        <p className="text-xs text-gray-500">Gender</p>
                                        <p className="font-medium">{patient.gender}</p>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <Phone size={16} className="text-secondary mr-3 mt-1 flex-shrink-0"/>
                                    <div>
                                        <p className="text-xs text-gray-500">Mobile Number</p>
                                        <p className="font-medium">{patient.mobileNumber}</p>
                                    </div>
                                </div>
                                {patient.email &&
                                <div className="flex items-start">
                                    <Mail size={16} className="text-secondary mr-3 mt-1 flex-shrink-0"/>
                                    <div>
                                        <p className="text-xs text-gray-500">Email Address</p>
                                        <p className="font-medium">{patient.email}</p>
                                    </div>
                                </div>}
                                <div className="flex items-start">
                                    <Heart size={16} className="text-secondary mr-3 mt-1 flex-shrink-0"/>
                                    <div>
                                        <p className="text-xs text-gray-500">Marital Status</p>
                                        <p className="font-medium">{patient.maritalStatus}</p>
                                    </div>
                                </div>
                                 {(patient.guardianName || patient.spouseName) &&
                                <div className="flex items-start">
                                    <User size={16} className="text-secondary mr-3 mt-1 flex-shrink-0"/>
                                    <div>
                                        <p className="text-xs text-gray-500">{patient.maritalStatus === 'Married' ? "Spouse's Name" : "Guardian's Name"}</p>
                                        <p className="font-medium">{patient.maritalStatus === 'Married' ? patient.spouseName : patient.guardianName}</p>
                                    </div>
                                </div>}
                            </div>
                        </Card>
                    </div>
                    <div className="lg:col-span-2">
                        <Card title="My Appointments">
                            <div className="flex justify-end mb-4">
                                <Button onClick={() => setLoggedInView('BOOKING')} variant="secondary">
                                    <PlusCircle size={18} className="mr-2"/>
                                    Book New Appointment
                                </Button>
                            </div>
                            {patientAppointments.length === 0 ? (<p className="text-gray-500 text-center py-4">You have no upcoming or past appointments.</p>) : (
                                <ul className="space-y-4">
                                    {patientAppointments.map(appt => (
                                        <li key={appt.id} className="p-4 bg-gray-50 rounded-lg border flex justify-between items-center">
                                            <div>
                                                <p className="font-semibold text-brand">{appt.doctor}</p>
                                                <p className="text-sm text-gray-600">{new Date(appt.date).toLocaleString()}</p>
                                                <p className="text-sm text-gray-500 mt-1">Reason: {appt.reason}</p>
                                            </div>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${appt.status === 'Scheduled' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>{appt.status}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </Card>
                    </div>
                </div>
            ) : (
                <AppointmentBookingScreen 
                    onBack={() => { setLoggedInView('DASHBOARD'); setSubmitted(false); }} 
                    onSubmit={handleAppointmentSubmit} 
                />
            )}
          </div>
        );
    }
  };

  return (
    <div>
      <style>{`.input { padding: 0.5rem 0.75rem; border: 1px solid #D1D5DB; border-radius: 0.375rem; box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05); outline: none; transition: all 0.2s; } .input:focus { border-color: #00796B; box-shadow: 0 0 0 2px rgba(0, 121, 107, 0.5); }`}</style>
      <Button onClick={onBack} variant="secondary" className="mb-6 !px-3 !py-1 text-sm">
        <ArrowLeft size={16} className="mr-2" />
        Back to Dashboard
      </Button>
      {renderContent()}
    </div>
  );
};

export default PatientView;