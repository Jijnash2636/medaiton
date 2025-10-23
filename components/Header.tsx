import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-gradient-to-r from-[#00796B] to-[#004D40] text-white shadow-lg">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          <div className="text-left">
            <h1 className="text-2xl font-bold tracking-tight text-accent">
              SRM TRICHY HOSPITAL
            </h1>
            <p className="text-sm text-gray-200">AI-Powered Supporter System</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;