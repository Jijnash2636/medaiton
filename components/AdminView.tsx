import React from 'react';
import { Patient, Appointment } from '../types';
import Card from './common/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Button from './common/Button';
import { ArrowLeft } from 'lucide-react';

interface AdminViewProps {
  initialPatients: Patient[];
  allPatients: Patient[];
  appointments: Appointment[];
  onBack: () => void;
}

const AdminView: React.FC<AdminViewProps> = ({ initialPatients, allPatients, appointments, onBack }) => {
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
      <h2 className="text-3xl font-bold text-dark mb-6">Hospital Analytics Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card className="text-center">
            <p className="text-4xl font-bold text-brand">{allPatients.length}</p>
            <p className="text-gray-500">Total Patients Today</p>
        </Card>
        <Card className="text-center">
            <p className="text-4xl font-bold text-brand">{appointments.length}</p>
            <p className="text-gray-500">Appointments Scheduled</p>
        </Card>
        <Card className="text-center">
            <p className="text-4xl font-bold text-brand">{initialPatients.filter(p => p.status === 'Awaiting Triage').length}</p>
            <p className="text-gray-500">Patients in Triage Queue</p>
        </Card>
         <Card className="text-center">
            <p className="text-4xl font-bold text-brand">142<span className="text-2xl text-gray-400">/150</span></p>
            <p className="text-gray-500">Bed Occupancy</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
    </div>
  );
};

export default AdminView;