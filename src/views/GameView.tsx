import React from 'react';
import { GameClient } from '../services/GameClient';
import type { Game, Question } from '../types';
import { useQuestionCategoryLabels } from '../lib/useQuestionCategoryLabels';
import { resolveCategoryLabel } from '../services/questionCategoryLabels';
import { AnswerInput } from '../components/AnswerInput';
import { computeFeedback } from '../lib/feedback';
import { CorrectionCard } from '../components/GameFeedback/CorrectionCard';
import { AnswerFeedbackPop } from '../components/GameFeedback/AnswerFeedbackPop';
import { AnimatedScore } from '../components/GameFeedback/AnimatedScore';

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

const computeRemainingSeconds = (question: Question, startTime: number | undefined): number => {
  if (startTime === undefined) return question.time_limit_seconds;
  const elapsed = Date.now() / 1000 - startTime;
  const remaining = question.time_limit_seconds - elapsed;
  return Math.max(0, Math.ceil(remaining));
};

const useQuestionTimer = (
  question: Question | undefined,
  startTime: number | undefined
): number | null => {
  const [remaining, setRemaining] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (!question) {
      setRemaining(null);
      return;
    }
    setRemaining(computeRemainingSeconds(question, startTime));
    const interval = window.setInterval(() => {
      setRemaining(computeRemainingSeconds(question, startTime));
    }, 250);
    return () => window.clearInterval(interval);
  }, [question, startTime]);

  return remaining;
};

export const GameView: React.FC<GameViewProps> = ({ client, game, currentPlayerId }) => {
  const [questionCountdown, setQuestionCountdown] = React.useState<number | null>(null);
  const [displayedQuestionIndex, setDisplayedQuestionIndex] = React.useState<number>(
    game.current_question_index
  );
  const categoryLabels = useQuestionCategoryLabels();

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
  const myCurrentAnswer =
    game.answers.find(
      (answer) => answer.question_id === currentQuestion?.id && answer.player_id === currentPlayerId
    ) ?? null;
  const hasAnswered = myCurrentAnswer !== null;

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

  const remainingSeconds = useQuestionTimer(
    questionCountdown === null ? currentQuestion : undefined,
    game.start_time_current_question
  );

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
            <AnimatedScore score={player.score} />
          </div>
        );
      })}
    </div>
  );

  const categoryLabel = resolveCategoryLabel(categoryLabels, currentQuestion.category);
  const isTimerActive = questionCountdown === null && remainingSeconds !== null;
  const isTimerLow = isTimerActive && remainingSeconds !== null && remainingSeconds <= 3;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 pt-16">
      <div className="bg-white p-4 shadow-sm">
        <div className="font-bold text-slate-500">
          Question {displayedQuestionIndex + 1} / {game.questions.length}
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4 max-w-lg mx-auto w-full space-y-8">
        <div className="bg-white p-12 rounded-3xl shadow-xl border-2 border-slate-100 w-full text-center space-y-8">
          {questionCountdown !== null ? (
            currentPlayerId && computeFeedback(game, currentPlayerId, displayedQuestionIndex) ? (
              <CorrectionCard
                game={game}
                playerId={currentPlayerId}
                questionIndex={displayedQuestionIndex}
                countdown={questionCountdown}
              />
            ) : (
              <>
                <div className="text-9xl font-black text-primary animate-pulse">
                  {questionCountdown}
                </div>
                <div className="text-2xl font-bold text-slate-600">Préparez-vous...</div>
              </>
            )
          ) : (
            <>
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="uppercase tracking-wider font-semibold text-slate-400">
                  {categoryLabel}
                </span>
                {isTimerActive && (
                  <span
                    className={`tabular-nums font-bold ${isTimerLow ? 'text-red-500' : 'text-slate-400'}`}
                  >
                    {remainingSeconds}s
                  </span>
                )}
              </div>

              <div className="text-6xl font-black text-slate-800">{currentQuestion.statement}</div>

              {myCurrentAnswer ? (
                <div className="space-y-2">
                  <AnswerFeedbackPop
                    key={currentQuestion.id}
                    isCorrect={myCurrentAnswer.is_correct}
                    pointsEarned={myCurrentAnswer.points_earned}
                  />
                  <div className="text-sm font-semibold text-slate-400">
                    En attente des autres joueurs…
                  </div>
                </div>
              ) : (
                <AnswerInput
                  onSubmit={(value) => {
                    if (hasAnswered) return;
                    client.submitAnswer(value);
                  }}
                  disabled={hasAnswered}
                />
              )}
            </>
          )}
        </div>

        {scoreBoard}
      </div>
    </div>
  );
};
