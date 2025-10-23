import React, { useState } from 'react';
import { UserRole, ProfessionalUser } from '../types';
import { professionalUsers } from '../data/users';
import Button from './common/Button';
import Card from './common/Card';
import { ArrowLeft, LogIn } from 'lucide-react';

interface ProfessionalLoginProps {
    role: UserRole;
    onLoginSuccess: (user: ProfessionalUser) => void;
    onBack: () => void;
}

const roleDetails = {
    [UserRole.Doctor]: { title: 'Doctor Login', idPrefix: 'DID' },
    [UserRole.Intern]: { title: 'Intern Login', idPrefix: 'IID' },
    [UserRole.Receptionist]: { title: 'Receptionist Login', idPrefix: 'RID' },
    [UserRole.Admin]: { title: 'Admin Login', idPrefix: 'AID' },
    [UserRole.Patient]: { title: 'Patient Login', idPrefix: 'PID' }, // Should not be used here
};

const ProfessionalLogin: React.FC<ProfessionalLoginProps> = ({ role, onLoginSuccess, onBack }) => {
    const [id, setId] = useState('');
    const [password, setPassword] = useState('');
    const { title, idPrefix } = roleDetails[role];

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        const user = professionalUsers.find(u => u.role === role && u.id.toLowerCase() === id.toLowerCase() && u.password === password);
        
        if (user) {
            onLoginSuccess(user);
        } else {
            alert('Invalid credentials. Please try again.');
        }
    };

    return (
        <div>
             <style>{`.input { padding: 0.5rem 0.75rem; border: 1px solid #D1D5DB; border-radius: 0.375rem; box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05); outline: none; transition: all 0.2s; } .input:focus { border-color: #00796B; box-shadow: 0 0 0 2px rgba(0, 121, 107, 0.5); }`}</style>
            <Button onClick={onBack} variant="secondary" className="mb-6 !px-3 !py-1 text-sm">
                <ArrowLeft size={16} className="mr-2" />
                Back to Dashboard
            </Button>
            <div className="max-w-md mx-auto">
                <Card title={title}>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label htmlFor="id" className="block text-sm font-medium text-gray-700">Staff ID</label>
                            <input
                                type="text"
                                id="id"
                                value={id}
                                onChange={(e) => setId(e.target.value)}
                                className="mt-1 block w-full input"
                                placeholder={`e.g., ${idPrefix}000000`}
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="mt-1 block w-full input"
                                required
                            />
                        </div>
                         <div className="text-right pt-2">
                            <Button type="submit">
                                <LogIn size={16} className="mr-2"/>
                                Login
                            </Button>
                        </div>
                    </form>
                </Card>
                <div className="text-center text-xs text-gray-500 mt-4 p-2 bg-gray-50 rounded">
                    <p>For demo purposes, you can log in with:</p>
                    {professionalUsers.filter(u => u.role === role).map(u => (
                         <div key={u.id} className="mt-1">
                             <p>ID: <code className="font-mono bg-gray-200 px-1 rounded">{u.id}</code></p>
                             <p>Password: <code className="font-mono bg-gray-200 px-1 rounded">{u.password}</code></p>
                         </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ProfessionalLogin;