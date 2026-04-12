import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '../components/Header';
import { AuthProvider } from '../contexts/AuthProvider';
import { GameProvider } from '../contexts/GameProvider';

export const AppLayout: React.FC = () => {
  return (
    <AuthProvider>
      <GameProvider>
        <div className="min-h-screen bg-slate-50">
          <Header />
          <Outlet />
        </div>
      </GameProvider>
    </AuthProvider>
  );
};
