
import React, { useState, useMemo } from 'react';
import { Patient, Appointment, ProfessionalUser } from '../types';
import Card from './common/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Button from './common/Button';
import PatientProfileView from './PatientProfileView';
import { ArrowLeft } from 'lucide-react';

interface AdminViewProps {
  user: ProfessionalUser;
  allPatients: Patient[];
  appointments: Appointment[];
  onBack: () => void;
}

const AdminView: React.FC<AdminViewProps> = ({ user, allPatients, appointments, onBack }) => {
  const [viewingPatient, setViewingPatient] = useState<Patient | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPatients = useMemo(() => 
    allPatients.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      `PID${String(p.id)}`.toLowerCase().includes(searchTerm.toLowerCase())),
    [allPatients, searchTerm]);

  const patientGenderData = [
    { name: 'Male', value: allPatients.filter(p => p.gender === 'Male').length },
    { name: 'Female', value: allPatients.filter(p => p.gender === 'Female').length },
    { name: 'Other', value: allPatients.filter(p => p.gender === 'Other').length },
  ];

  const triageClassificationData = {
    'Stable': allPatients.filter(p => p.triageSuggestion?.classification === 'Stable').length,
    'Moderate': allPatients.filter(p => p.triageSuggestion?.classification === 'Moderate').length,
    'Critical': allPatients.filter(p => p.triageSuggestion?.classification === 'Critical').length,
  };
  
  const triageDataForChart = Object.entries(triageClassificationData).map(([name, value]) => ({name, value}));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
  const TRIAGE_COLORS = { 'Stable': '#38A169', 'Moderate': '#FBC02D', 'Critical': '#E53E3E' };

  return (
    <div>
      <Button onClick={onBack} variant="secondary" className="mb-6 !px-3 !py-1 text-sm">
          <ArrowLeft size={16} className="mr-2" />
          Back to Dashboard
      </Button>
      {viewingPatient && <PatientProfileView patient={viewingPatient} appointments={appointments} onClose={() => setViewingPatient(null)} />}
      <h2 className="text-3xl font-bold text-dark mb-6">Hospital Analytics Dashboard ({user.name})</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card className="text-center">
            <p className="text-4xl font-bold text-brand">{allPatients.length}</p>
            <p className="text-gray-500">Total Registered Patients</p>
        </Card>
        <Card className="text-center">
            <p className="text-4xl font-bold text-brand">{appointments.length}</p>
            <p className="text-gray-500">Total Appointments</p>
        </Card>
        <Card className="text-center">
            <p className="text-4xl font-bold text-brand">{allPatients.filter(p => p.status === 'Awaiting Triage').length}</p>
            <p className="text-gray-500">Patients in Triage Queue</p>
        </Card>
         <Card className="text-center">
            <p className="text-4xl font-bold text-brand">142<span className="text-2xl text-gray-400">/150</span></p>
            <p className="text-gray-500">Bed Occupancy</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card title="Patient Triage Classifications">
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={triageDataForChart}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" name="Number of Patients">
                      {triageDataForChart.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={TRIAGE_COLORS[entry.name]} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </Card>
        <Card title="Patient Demographics (Gender)">
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie data={patientGenderData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
                        {patientGenderData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </Card>
      </div>

      <Card title="Patient Directory">
          <input
            type="text"
            placeholder="Search patients by name or PID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded mb-4"
          />
          <div className="max-h-96 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                      <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">PID</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Current Password</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Previous Password</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                      {filteredPatients.map(p => (
                          <tr key={p.id} className="hover:bg-gray-50">
                              <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{p.name}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">PID{String(p.id)}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{p.status}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 font-mono">{p.password}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 font-mono">{p.previousPassword || 'N/A'}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-right text-sm">
                                  <Button onClick={() => setViewingPatient(p)} className="!text-xs !py-1 !px-2">View Profile</Button>
                              </td>
                          </tr>
                      ))}
                      {filteredPatients.length === 0 && (
                        <tr>
                            <td colSpan={6} className="text-center text-gray-500 py-4">No patients found.</td>
                        </tr>
                      )}
                  </tbody>
              </table>
          </div>
      </Card>
    </div>
  );
};

export default AdminView;
