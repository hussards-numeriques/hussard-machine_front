import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import { AuthModal } from './AuthModal';

export const Header: React.FC = () => {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
  };

  return (
    <>
      <header className="fixed top-0 right-0 left-0 z-40 flex justify-between items-center p-4 bg-transparent pointer-events-none">
        {location.pathname !== '/' ? (
          <Link
            to="/"
            className="pointer-events-auto text-sm font-bold text-slate-500 hover:text-primary-dark transition-colors"
          >
            ← Accueil
          </Link>
        ) : (
          <div />
        )}

        <div className="pointer-events-auto relative">
          {isLoading ? null : isAuthenticated && user ? (
            <>
              <button
                type="button"
                onClick={() => setShowUserMenu((s) => !s)}
                className="text-sm font-bold text-slate-700 bg-white px-4 py-2 rounded-full shadow border border-slate-200 hover:border-primary-dark transition-colors"
              >
                {user.username}
              </button>
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border-2 border-slate-100 overflow-hidden">
                  <Link
                    to="/profile"
                    onClick={() => setShowUserMenu(false)}
                    className="block px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Mon profil
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 text-sm font-bold text-rose-600 hover:bg-rose-50 border-t border-slate-100"
                  >
                    Se déconnecter
                  </button>
                </div>
              )}
            </>
          ) : (
            <button
              type="button"
              onClick={() => setShowAuthModal(true)}
              className="text-sm font-bold text-slate-600 hover:text-primary-dark transition-colors underline underline-offset-4"
            >
              Se connecter
            </button>
          )}
        </div>
      </header>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </>
  );
};
