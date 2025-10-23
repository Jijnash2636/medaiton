import React from 'react';
import { UserRole } from '../types';
import { Stethoscope, User, Briefcase, BarChart2, Users, ConciergeBell } from 'lucide-react';

interface DashboardProps {
  onSelectRole: (role: UserRole) => void;
}

const roleData = [
    { role: UserRole.Patient, title: 'Patient', description: 'Access your portal, book appointments, and view your medical records.', icon: User },
    { role: UserRole.Receptionist, title: 'Receptionist', description: 'Manage patient registrations and check-ins.', icon: ConciergeBell },
    { role: UserRole.Intern, title: 'Intern', description: 'Handle patient triage, record vitals, and assign patients to specialists.', icon: Stethoscope },
    { role: UserRole.Doctor, title: 'Doctor', description: 'Manage your patient queue, access clinical data, and use AI-Copilot.', icon: Briefcase },
    { role: UserRole.Admin, title: 'Admin', description: 'View hospital analytics, manage system data, and oversee operations.', icon: BarChart2 },
    { role: null, title: 'Others', description: 'Access departmental tools for Pharmacy, Labs, and Administration.', icon: Users },
];

const RoleCard: React.FC<{
    title: string;
    description: string;
    icon: React.ElementType;
    onClick: () => void;
    disabled?: boolean;
}> = ({ title, description, icon: Icon, onClick, disabled }) => {
    return (
        <div
            onClick={!disabled ? onClick : undefined}
            className={`
                group bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 ease-in-out transform h-full flex flex-col
                ${disabled
                    ? 'cursor-not-allowed opacity-60'
                    : 'cursor-pointer hover:shadow-2xl hover:-translate-y-2 hover:bg-secondary'
                }
            `}
        >
            <div className="p-8 flex-grow flex flex-col justify-center">
                <div className="flex items-center justify-center h-14 w-14 rounded-full bg-light group-hover:bg-white mx-auto mb-6 transition-colors duration-300">
                    <Icon className="h-6 w-6 text-brand group-hover:text-secondary transition-colors duration-300" />
                </div>
                <h3 className="text-2xl font-bold text-center text-dark group-hover:text-white transition-colors duration-300">{title}</h3>
                <p className="mt-4 text-center text-gray-600 group-hover:text-light transition-colors duration-300">{description}</p>
            </div>
        </div>
    );
};

const Dashboard: React.FC<DashboardProps> = ({ onSelectRole }) => {
  return (
    <div className="text-center py-10">
      <h2 className="text-4xl font-extrabold text-dark mb-4">Welcome to SRM Trichy Hospital Supporter</h2>
      <p className="text-lg text-gray-700 max-w-3xl mx-auto mb-12">An integrated AI-powered platform to streamline hospital operations and enhance patient care.</p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {roleData.map(({ role, title, description, icon }) => (
          <RoleCard
            key={title}
            title={title}
            description={description}
            icon={icon}
            disabled={role === null}
            onClick={() => role && onSelectRole(role)}
          />
        ))}
      </div>
    </div>
  );
};

export default Dashboard;