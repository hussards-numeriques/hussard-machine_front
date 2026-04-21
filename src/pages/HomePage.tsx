import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../contexts/useGame';
import { useAuth } from '../contexts/useAuth';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

export const HomePage: React.FC = () => {
  const { client } = useGame();
  const { user, isAuthenticated, client: authClient } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = React.useState('');
  const [code, setCode] = React.useState('');
  const [mode, setMode] = React.useState<'MENU' | 'JOIN'>('MENU');
  const [error, setError] = React.useState('');

  const effectiveName = isAuthenticated && user ? user.username : name;

  const goToGame = (gameId: string, playerName: string) => {
    const token = isAuthenticated ? authClient.getAccessToken() : null;
    navigate(`/game/${gameId}`, { state: { playerName, token } });
  };

  const requireName = (): boolean => {
    if (!effectiveName.trim()) {
      setError("Entre ton pseudo d'abord !");
      return false;
    }
    return true;
  };

  const handleCreate = async () => {
    if (!requireName()) return;
    try {
      const gameId = await client.createLobby();
      goToGame(gameId, effectiveName);
    } catch {
      setError('Erreur lors de la création');
    }
  };

  const handleQuickGame = async () => {
    if (!requireName()) return;
    try {
      const gameId = await client.createQuickGame();
      goToGame(gameId, effectiveName);
    } catch {
      setError('Erreur lors de la création de la partie rapide');
    }
  };

  const handleJoin = () => {
    if (!requireName()) return;
    if (!code.trim()) {
      setError('Entre le code du salon !');
      return;
    }
    goToGame(code, effectiveName);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 space-y-8 max-w-md mx-auto w-full">
      <h1 className="text-5xl font-black text-primary-dark text-center">Calc Rush</h1>

      <div className="w-full space-y-4 bg-white p-8 rounded-3xl shadow-xl border-2 border-slate-100">
        {isAuthenticated && user ? (
          <div className="text-center text-slate-600 font-bold">
            Connecté en tant que <span className="text-primary-dark">{user.username}</span>
          </div>
        ) : (
          <div className="space-y-2">
            <label className="font-bold text-slate-600 ml-2">Ton Pseudo</label>
            <Input
              placeholder="SuperMaths..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        )}

        {mode === 'MENU' ? (
          <div className="flex flex-col gap-4 pt-4">
            <Button size="lg" onClick={handleQuickGame}>
              Partie Rapide
            </Button>
            <br />
            <Button variant="secondary" size="lg" onClick={handleCreate}>
              Créer un salon
            </Button>
            <Button variant="secondary" size="lg" onClick={() => setMode('JOIN')}>
              Rejoindre un salon
            </Button>
          </div>
        ) : (
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="font-bold text-slate-600 ml-2">Code du salon</label>
              <Input
                placeholder="ABCD"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength={4}
              />
            </div>
            <Button size="lg" className="w-full" onClick={handleJoin}>
              C'est parti !
            </Button>
            <Button variant="secondary" className="w-full" onClick={() => setMode('MENU')}>
              Retour
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
