import React from 'react';
import { GameClient } from '../services/GameClient';
import type { Game } from '../types';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

interface GameViewProps {
  client: GameClient;
  game: Game;
  currentPlayerId: string | null;
}

const shouldUpdateDisplayedQuestionIndex = (
  currentIndex: number,
  displayedIndex: number
): { shouldUpdate: boolean; isQuestionSkipped: boolean } => {
  const expectedNextIndex = displayedIndex + 1;
  const isNextQuestion = currentIndex === expectedNextIndex;
  const isQuestionSkipped = currentIndex > displayedIndex && currentIndex !== expectedNextIndex;

  return {
    shouldUpdate: isNextQuestion || isQuestionSkipped,
    isQuestionSkipped,
  };
};

const logQuestionSkipWarning = (fromIndex: number, toIndex: number) => {
  console.warn(
    `Saut de question détecté: ${fromIndex} -> ${toIndex}. Affichage de la question ${toIndex}`
  );
};

export const GameView: React.FC<GameViewProps> = ({ client, game, currentPlayerId }) => {
  const [answer, setAnswer] = React.useState('');
  const [lastSubmittedId, setLastSubmittedId] = React.useState<string | null>(null);
  const [questionCountdown, setQuestionCountdown] = React.useState<number | null>(null);
  const [displayedQuestionIndex, setDisplayedQuestionIndex] = React.useState<number>(
    game.current_question_index
  );

  React.useEffect(() => {
    const { shouldUpdate, isQuestionSkipped } = shouldUpdateDisplayedQuestionIndex(
      game.current_question_index,
      displayedQuestionIndex
    );

    if (shouldUpdate) {
      if (isQuestionSkipped) {
        logQuestionSkipWarning(displayedQuestionIndex, game.current_question_index);
      }
      setDisplayedQuestionIndex(game.current_question_index);
    }
  }, [game.current_question_index, displayedQuestionIndex]);

  const currentQuestion = game.questions[displayedQuestionIndex];
  const hasAnswered = game.answers.some(
    (answer) => answer.question_id === currentQuestion?.id && answer.player_id === currentPlayerId
  );

  React.useEffect(() => {
    client.setQuestionCountdownCallback((seconds: number) => {
      if (seconds === 0) {
        setQuestionCountdown(null);
      } else {
        setQuestionCountdown(seconds);
      }
    });

    return () => {
      client.setQuestionCountdownCallback(null);
    };
  }, [client]);

  const inputRef = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    if (currentQuestion?.id !== lastSubmittedId) {
      setAnswer('');
      inputRef.current?.focus();
    }
  }, [currentQuestion?.id, lastSubmittedId]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!answer || hasAnswered) return;

    client.submitAnswer(parseInt(answer, 10));
    setLastSubmittedId(currentQuestion.id);
  };

  if (!currentQuestion) return <div>Chargement...</div>;

  const truncateName = (name: string) => (name.length > 20 ? name.substring(0, 20) + '...' : name);

  const sortedPlayers = [...game.players].sort((a, b) => b.score - a.score);

  const scoreBoard = (
    <div className="w-full space-y-2">
      {sortedPlayers.map((player) => {
        const isMe = player.id === currentPlayerId;
        return (
          <div
            key={player.id}
            className={`flex items-center gap-2 text-sm rounded-xl px-2 py-1 ${
              isMe ? 'bg-primary/10 text-primary font-bold' : 'text-slate-500'
            }`}
          >
            <span className="w-32 shrink-0 truncate">{truncateName(player.name)}</span>
            <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${isMe ? 'bg-primary' : 'bg-slate-400'}`}
                style={{ width: `${Math.min((player.score / 1000) * 100, 100)}%` }}
              />
            </div>
            <span className="shrink-0">{player.score} pts</span>
          </div>
        );
      })}
    </div>
  );

  if (questionCountdown !== null) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 pt-16">
        <div className="bg-white p-4 shadow-sm">
          <div className="font-bold text-slate-500">
            Question {displayedQuestionIndex + 1} / {game.questions.length}
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="text-9xl font-black text-primary animate-pulse">{questionCountdown}</div>
          <div className="text-2xl font-bold text-slate-600 mt-8">Préparez-vous...</div>
        </div>

        <div className="p-4 max-w-lg mx-auto w-full">{scoreBoard}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 pt-16">
      <div className="bg-white p-4 shadow-sm">
        <div className="font-bold text-slate-500">
          Question {displayedQuestionIndex + 1} / {game.questions.length}
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4 max-w-lg mx-auto w-full space-y-8">
        <div className="bg-white p-12 rounded-3xl shadow-xl border-2 border-slate-100 w-full text-center space-y-8">
          <div className="text-6xl font-black text-slate-800">{currentQuestion.statement}</div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              ref={inputRef}
              type="number"
              placeholder="?"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              disabled={hasAnswered}
              autoFocus
              className="text-4xl font-bold py-6"
            />
            <Button type="submit" size="lg" className="w-full" disabled={hasAnswered || !answer}>
              {hasAnswered ? 'Réponse envoyée...' : 'Valider'}
            </Button>
          </form>
        </div>

        {scoreBoard}
      </div>
    </div>
  );
};
