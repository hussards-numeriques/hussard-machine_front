import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Footer } from '../components/Footer';
import { Header } from '../components/Header';
import { PushRegistration } from '../components/PushRegistration';
import { AuthProvider } from '../contexts/AuthProvider';
import { GameProvider } from '../contexts/GameProvider';
import { StreakProvider } from '../contexts/StreakProvider';

const FOOTER_PATHS = new Set(['/', '/terms', '/terms-of-sale', '/legal-notice', '/privacy-policy']);

export const AppLayout: React.FC = () => {
  const location = useLocation();

  return (
    <AuthProvider>
      <PushRegistration />
      <StreakProvider>
        <GameProvider>
          <div className="min-h-screen flex flex-col bg-slate-50">
            <Header />
            <main className="flex-1 flex flex-col">
              <Outlet />
            </main>
            {FOOTER_PATHS.has(location.pathname) && <Footer />}
          </div>
        </GameProvider>
      </StreakProvider>
    </AuthProvider>
  );
};
