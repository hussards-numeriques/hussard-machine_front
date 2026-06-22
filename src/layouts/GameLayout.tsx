import React from 'react';
import { Outlet } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthProvider';
import { GameProvider } from '../contexts/GameProvider';
import { StreakProvider } from '../contexts/StreakProvider';

export const GameLayout: React.FC = () => {
  return (
    <AuthProvider>
      <StreakProvider>
        <GameProvider>
          <div className="min-h-screen bg-slate-50">
            <Outlet />
          </div>
        </GameProvider>
      </StreakProvider>
    </AuthProvider>
  );
};
