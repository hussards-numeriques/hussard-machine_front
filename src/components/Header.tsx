import React, { useCallback, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import { useClickOutside } from '../hooks/useClickOutside';
import { usePlayerProfile } from '../hooks/usePlayerProfile';
import { useSubscriptionStatus } from '../hooks/useSubscription';
import { resolveGradeLabel, resolveLevelLabel } from '../lib/grades';
import { AuthModal } from './AuthModal';
import { Mascot } from './Mascot';
import { PlayerAvatar } from './PlayerAvatar';
import { StreakBadge } from './streak/StreakBadge';
import { SubscriptionMenuCard, SupporterCrown } from './SubscriptionStatus';

const MENU_LINKS = [
  { to: '/profile', label: 'Mon profil' },
  { to: '/quests', label: 'Quêtes & Titres' },
  { to: '/icons', label: 'Icônes' },
  { to: '/settings', label: 'Réglages' },
];

const HomeLink: React.FC = () => (
  <Link
    to="/"
    aria-label="Accueil"
    className="pointer-events-auto flex items-center gap-1.5 hover:scale-105 transition-transform"
  >
    <Mascot size={44} pose="joyeux" title="Rushy" className="drop-shadow" />
    <span className="text-sm font-black text-primary-dark hidden sm:inline">Calc Rush</span>
  </Link>
);

const UserMenu: React.FC<{ username: string }> = ({ username }) => {
  const { logout } = useAuth();
  const { data: profile } = usePlayerProfile();
  const isSupporter = useSubscriptionStatus().data?.active === true;
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(containerRef, open, close);

  const handleLogout = async () => {
    await logout();
    close();
  };

  const avatar = (
    <PlayerAvatar
      name={username}
      grade={profile?.grade ?? ''}
      isBot={false}
      iconUrl={profile?.selected_icon_url}
      size="sm"
    />
  );

  return (
    <div ref={containerRef}>
      <button
        type="button"
        aria-label="Menu du joueur"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="relative flex items-center gap-2 rounded-full pr-0 sm:pr-3 hover:bg-slate-100 transition-colors"
      >
        {avatar}
        {isSupporter && (
          <SupporterCrown
            size={22}
            className="absolute -top-3.5 left-4 rotate-[18deg] drop-shadow"
          />
        )}
        <span className="text-sm font-black text-slate-700 hidden sm:inline">{username}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 z-20 bg-white rounded-2xl shadow-xl border-2 border-slate-100 overflow-hidden animate-pop-in origin-top-right">
          <div className="flex items-center gap-3 px-4 pt-4 pb-2">
            {avatar}
            <div className="min-w-0">
              <p className="text-base font-black text-slate-800 truncate">{username}</p>
              {profile && (
                <p className="text-xs font-bold text-slate-400">
                  {resolveLevelLabel(profile.level)} · {resolveGradeLabel(profile.grade)}
                </p>
              )}
            </div>
          </div>
          <SubscriptionMenuCard onNavigate={close} />
          {MENU_LINKS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              onClick={close}
              className="block px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 border-t border-slate-100"
            >
              {label}
            </Link>
          ))}
          <button
            type="button"
            onClick={handleLogout}
            className="w-full text-left px-4 py-3 text-sm font-bold text-rose-600 hover:bg-rose-50 border-t border-slate-100"
          >
            Se déconnecter
          </button>
        </div>
      )}
    </div>
  );
};

export const Header: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const location = useLocation();

  return (
    <>
      <header className="fixed top-0 right-0 left-0 z-40 flex justify-between items-center p-4 bg-transparent pointer-events-none">
        {location.pathname !== '/' ? <HomeLink /> : <div />}

        {isLoading ? null : isAuthenticated && user ? (
          <div className="pointer-events-auto relative flex items-center gap-1 h-11 p-1 rounded-full bg-white/90 backdrop-blur shadow border border-slate-200">
            <StreakBadge />
            <span className="w-px h-6 bg-slate-200" />
            <UserMenu username={user.username} />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowAuthModal(true)}
            className="pointer-events-auto text-sm font-black text-white bg-primary px-4 py-2 rounded-full shadow hover:bg-primary-dark transition-colors"
          >
            Se connecter
          </button>
        )}
      </header>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </>
  );
};
