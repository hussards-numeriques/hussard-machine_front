# Feedback de correction & juice en jeu — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Afficher un feedback stimulant en jeu — pop `+points`/`Raté` à la soumission, carte de correction au compte à rebours inter-question, combo de bonnes réponses et barre de score animée.

**Architecture:** Front-only. Toutes les données viennent du `Game` déjà reçu par WebSocket (`Answer.points_earned`, `Answer.is_correct`, `Answer.value`, `Question.answer`). Fonctions pures pour dériver le feedback/combo, composants de présentation, intégration dans `GameView`. Animations en keyframes Tailwind/CSS, aucune nouvelle dépendance.

**Tech Stack:** React 19, TypeScript (strict), Tailwind CSS, Vitest + @testing-library/react.

## Global Constraints

- TypeScript strict — aucun `any`.
- Aucun commentaire dans le code (sauf directives linter). Code auto-documenté.
- Aucune nouvelle dépendance npm.
- Charte : `primary` indigo `#4f46e5`, `secondary` amber `#fbbf24`, vert succès, `red-500` échec, police Nunito.
- Tests : structure claire, données réalistes ; utiliser le helper `cn` (`src/lib/utils.ts`) pour les classes conditionnelles.
- Validation avant chaque commit du hook pre-commit : lint + prettier + tests passent (`./scripts/validate.sh`).

---

### Task 1: Fonctions pures de feedback & combo

**Files:**

- Create: `src/lib/feedback.ts`
- Test: `src/lib/feedback.spec.ts`

**Interfaces:**

- Consumes: `Game` from `src/types.ts`
- Produces:
  - `type FeedbackStatus = 'correct' | 'wrong' | 'timeout'`
  - `interface QuestionFeedback { status: FeedbackStatus; given: number | null; expected: number; pointsEarned: number }`
  - `computeFeedback(game: Game, playerId: string, questionIndex: number): QuestionFeedback | null`
  - `computeCombo(game: Game, playerId: string, uptoIndex: number): number`

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, it, expect } from 'vitest';
import { computeFeedback, computeCombo } from './feedback';
import type { Game } from '../types';

const baseGame = (): Game => ({
  id: 'G1',
  state: 'IN_PROGRESS',
  players: [],
  questions: [
    { id: 'q1', statement: '2 + 2', answer: 4, category: 'addition', time_limit_seconds: 10 },
    { id: 'q2', statement: '3 + 3', answer: 6, category: 'addition', time_limit_seconds: 10 },
    {
      id: 'q3',
      statement: '7 x 8',
      answer: 56,
      category: 'multiplication',
      time_limit_seconds: 10,
    },
  ],
  current_question_index: 2,
  answers: [],
});

describe('computeFeedback', () => {
  it('returns correct status with given value and points when the answer is right', () => {
    // Given
    const game = baseGame();
    game.answers = [
      {
        player_id: 'p1',
        question_id: 'q1',
        value: 4,
        timestamp: 0,
        is_correct: true,
        points_earned: 135,
      },
    ];

    // When
    const feedback = computeFeedback(game, 'p1', 0);

    // Then
    expect(feedback).toEqual({ status: 'correct', given: 4, expected: 4, pointsEarned: 135 });
  });

  it('returns wrong status with the given value and the expected answer', () => {
    // Given
    const game = baseGame();
    game.answers = [
      {
        player_id: 'p1',
        question_id: 'q1',
        value: 5,
        timestamp: 0,
        is_correct: false,
        points_earned: 0,
      },
    ];

    // When
    const feedback = computeFeedback(game, 'p1', 0);

    // Then
    expect(feedback).toEqual({ status: 'wrong', given: 5, expected: 4, pointsEarned: 0 });
  });

  it('returns timeout status when the player did not answer', () => {
    // Given
    const game = baseGame();

    // When
    const feedback = computeFeedback(game, 'p1', 0);

    // Then
    expect(feedback).toEqual({ status: 'timeout', given: null, expected: 4, pointsEarned: 0 });
  });

  it('returns null for an out-of-range index', () => {
    // Given
    const game = baseGame();

    // When / Then
    expect(computeFeedback(game, 'p1', 9)).toBeNull();
  });
});

describe('computeCombo', () => {
  it('counts consecutive correct answers ending at the given index', () => {
    // Given
    const game = baseGame();
    game.answers = [
      {
        player_id: 'p1',
        question_id: 'q1',
        value: 4,
        timestamp: 0,
        is_correct: true,
        points_earned: 100,
      },
      {
        player_id: 'p1',
        question_id: 'q2',
        value: 6,
        timestamp: 0,
        is_correct: true,
        points_earned: 100,
      },
      {
        player_id: 'p1',
        question_id: 'q3',
        value: 56,
        timestamp: 0,
        is_correct: true,
        points_earned: 100,
      },
    ];

    // When / Then
    expect(computeCombo(game, 'p1', 2)).toBe(3);
  });

  it('resets the combo on a wrong answer', () => {
    // Given
    const game = baseGame();
    game.answers = [
      {
        player_id: 'p1',
        question_id: 'q1',
        value: 4,
        timestamp: 0,
        is_correct: true,
        points_earned: 100,
      },
      {
        player_id: 'p1',
        question_id: 'q2',
        value: 9,
        timestamp: 0,
        is_correct: false,
        points_earned: 0,
      },
      {
        player_id: 'p1',
        question_id: 'q3',
        value: 56,
        timestamp: 0,
        is_correct: true,
        points_earned: 100,
      },
    ];

    // When / Then
    expect(computeCombo(game, 'p1', 2)).toBe(1);
  });

  it('resets the combo on a missing (timed out) answer', () => {
    // Given
    const game = baseGame();
    game.answers = [
      {
        player_id: 'p1',
        question_id: 'q1',
        value: 4,
        timestamp: 0,
        is_correct: true,
        points_earned: 100,
      },
      {
        player_id: 'p1',
        question_id: 'q3',
        value: 56,
        timestamp: 0,
        is_correct: true,
        points_earned: 100,
      },
    ];

    // When / Then
    expect(computeCombo(game, 'p1', 2)).toBe(1);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /home/tdemares/dev_folder/hussards_orga/front && npx vitest run src/lib/feedback.spec.ts`
Expected: FAIL — `feedback.ts` does not exist / functions not defined.

- [ ] **Step 3: Write the implementation**

```ts
import type { Answer, Game } from '../types';

export type FeedbackStatus = 'correct' | 'wrong' | 'timeout';

export interface QuestionFeedback {
  status: FeedbackStatus;
  given: number | null;
  expected: number;
  pointsEarned: number;
}

const findPlayerAnswer = (game: Game, playerId: string, questionId: string): Answer | null =>
  game.answers.find(
    (answer) => answer.question_id === questionId && answer.player_id === playerId
  ) ?? null;

export const computeFeedback = (
  game: Game,
  playerId: string,
  questionIndex: number
): QuestionFeedback | null => {
  const question = game.questions[questionIndex];
  if (!question) return null;

  const answer = findPlayerAnswer(game, playerId, question.id);
  if (!answer) {
    return { status: 'timeout', given: null, expected: question.answer, pointsEarned: 0 };
  }

  return {
    status: answer.is_correct ? 'correct' : 'wrong',
    given: answer.value,
    expected: question.answer,
    pointsEarned: answer.points_earned,
  };
};

export const computeCombo = (game: Game, playerId: string, uptoIndex: number): number => {
  let combo = 0;
  for (let index = uptoIndex; index >= 0; index -= 1) {
    const question = game.questions[index];
    if (!question) break;
    const answer = findPlayerAnswer(game, playerId, question.id);
    if (!answer || !answer.is_correct) break;
    combo += 1;
  }
  return combo;
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /home/tdemares/dev_folder/hussards_orga/front && npx vitest run src/lib/feedback.spec.ts`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
cd /home/tdemares/dev_folder/hussards_orga/front
git add src/lib/feedback.ts src/lib/feedback.spec.ts
git commit -m "feat: pure feedback and combo helpers"
```

---

### Task 2: Keyframes Tailwind + ComboBadge

**Files:**

- Modify: `tailwind.config.js`
- Create: `src/components/GameFeedback/ComboBadge.tsx`
- Test: `src/components/GameFeedback/ComboBadge.spec.tsx`

**Interfaces:**

- Produces:
  - Classes d'animation Tailwind : `animate-pop-in`, `animate-shake`, `animate-combo-grow`
  - `ComboBadge` — props `{ combo: number }` ; ne rend rien si `combo < 2`.

- [ ] **Step 1: Add the keyframes to the Tailwind config**

Dans `tailwind.config.js`, remplacer le bloc `animation` existant par `keyframes` + `animation` ci-dessous (conserver `bounce-short`) :

```js
      animation: {
        'bounce-short': 'bounce 0.5s infinite',
        'pop-in': 'pop-in 0.4s ease-out',
        shake: 'shake 0.4s ease-in-out',
        'combo-grow': 'combo-grow 0.4s ease-out',
      },
      keyframes: {
        'pop-in': {
          '0%': { transform: 'scale(0.6)', opacity: '0' },
          '60%': { transform: 'scale(1.1)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-6px)' },
          '75%': { transform: 'translateX(6px)' },
        },
        'combo-grow': {
          '0%': { transform: 'scale(0.8)' },
          '50%': { transform: 'scale(1.15)' },
          '100%': { transform: 'scale(1)' },
        },
      },
```

- [ ] **Step 2: Write the failing test**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ComboBadge } from './ComboBadge';

describe('ComboBadge', () => {
  it('renders nothing below a combo of 2', () => {
    // Given / When
    const { container } = render(<ComboBadge combo={1} />);

    // Then
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the combo multiplier when at least 2', () => {
    // Given / When
    render(<ComboBadge combo={3} />);

    // Then
    expect(screen.getByText('x3')).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd /home/tdemares/dev_folder/hussards_orga/front && npx vitest run src/components/GameFeedback/ComboBadge.spec.tsx`
Expected: FAIL — module not found.

- [ ] **Step 4: Write the implementation**

```tsx
import React from 'react';
import { cn } from '../../lib/utils';

interface ComboBadgeProps {
  combo: number;
}

export const ComboBadge: React.FC<ComboBadgeProps> = ({ combo }) => {
  if (combo < 2) return null;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-3 py-1 font-black',
        'bg-secondary/20 text-amber-600 animate-combo-grow'
      )}
    >
      <span aria-hidden>🔥</span>
      <span>x{combo}</span>
    </div>
  );
};
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd /home/tdemares/dev_folder/hussards_orga/front && npx vitest run src/components/GameFeedback/ComboBadge.spec.tsx`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
cd /home/tdemares/dev_folder/hussards_orga/front
git add tailwind.config.js src/components/GameFeedback/ComboBadge.tsx src/components/GameFeedback/ComboBadge.spec.tsx
git commit -m "feat: animation keyframes and ComboBadge component"
```

---

### Task 3: CorrectionCard (stage 2)

**Files:**

- Create: `src/components/GameFeedback/CorrectionCard.tsx`
- Test: `src/components/GameFeedback/CorrectionCard.spec.tsx`

**Interfaces:**

- Consumes: `computeFeedback`, `computeCombo` (Task 1) ; `ComboBadge` (Task 2) ; `Game` from `src/types.ts`
- Produces: `CorrectionCard` — props `{ game: Game; playerId: string; questionIndex: number; countdown: number | null }` ; ne rend rien si la question ou le feedback est absent.

- [ ] **Step 1: Write the failing tests**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CorrectionCard } from './CorrectionCard';
import type { Game } from '../../types';

const game = (answers: Game['answers']): Game => ({
  id: 'G1',
  state: 'IN_PROGRESS',
  players: [],
  questions: [
    {
      id: 'q1',
      statement: '7 x 8',
      answer: 56,
      category: 'multiplication',
      time_limit_seconds: 10,
    },
  ],
  current_question_index: 0,
  answers,
});

describe('CorrectionCard', () => {
  it('shows the given answer in success state with the earned points', () => {
    // Given
    const g = game([
      {
        player_id: 'p1',
        question_id: 'q1',
        value: 56,
        timestamp: 0,
        is_correct: true,
        points_earned: 135,
      },
    ]);

    // When
    render(<CorrectionCard game={g} playerId="p1" questionIndex={0} countdown={3} />);

    // Then
    expect(screen.getByText('Bonne réponse')).toBeInTheDocument();
    expect(screen.getByText('56')).toBeInTheDocument();
    expect(screen.getByText('+135')).toBeInTheDocument();
  });

  it('shows the wrong given answer and the expected answer on failure', () => {
    // Given
    const g = game([
      {
        player_id: 'p1',
        question_id: 'q1',
        value: 54,
        timestamp: 0,
        is_correct: false,
        points_earned: 0,
      },
    ]);

    // When
    render(<CorrectionCard game={g} playerId="p1" questionIndex={0} countdown={3} />);

    // Then
    expect(screen.getByText('Mauvaise réponse')).toBeInTheDocument();
    expect(screen.getByText('54')).toBeInTheDocument();
    expect(screen.getByText('56')).toBeInTheDocument();
  });

  it('shows a no-answer state on timeout', () => {
    // Given
    const g = game([]);

    // When
    render(<CorrectionCard game={g} playerId="p1" questionIndex={0} countdown={2} />);

    // Then
    expect(screen.getByText('Temps écoulé')).toBeInTheDocument();
    expect(screen.getByText('⏱ Pas de réponse')).toBeInTheDocument();
    expect(screen.getByText('56')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /home/tdemares/dev_folder/hussards_orga/front && npx vitest run src/components/GameFeedback/CorrectionCard.spec.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```tsx
import React from 'react';
import type { Game } from '../../types';
import { computeFeedback, computeCombo } from '../../lib/feedback';
import { ComboBadge } from './ComboBadge';

interface CorrectionCardProps {
  game: Game;
  playerId: string;
  questionIndex: number;
  countdown: number | null;
}

const titleFor = (status: 'correct' | 'wrong' | 'timeout'): string => {
  if (status === 'correct') return 'Bonne réponse';
  if (status === 'timeout') return 'Temps écoulé';
  return 'Mauvaise réponse';
};

export const CorrectionCard: React.FC<CorrectionCardProps> = ({
  game,
  playerId,
  questionIndex,
  countdown,
}) => {
  const feedback = computeFeedback(game, playerId, questionIndex);
  const question = game.questions[questionIndex];
  if (!feedback || !question) return null;

  const combo = computeCombo(game, playerId, questionIndex);
  const isCorrect = feedback.status === 'correct';

  return (
    <div className="space-y-6 animate-pop-in">
      <div className="text-sm font-semibold uppercase tracking-wider text-slate-400">
        {titleFor(feedback.status)}
      </div>

      <div className="text-3xl font-black text-slate-800">{question.statement}</div>

      <div className="flex items-center justify-center gap-3 text-4xl font-black">
        {feedback.status === 'timeout' ? (
          <span className="text-slate-400">⏱ Pas de réponse</span>
        ) : isCorrect ? (
          <span className="text-green-600">{feedback.given}</span>
        ) : (
          <>
            <span className="text-red-500 line-through">{feedback.given}</span>
            <span className="text-slate-300">→</span>
          </>
        )}
        {!isCorrect && <span className="text-green-600">{feedback.expected}</span>}
      </div>

      {isCorrect && feedback.pointsEarned > 0 && (
        <div className="text-2xl font-black text-green-600">+{feedback.pointsEarned}</div>
      )}

      <div className="flex justify-center">
        <ComboBadge combo={combo} />
      </div>

      {countdown !== null && (
        <div className="text-sm font-bold text-slate-400">Question suivante dans {countdown}…</div>
      )}
    </div>
  );
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /home/tdemares/dev_folder/hussards_orga/front && npx vitest run src/components/GameFeedback/CorrectionCard.spec.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
cd /home/tdemares/dev_folder/hussards_orga/front
git add src/components/GameFeedback/CorrectionCard.tsx src/components/GameFeedback/CorrectionCard.spec.tsx
git commit -m "feat: CorrectionCard for inter-question reveal"
```

---

### Task 4: AnswerFeedbackPop (stage 1)

**Files:**

- Create: `src/components/GameFeedback/AnswerFeedbackPop.tsx`
- Test: `src/components/GameFeedback/AnswerFeedbackPop.spec.tsx`

**Interfaces:**

- Produces: `AnswerFeedbackPop` — props `{ isCorrect: boolean; pointsEarned: number }`. N'affiche jamais la bonne réponse.

- [ ] **Step 1: Write the failing tests**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AnswerFeedbackPop } from './AnswerFeedbackPop';

describe('AnswerFeedbackPop', () => {
  it('shows the earned points in green when correct', () => {
    // Given / When
    render(<AnswerFeedbackPop isCorrect pointsEarned={135} />);

    // Then
    expect(screen.getByText('+135')).toBeInTheDocument();
  });

  it('shows a miss label when wrong', () => {
    // Given / When
    render(<AnswerFeedbackPop isCorrect={false} pointsEarned={0} />);

    // Then
    expect(screen.getByText('Raté')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /home/tdemares/dev_folder/hussards_orga/front && npx vitest run src/components/GameFeedback/AnswerFeedbackPop.spec.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```tsx
import React from 'react';
import { cn } from '../../lib/utils';

interface AnswerFeedbackPopProps {
  isCorrect: boolean;
  pointsEarned: number;
}

export const AnswerFeedbackPop: React.FC<AnswerFeedbackPopProps> = ({
  isCorrect,
  pointsEarned,
}) => (
  <div
    className={cn(
      'text-4xl font-black',
      isCorrect ? 'text-green-600 animate-pop-in' : 'text-red-500 animate-shake'
    )}
  >
    {isCorrect ? `+${pointsEarned}` : 'Raté'}
  </div>
);
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /home/tdemares/dev_folder/hussards_orga/front && npx vitest run src/components/GameFeedback/AnswerFeedbackPop.spec.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
cd /home/tdemares/dev_folder/hussards_orga/front
git add src/components/GameFeedback/AnswerFeedbackPop.tsx src/components/GameFeedback/AnswerFeedbackPop.spec.tsx
git commit -m "feat: AnswerFeedbackPop for on-submit feedback"
```

---

### Task 5: AnimatedScore (barre de score animée)

**Files:**

- Create: `src/components/GameFeedback/AnimatedScore.tsx`
- Test: `src/components/GameFeedback/AnimatedScore.spec.tsx`

**Interfaces:**

- Produces: `AnimatedScore` — props `{ score: number }`. Affiche `"{score} pts"` et applique une pulsation (`animate-combo-grow`) quand la valeur augmente.

- [ ] **Step 1: Write the failing tests**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AnimatedScore } from './AnimatedScore';

describe('AnimatedScore', () => {
  it('renders the score with its unit', () => {
    // Given / When
    render(<AnimatedScore score={135} />);

    // Then
    expect(screen.getByText('135 pts')).toBeInTheDocument();
  });

  it('pulses when the score increases', () => {
    // Given
    const { rerender } = render(<AnimatedScore score={0} />);

    // When
    act(() => {
      rerender(<AnimatedScore score={135} />);
    });

    // Then
    expect(screen.getByText('135 pts').className).toContain('animate-combo-grow');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /home/tdemares/dev_folder/hussards_orga/front && npx vitest run src/components/GameFeedback/AnimatedScore.spec.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```tsx
import React from 'react';
import { cn } from '../../lib/utils';

interface AnimatedScoreProps {
  score: number;
}

export const AnimatedScore: React.FC<AnimatedScoreProps> = ({ score }) => {
  const [pulse, setPulse] = React.useState(false);
  const previousScore = React.useRef(score);

  React.useEffect(() => {
    if (score === previousScore.current) return;
    previousScore.current = score;
    setPulse(true);
    const timeout = window.setTimeout(() => setPulse(false), 400);
    return () => window.clearTimeout(timeout);
  }, [score]);

  return (
    <span className={cn('shrink-0 tabular-nums', pulse && 'animate-combo-grow text-green-600')}>
      {score} pts
    </span>
  );
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /home/tdemares/dev_folder/hussards_orga/front && npx vitest run src/components/GameFeedback/AnimatedScore.spec.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
cd /home/tdemares/dev_folder/hussards_orga/front
git add src/components/GameFeedback/AnimatedScore.tsx src/components/GameFeedback/AnimatedScore.spec.tsx
git commit -m "feat: AnimatedScore with pulse on score increase"
```

---

### Task 6: Intégration dans GameView

**Files:**

- Modify: `src/views/GameView.tsx`
- Modify: `src/GameView.auto-advance.spec.tsx` (mise à jour de l'assertion "Réponse envoyée...")
- Test: `src/GameView.feedback.spec.tsx`

**Interfaces:**

- Consumes: `computeFeedback` (Task 1), `CorrectionCard` (Task 3), `AnswerFeedbackPop` (Task 4), `AnimatedScore` (Task 5).
- Comportement :
  - Compte à rebours inter-question (`questionCountdown !== null`) ET un feedback existe pour `displayedQuestionIndex` → afficher `CorrectionCard` (sinon écran « Préparez-vous » existant).
  - Question active, le joueur a déjà répondu → afficher `AnswerFeedbackPop` + « En attente des autres joueurs… » à la place de l'`AnswerInput`.
  - Scoreboard : remplacer `{player.score} pts` par `<AnimatedScore score={player.score} />`.

- [ ] **Step 1: Update the existing auto-advance test assertion**

Dans `src/GameView.auto-advance.spec.tsx`, le test `should not advance if not all players have answered` (le joueur courant `player1` a répondu) attend actuellement `'Réponse envoyée...'`. Comme l'`AnswerInput` est désormais remplacé par le pop après réponse, remplacer cette ligne :

```tsx
expect(screen.getByText('Réponse envoyée...')).toBeInTheDocument();
```

par :

```tsx
expect(screen.getByText('En attente des autres joueurs…')).toBeInTheDocument();
```

- [ ] **Step 2: Write the failing integration tests**

Créer `src/GameView.feedback.spec.tsx` :

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GameView } from './views/GameView';
import { GameClient } from './services/GameClient';
import type { Game } from './types';

describe('GameView - feedback', () => {
  let client: GameClient;

  beforeEach(() => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }));

    class MockWebSocket {
      send = vi.fn();
      close = vi.fn();
      readyState = WebSocket.OPEN;
      onopen = null;
      onmessage = null;
      onerror = null;
      onclose = null;
    }
    (globalThis as typeof globalThis & { WebSocket: typeof WebSocket }).WebSocket =
      MockWebSocket as unknown as typeof WebSocket;

    client = new GameClient(vi.fn(), vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  const game = (overrides: Partial<Game>): Game => ({
    id: 'G1',
    state: 'IN_PROGRESS',
    players: [{ id: 'p1', name: 'Me', is_bot: false, is_ready: true, score: 0, bot_config: null }],
    questions: [
      {
        id: 'q1',
        statement: '7 x 8',
        answer: 56,
        category: 'multiplication',
        time_limit_seconds: 10,
      },
      { id: 'q2', statement: '3 + 3', answer: 6, category: 'addition', time_limit_seconds: 10 },
    ],
    current_question_index: 0,
    answers: [],
    start_time_current_question: Date.now() / 1000,
    ...overrides,
  });

  it('shows the on-submit pop with earned points after the player answers', () => {
    // Given
    const answered = game({
      players: [
        { id: 'p1', name: 'Me', is_bot: false, is_ready: true, score: 135, bot_config: null },
      ],
      answers: [
        {
          player_id: 'p1',
          question_id: 'q1',
          value: 56,
          timestamp: 0,
          is_correct: true,
          points_earned: 135,
        },
      ],
    });

    // When
    render(<GameView client={client} game={answered} currentPlayerId="p1" />);

    // Then
    expect(screen.getByText('+135')).toBeInTheDocument();
    expect(screen.getByText('En attente des autres joueurs…')).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `cd /home/tdemares/dev_folder/hussards_orga/front && npx vitest run src/GameView.feedback.spec.tsx`
Expected: FAIL — `+135` / waiting label absent (l'`AnswerInput` est encore affiché).

- [ ] **Step 4: Edit GameView.tsx — imports**

Ajouter en haut de `src/views/GameView.tsx`, sous les imports existants :

```tsx
import { computeFeedback } from '../lib/feedback';
import { CorrectionCard } from '../components/GameFeedback/CorrectionCard';
import { AnswerFeedbackPop } from '../components/GameFeedback/AnswerFeedbackPop';
import { AnimatedScore } from '../components/GameFeedback/AnimatedScore';
```

- [ ] **Step 5: Edit GameView.tsx — derive the player's current answer**

Juste après la ligne existante `const hasAnswered = game.answers.some(...)` (vers `GameView.tsx:84-86`), ajouter :

```tsx
const myCurrentAnswer =
  game.answers.find(
    (answer) => answer.question_id === currentQuestion?.id && answer.player_id === currentPlayerId
  ) ?? null;
```

- [ ] **Step 6: Edit GameView.tsx — AnimatedScore in the scoreboard**

Dans `scoreBoard`, remplacer :

```tsx
<span className="shrink-0">{player.score} pts</span>
```

par :

```tsx
<AnimatedScore score={player.score} />
```

- [ ] **Step 7: Edit GameView.tsx — countdown branch shows the correction**

Remplacer le bloc du compte à rebours (la branche `questionCountdown !== null ? (...)`, `GameView.tsx:152-158`) par :

```tsx
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
```

- [ ] **Step 8: Edit GameView.tsx — question branch shows the pop after answering**

Dans la branche question active, remplacer le bloc `<AnswerInput ... />` (`GameView.tsx:176-182`) par :

```tsx
{
  myCurrentAnswer ? (
    <div className="space-y-2">
      <AnswerFeedbackPop
        key={currentQuestion.id}
        isCorrect={myCurrentAnswer.is_correct}
        pointsEarned={myCurrentAnswer.points_earned}
      />
      <div className="text-sm font-semibold text-slate-400">En attente des autres joueurs…</div>
    </div>
  ) : (
    <AnswerInput
      onSubmit={(value) => {
        if (hasAnswered) return;
        client.submitAnswer(value);
      }}
      disabled={hasAnswered}
    />
  );
}
```

- [ ] **Step 9: Run the full test suite**

Run: `cd /home/tdemares/dev_folder/hussards_orga/front && npx vitest run`
Expected: PASS — y compris `src/GameView.feedback.spec.tsx` et `src/GameView.auto-advance.spec.tsx` mis à jour.

- [ ] **Step 10: Type-check and lint**

Run: `cd /home/tdemares/dev_folder/hussards_orga/front && npx tsc --noEmit && npm run lint && npx prettier --check src/views/GameView.tsx`
Expected: aucun problème. Si prettier signale GameView.tsx, lancer `npx prettier --write src/views/GameView.tsx`.

- [ ] **Step 11: Commit**

```bash
cd /home/tdemares/dev_folder/hussards_orga/front
git add src/views/GameView.tsx src/GameView.feedback.spec.tsx src/GameView.auto-advance.spec.tsx
git commit -m "feat: wire in-game feedback, correction card and animated score"
```

---

### Task 7: Mise à jour de la documentation

**Files:**

- Modify: `doc/game-views.md`

**Interfaces:**

- Consumes: comportement final de `GameView`.

- [ ] **Step 1: Update `doc/game-views.md`**

Dans la section décrivant `GameView`, ajouter une sous-section dense décrivant le feedback en jeu :

```markdown
### Feedback en jeu

Dérivé du `Game` (aucun appel backend dédié). Voir `src/lib/feedback.ts`.

- **À la soumission** (`AnswerFeedbackPop`) : remplace l'`AnswerInput` une fois que le joueur a répondu. Affiche `+points` (vert, `animate-pop-in`) ou `Raté` (rouge, `animate-shake`) + « En attente des autres joueurs… ». Ne révèle pas la bonne réponse.
- **Compte à rebours inter-question** (`CorrectionCard`) : remplace l'écran « Préparez-vous » dès la 2ᵉ question. Rappel du calcul, réponse donnée (vert si correcte ; rouge barré + bonne réponse en vert sinon ; `⏱ Pas de réponse` au timeout), points gagnés, `ComboBadge`.
- **Combo** (`ComboBadge`) : `🔥 xN` à partir de 2 bonnes réponses consécutives (`computeCombo`). Purement visuel, n'influence pas le score.
- **Scoreboard** (`AnimatedScore`) : la valeur de score pulse à chaque hausse ; la barre conserve sa transition existante.

Composants : `src/components/GameFeedback/{AnswerFeedbackPop,CorrectionCard,ComboBadge,AnimatedScore}.tsx`.
```

- [ ] **Step 2: Verify formatting**

Run: `cd /home/tdemares/dev_folder/hussards_orga/front && npx prettier --write doc/game-views.md`
Expected: fichier formaté.

- [ ] **Step 3: Commit**

```bash
cd /home/tdemares/dev_folder/hussards_orga/front
git add doc/game-views.md
git commit -m "docs: document in-game feedback components"
```

---

## Self-Review

- **Spec coverage :** reveal 2 temps (Tasks 4 + 3/6), combo visuel (Tasks 1/2/3), barre de score animée (Task 5/6), timeout & 1ʳᵉ question (Tasks 1/3/6), animations sans dépendance (Task 2), mise à jour `doc/` (Task 7). ✓
- **Pas de placeholders :** tout le code est fourni.
- **Cohérence des types :** `QuestionFeedback`/`FeedbackStatus`/`computeFeedback`/`computeCombo` définis en Task 1 et consommés à l'identique en Tasks 3 & 6 ; `ComboBadge`/`CorrectionCard`/`AnswerFeedbackPop`/`AnimatedScore` signatures stables.
- **Note de régression connue :** Task 6 Step 1 met à jour l'unique assertion existante impactée (`'Réponse envoyée...'`).
