import React from 'react';
import { Link } from 'react-router-dom';

export const ProfilePage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border-2 border-slate-100 p-8 text-center space-y-4">
        <h1 className="text-3xl font-black text-primary-dark">Profil</h1>
        <p className="text-slate-600">Page en construction.</p>
        <Link to="/" className="inline-block text-primary font-bold hover:underline">
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
};
