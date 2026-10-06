import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../contexts/useGame';
import { useAuth } from '../contexts/useAuth';
import { useSubscriptionStatus } from '../hooks/useSubscription';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Mascot } from '../components/Mascot';
import { useShinySession } from '../hooks/useShinySession';
import { resolveApiErrorMessage } from '../lib/labels';
import { LEVELS, resolveLevelLabel } from '../lib/grades';
import { Trans, useTranslation } from 'react-i18next';

const DEFAULT_MAX_PLAYERS = 6;

interface MenuChoiceProps extends React.ComponentProps<typeof Button> {
  label: string;
  details: React.ReactNode;
}

const MenuChoice: React.FC<MenuChoiceProps> = ({ label, details, ...props }) => {
  const { t } = useTranslation();
  const [showDetails, setShowDetails] = React.useState(false);
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Button size="lg" className="flex-1" {...props}>
          {label}
        </Button>
        <button
          type="button"
          aria-label={t('home.moreInfo', { label })}
          aria-expanded={showDetails}
          onClick={() => setShowDetails((open) => !open)}
          className="h-8 w-8 shrink-0 rounded-full border-2 border-slate-300 font-serif text-sm font-bold italic text-slate-400 hover:border-slate-400 hover:text-slate-600"
        >
          i
        </button>
      </div>
      {showDetails && <div className="px-2 text-sm font-semibold text-slate-500">{details}</div>}
    </div>
  );
};

export const HomePage: React.FC = () => {
  const { t } = useTranslation();
  const isShiny = useShinySession();
  const { client } = useGame();
  const { user, isAuthenticated, client: authClient } = useAuth();
  const { data: subscriptionStatus, isLoading: isSubscriptionStatusLoading } =
    useSubscriptionStatus();
  const navigate = useNavigate();
  const [name, setName] = React.useState('');
  const [code, setCode] = React.useState('');
  const [mode, setMode] = React.useState<'MENU' | 'JOIN' | 'CREATE'>('MENU');
  const [error, setError] = React.useState('');
  const [createLevel, setCreateLevel] = React.useState<(typeof LEVELS)[number]>('CP');
  const [createMaxPlayers, setCreateMaxPlayers] = React.useState(DEFAULT_MAX_PLAYERS);

  const effectiveName = isAuthenticated && user ? user.username : name;
  const canCreateLobby = isAuthenticated && (subscriptionStatus?.active ?? false);
  const isCreateLockedBehindSubscription = !canCreateLobby && !isSubscriptionStatusLoading;

  const goToGame = (gameId: string, playerName: string) => {
    const token = isAuthenticated ? authClient.getAccessToken() : null;
    navigate(`/game/${gameId}`, { state: { playerName, token } });
  };

  const requireName = (): boolean => {
    if (!effectiveName.trim()) {
      setError(t('home.errors.nameRequired'));
      return false;
    }
    return true;
  };

  const handleCreate = async () => {
    if (!requireName()) return;
    if (createMaxPlayers < 2 || createMaxPlayers > 30 || Number.isNaN(createMaxPlayers)) {
      setError(t('home.errors.seatsRange'));
      return;
    }
    const token = authClient.getAccessToken();
    if (!token) {
      setError(t('home.errors.createFailed'));
      return;
    }
    try {
      const gameId = await client.createLobby({
        level: createLevel,
        maxPlayers: createMaxPlayers,
        token,
      });
      goToGame(gameId, effectiveName);
    } catch (createError) {
      setError(resolveApiErrorMessage(createError, t('home.errors.createFailed'), t));
    }
  };

  const handleQuickGame = () => {
    if (!requireName()) return;
    const token = isAuthenticated ? authClient.getAccessToken() : null;
    navigate('/game', { state: { playerName: effectiveName, token } });
  };

  const handleJoin = () => {
    if (!requireName()) return;
    if (!code.trim()) {
      setError(t('home.errors.codeRequired'));
      return;
    }
    goToGame(code, effectiveName);
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-4 space-y-8 max-w-md mx-auto w-full">
      <h1 className="sr-only">Calc Rush</h1>
      <Mascot pose="joyeux" shiny={isShiny} title="Rushy" className="w-28 h-28 sm:w-36 sm:h-36" />

      <div className="w-full space-y-4 bg-white p-8 rounded-3xl shadow-xl border-2 border-slate-100">
        {isAuthenticated && user ? (
          <div className="text-center text-slate-600 font-bold">
            <Trans
              i18nKey="home.loggedInAs"
              values={{ username: user.username }}
              components={{ name: <span className="text-primary-dark" /> }}
            />
          </div>
        ) : (
          <div className="space-y-2">
            <label className="font-bold text-slate-600 ml-2">{t('home.yourName')}</label>
            <Input
              placeholder={t('home.namePlaceholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        )}

        {mode === 'MENU' && (
          <div className="flex flex-col gap-4 pt-4">
            <MenuChoice
              label={t('home.rankedGame')}
              details={t('home.rankedDetails')}
              onClick={handleQuickGame}
            />
            <div className="flex items-center gap-3 pt-2 text-sm font-bold text-slate-400">
              <span className="h-px flex-1 bg-slate-200" />
              {t('home.friendsOrClass')}
              <span className="h-px flex-1 bg-slate-200" />
            </div>
            <MenuChoice
              variant="secondary"
              label={t('home.joinWithCode')}
              details={t('home.joinDetails')}
              onClick={() => setMode('JOIN')}
            />
            <MenuChoice
              variant="secondary"
              label={t('home.createPrivate')}
              details={
                <>
                  <p>{t('home.createDetails')}</p>
                  <p className="pt-1">
                    <Trans
                      i18nKey="home.includedIn"
                      components={{
                        plus: (
                          <span className="bg-gradient-to-r from-primary to-violet-500 bg-clip-text font-black text-transparent" />
                        ),
                      }}
                    />
                  </p>
                </>
              }
              disabled={isSubscriptionStatusLoading}
              onClick={() =>
                isCreateLockedBehindSubscription ? navigate('/subscription') : setMode('CREATE')
              }
            />
          </div>
        )}

        {mode === 'JOIN' && (
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="font-bold text-slate-600 ml-2">{t('home.inviteCode')}</label>
              <Input
                placeholder="ABCD"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength={4}
              />
            </div>
            <Button size="lg" className="w-full" onClick={handleJoin}>
              {t('home.letsGo')}
            </Button>
            <Button variant="secondary" className="w-full" onClick={() => setMode('MENU')}>
              {t('common.back')}
            </Button>
          </div>
        )}

        {mode === 'CREATE' && (
          <div className="space-y-4 pt-4">
            <h2 className="text-center text-xl font-black text-slate-700">
              {t('home.privateGame')}
            </h2>
            <div className="space-y-2">
              <label className="font-bold text-slate-600 ml-2">{t('home.questionLevel')}</label>
              <select
                className="w-full text-center text-2xl p-4 rounded-xl border-2 border-slate-300 outline-none"
                value={createLevel}
                onChange={(e) => setCreateLevel(e.target.value as (typeof LEVELS)[number])}
              >
                {LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {resolveLevelLabel(level, t, 'long')}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="font-bold text-slate-600 ml-2">{t('home.seats')}</label>
              <Input
                type="number"
                min={2}
                max={30}
                value={createMaxPlayers}
                onChange={(e) => setCreateMaxPlayers(Number(e.target.value))}
              />
            </div>
            <Button size="lg" className="w-full" onClick={handleCreate}>
              {t('home.createGame')}
            </Button>
            <Button variant="secondary" className="w-full" onClick={() => setMode('MENU')}>
              {t('common.back')}
            </Button>
          </div>
        )}

        {error && (
          <div className="p-3 bg-rose-100 text-rose-700 rounded-xl text-center font-bold animate-bounce-short">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};
