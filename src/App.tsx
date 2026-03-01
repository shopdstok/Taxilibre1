import React from 'react';
import { useAuth } from './contexts/AuthContext';
import AuthView from './views/AuthView';
import PassengerView from './views/PassengerView';
import DriverView from './views/DriverView';
import AdminView from './views/AdminView';

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthView />;
  }

  switch (user.role) {
    case 'ADMIN':
      return <AdminView />;
    case 'DRIVER':
      return <DriverView />;
    case 'PASSENGER':
    default:
      return <PassengerView />;
  }
}
