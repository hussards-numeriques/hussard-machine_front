import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="py-6 text-center text-xs text-slate-400">
      <div className="flex justify-center items-center gap-3">
        <a
          href="https://www.alextraveylan.fr/fr/contact"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-primary transition-colors"
        >
          Contact
        </a>
        <Link to="/terms-of-sale" className="hover:text-primary transition-colors">
          CGV
        </Link>
        <Link to="/legal-notice" className="hover:text-primary transition-colors">
          Mentions légales
        </Link>
        <Link to="/privacy-policy" className="hover:text-primary transition-colors">
          Confidentialité
        </Link>
      </div>
      <div className="mt-2">© {year} Calc Rush. Tous droits réservés.</div>
    </footer>
  );
};
