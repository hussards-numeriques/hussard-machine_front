# Handwriting Input Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a handwriting canvas input for mobile/tablet in GameView, with TF.js/MNIST digit recognition, both derrière des port/adapter patterns permettant de swapper le moteur de reconnaissance sans toucher aux composants UI.

**Architecture:** Deux couches port/adapter indépendantes. `DigitRecognitionPort` encapsule TF.js+MNIST (swappable pour une API custom). `AnswerInputPort` sélectionne automatiquement `HandwritingInput` (mobile/tablette via `pointer: coarse`) ou `KeyboardInput` (desktop). `GameView` délègue toute la saisie de réponse au port `AnswerInput`.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, @tensorflow/tfjs, Vitest, @testing-library/react

---

## File Map

**New files:**

- `src/services/digit-recognition/port.ts` — interface `DigitRecognitionPort` + types `Point` / `Stroke`
- `src/services/digit-recognition/segmentation.ts` — fonctions pures de segmentation strokes→régions
- `src/services/digit-recognition/segmentation.spec.ts` — tests unitaires segmentation
- `src/services/digit-recognition/TfjsMnistAdapter.ts` — implémentation TF.js + MNIST
- `src/services/digit-recognition/index.ts` — exporte le singleton actif
- `src/components/AnswerInput/port.ts` — type `AnswerInputProps`
- `src/components/AnswerInput/KeyboardInput.tsx` — input texte extrait de GameView
- `src/components/AnswerInput/KeyboardInput.spec.tsx` — tests KeyboardInput
- `src/components/AnswerInput/adapter.ts` — détection device
- `src/components/AnswerInput/adapter.spec.ts` — tests adapter
- `src/components/AnswerInput/index.ts` — exporte `useAnswerInput()`
- `src/components/AnswerInput/HandwritingInput.tsx` — canvas + pointer events
- `src/components/AnswerInput/HandwritingInput.spec.tsx` — tests HandwritingInput

**Modified files:**

- `src/views/GameView.tsx` — remplace le formulaire par `<AnswerInputComponent />`

---

### Task 1: Digit recognition port

**Files:**

- Create: `src/services/digit-recognition/port.ts`

- [ ] **Step 1: Créer le port**

```typescript
// src/services/digit-recognition/port.ts

export interface Point {
  x: number;
  y: number;
}

export interface Stroke {
  points: Point[];
}

export interface DigitRecognitionPort {
  recognize(canvas: HTMLCanvasElement, strokes: Stroke[]): Promise<number | null>;
}
```

Note: les adapters peuvent utiliser `canvas` (envoi image à une API), `strokes` (segmentation locale), ou les deux. Un adapter API futur ignorera `strokes` et enverra juste l'image.

- [ ] **Step 2: Commit**

```bash
git add src/services/digit-recognition/port.ts
git commit -m "feat: add digit recognition port"
```

---

### Task 2: Stroke segmentation utility

**Files:**

- Create: `src/services/digit-recognition/segmentation.ts`
- Create: `src/services/digit-recognition/segmentation.spec.ts`

- [ ] **Step 1: Écrire les tests (failing)**

```typescript
// src/services/digit-recognition/segmentation.spec.ts
import { describe, it, expect } from 'vitest';
import { segmentStrokes, isMinusSign } from './segmentation';

describe('segmentStrokes', () => {
  it('returns empty array for no strokes', () => {
    expect(segmentStrokes([])).toEqual([]);
  });

  it('groups horizontally overlapping strokes into one region', () => {
    const strokes = [
      {
        points: [
          { x: 10, y: 10 },
          { x: 20, y: 20 },
        ],
      },
      {
        points: [
          { x: 15, y: 30 },
          { x: 25, y: 40 },
        ],
      },
    ];
    const result = segmentStrokes(strokes);
    expect(result).toHaveLength(1);
    expect(result[0].strokes).toHaveLength(2);
  });

  it('separates horizontally non-overlapping strokes', () => {
    const strokes = [
      {
        points: [
          { x: 0, y: 10 },
          { x: 20, y: 20 },
        ],
      },
      {
        points: [
          { x: 50, y: 10 },
          { x: 70, y: 20 },
        ],
      },
    ];
    const result = segmentStrokes(strokes);
    expect(result).toHaveLength(2);
  });

  it('sorts regions left to right', () => {
    const strokes = [
      {
        points: [
          { x: 80, y: 10 },
          { x: 90, y: 20 },
        ],
      },
      {
        points: [
          { x: 10, y: 10 },
          { x: 20, y: 20 },
        ],
      },
    ];
    const result = segmentStrokes(strokes);
    expect(result[0].box.minX).toBe(10);
    expect(result[1].box.minX).toBe(80);
  });
});

describe('isMinusSign', () => {
  it('detects a wide flat stroke as minus sign', () => {
    const region = {
      strokes: [
        {
          points: [
            { x: 10, y: 50 },
            { x: 90, y: 52 },
          ],
        },
      ],
      box: { minX: 10, maxX: 90, minY: 50, maxY: 52 },
    };
    expect(isMinusSign(region, 200)).toBe(true);
  });

  it('does not detect a tall stroke as minus sign', () => {
    const region = {
      strokes: [
        {
          points: [
            { x: 10, y: 10 },
            { x: 20, y: 80 },
          ],
        },
      ],
      box: { minX: 10, maxX: 20, minY: 10, maxY: 80 },
    };
    expect(isMinusSign(region, 200)).toBe(false);
  });
});
```

- [ ] **Step 2: Vérifier que les tests échouent**

```bash
npm run test -- segmentation
```

Expected: FAIL with "Cannot find module './segmentation'"

- [ ] **Step 3: Implémenter la segmentation**

```typescript
// src/services/digit-recognition/segmentation.ts
import type { Stroke } from './port';

export interface BoundingBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface DigitRegion {
  strokes: Stroke[];
  box: BoundingBox;
}

const strokeBox = (stroke: Stroke): BoundingBox => {
  const xs = stroke.points.map((p) => p.x);
  const ys = stroke.points.map((p) => p.y);
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
};

const mergeBoxes = (a: BoundingBox, b: BoundingBox): BoundingBox => ({
  minX: Math.min(a.minX, b.minX),
  maxX: Math.max(a.maxX, b.maxX),
  minY: Math.min(a.minY, b.minY),
  maxY: Math.max(a.maxY, b.maxY),
});

const overlapsHorizontally = (a: BoundingBox, b: BoundingBox): boolean =>
  a.minX <= b.maxX && b.minX <= a.maxX;

export const segmentStrokes = (strokes: Stroke[]): DigitRegion[] => {
  if (strokes.length === 0) return [];

  const regions: DigitRegion[] = strokes.map((stroke) => ({
    strokes: [stroke],
    box: strokeBox(stroke),
  }));

  let merged = true;
  while (merged) {
    merged = false;
    outer: for (let i = 0; i < regions.length; i++) {
      for (let j = i + 1; j < regions.length; j++) {
        if (overlapsHorizontally(regions[i].box, regions[j].box)) {
          regions[i] = {
            strokes: [...regions[i].strokes, ...regions[j].strokes],
            box: mergeBoxes(regions[i].box, regions[j].box),
          };
          regions.splice(j, 1);
          merged = true;
          break outer;
        }
      }
    }
  }

  return regions.sort((a, b) => a.box.minX - b.box.minX);
};

export const isMinusSign = (region: DigitRegion, canvasWidth: number): boolean => {
  const width = region.box.maxX - region.box.minX;
  const height = region.box.maxY - region.box.minY;
  return height < width * 0.3 && width > canvasWidth * 0.05;
};
```

- [ ] **Step 4: Vérifier que les tests passent**

```bash
npm run test -- segmentation
```

Expected: 5 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/digit-recognition/segmentation.ts src/services/digit-recognition/segmentation.spec.ts
git commit -m "feat: add stroke segmentation utility"
```

---

### Task 3: Installer TF.js et créer TfjsMnistAdapter

**Files:**

- Create: `src/services/digit-recognition/TfjsMnistAdapter.ts`

Le modèle MNIST est chargé depuis `https://storage.googleapis.com/tfjs-examples/mnist-transfer-cnn/dist/model.json`. Il attend un tensor `[1, 28, 28, 1]` avec des pixels inversés (0=blanc, 1=noir) et retourne un vecteur softmax de dimension 10.

- [ ] **Step 1: Installer @tensorflow/tfjs**

```bash
npm install @tensorflow/tfjs
```

Expected: package ajouté aux `dependencies` dans package.json.

- [ ] **Step 2: Créer TfjsMnistAdapter**

```typescript
// src/services/digit-recognition/TfjsMnistAdapter.ts
import type { DigitRecognitionPort, Stroke } from './port';
import { segmentStrokes, isMinusSign } from './segmentation';
import type { DigitRegion } from './segmentation';

const MODEL_URL = 'https://storage.googleapis.com/tfjs-examples/mnist-transfer-cnn/dist/model.json';
const DIGIT_SIZE = 28;
const PADDING = 4;

export class TfjsMnistAdapter implements DigitRecognitionPort {
  private model: Awaited<
    ReturnType<(typeof import('@tensorflow/tfjs'))['loadLayersModel']>
  > | null = null;
  private tf: typeof import('@tensorflow/tfjs') | null = null;

  private async ensureLoaded(): Promise<void> {
    if (this.model) return;
    this.tf = await import('@tensorflow/tfjs');
    this.model = await this.tf.loadLayersModel(MODEL_URL);
  }

  private renderRegion(region: DigitRegion): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = DIGIT_SIZE;
    canvas.height = DIGIT_SIZE;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, DIGIT_SIZE, DIGIT_SIZE);

    const { minX, maxX, minY, maxY } = region.box;
    const boxW = maxX - minX || 1;
    const boxH = maxY - minY || 1;
    const scale = Math.min((DIGIT_SIZE - PADDING * 2) / boxW, (DIGIT_SIZE - PADDING * 2) / boxH);
    const dx = PADDING + (DIGIT_SIZE - PADDING * 2 - boxW * scale) / 2 - minX * scale;
    const dy = PADDING + (DIGIT_SIZE - PADDING * 2 - boxH * scale) / 2 - minY * scale;

    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (const stroke of region.strokes) {
      if (stroke.points.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x * scale + dx, stroke.points[0].y * scale + dy);
      for (const pt of stroke.points.slice(1)) {
        ctx.lineTo(pt.x * scale + dx, pt.y * scale + dy);
      }
      ctx.stroke();
    }

    return canvas;
  }

  private predictDigit(digitCanvas: HTMLCanvasElement): number {
    const tf = this.tf!;
    return tf.tidy(() => {
      const img = tf.browser.fromPixels(digitCanvas, 1);
      const normalized = tf.scalar(1).sub(img.toFloat().div(255));
      const batched = normalized.expandDims(0);
      const prediction = this.model!.predict(batched) as ReturnType<typeof tf.tensor>;
      return Array.from(prediction.argMax(1).dataSync())[0];
    });
  }

  async recognize(canvas: HTMLCanvasElement, strokes: Stroke[]): Promise<number | null> {
    if (strokes.length === 0) return null;
    await this.ensureLoaded();

    const regions = segmentStrokes(strokes);
    if (regions.length === 0) return null;

    let isNegative = false;
    let digitRegions = regions;

    if (regions.length > 1 && isMinusSign(regions[0], canvas.width)) {
      isNegative = true;
      digitRegions = regions.slice(1);
    }

    const digits: number[] = [];
    for (const region of digitRegions) {
      const digitCanvas = this.renderRegion(region);
      digits.push(this.predictDigit(digitCanvas));
    }

    if (digits.length === 0) return null;

    const value = parseInt(digits.join(''), 10);
    return isNaN(value) ? null : isNegative ? -value : value;
  }
}
```

- [ ] **Step 3: Vérifier que le build TypeScript passe**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/services/digit-recognition/TfjsMnistAdapter.ts package.json package-lock.json
git commit -m "feat: add TfjsMnistAdapter with lazy TF.js loading"
```

---

### Task 4: Digit recognition index

**Files:**

- Create: `src/services/digit-recognition/index.ts`

- [ ] **Step 1: Créer l'index**

```typescript
// src/services/digit-recognition/index.ts
import { TfjsMnistAdapter } from './TfjsMnistAdapter';
import type { DigitRecognitionPort } from './port';

export const digitRecognitionPort: DigitRecognitionPort = new TfjsMnistAdapter();
export type { DigitRecognitionPort };
```

- [ ] **Step 2: Commit**

```bash
git add src/services/digit-recognition/index.ts
git commit -m "feat: export active digit recognition instance"
```

---

### Task 5: AnswerInput port + KeyboardInput

**Files:**

- Create: `src/components/AnswerInput/port.ts`
- Create: `src/components/AnswerInput/KeyboardInput.tsx`
- Create: `src/components/AnswerInput/KeyboardInput.spec.tsx`

- [ ] **Step 1: Créer le port AnswerInput**

```typescript
// src/components/AnswerInput/port.ts
export interface AnswerInputProps {
  onSubmit: (value: number) => void;
  disabled: boolean;
}
```

- [ ] **Step 2: Écrire les tests KeyboardInput (failing)**

```typescript
// src/components/AnswerInput/KeyboardInput.spec.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { KeyboardInput } from './KeyboardInput';

describe('KeyboardInput', () => {
  it('calls onSubmit with parsed integer on form submit', () => {
    const onSubmit = vi.fn();
    render(<KeyboardInput onSubmit={onSubmit} disabled={false} />);
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '42' } });
    fireEvent.submit(screen.getByRole('form'));
    expect(onSubmit).toHaveBeenCalledWith(42);
  });

  it('does not call onSubmit when disabled', () => {
    const onSubmit = vi.fn();
    render(<KeyboardInput onSubmit={onSubmit} disabled={true} />);
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '42' } });
    fireEvent.click(screen.getByRole('button'));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows "Réponse envoyée..." text on button when disabled', () => {
    render(<KeyboardInput onSubmit={vi.fn()} disabled={true} />);
    expect(screen.getByRole('button')).toHaveTextContent('Réponse envoyée...');
  });
});
```

- [ ] **Step 3: Vérifier que les tests échouent**

```bash
npm run test -- KeyboardInput
```

Expected: FAIL with "Cannot find module './KeyboardInput'"

- [ ] **Step 4: Implémenter KeyboardInput**

```tsx
// src/components/AnswerInput/KeyboardInput.tsx
import React from 'react';
import { Button } from '../Button';
import { Input } from '../Input';
import type { AnswerInputProps } from './port';

export const KeyboardInput: React.FC<AnswerInputProps> = ({ onSubmit, disabled }) => {
  const [answer, setAnswer] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!disabled) {
      setAnswer('');
      inputRef.current?.focus();
    }
  }, [disabled]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer || disabled) return;
    onSubmit(parseInt(answer, 10));
  };

  return (
    <form onSubmit={handleSubmit} aria-label="form" className="space-y-6">
      <Input
        ref={inputRef}
        type="number"
        placeholder="?"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        disabled={disabled}
        autoFocus
        className="text-4xl font-bold py-6"
      />
      <Button type="submit" size="lg" className="w-full" disabled={disabled || !answer}>
        {disabled ? 'Réponse envoyée...' : 'Valider'}
      </Button>
    </form>
  );
};
```

- [ ] **Step 5: Vérifier que les tests passent**

```bash
npm run test -- KeyboardInput
```

Expected: 3 tests PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/AnswerInput/port.ts src/components/AnswerInput/KeyboardInput.tsx src/components/AnswerInput/KeyboardInput.spec.tsx
git commit -m "feat: extract KeyboardInput component and AnswerInput port"
```

---

### Task 6: AnswerInput adapter + index

**Files:**

- Create: `src/components/AnswerInput/adapter.ts`
- Create: `src/components/AnswerInput/adapter.spec.ts`
- Create: `src/components/AnswerInput/index.ts`

- [ ] **Step 1: Écrire les tests de l'adapter (failing)**

```typescript
// src/components/AnswerInput/adapter.spec.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

beforeEach(() => {
  vi.stubGlobal('matchMedia', vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('getAnswerInputComponent', () => {
  it('returns HandwritingInput when pointer is coarse (mobile/tablette)', async () => {
    vi.mocked(window.matchMedia).mockReturnValue({ matches: true } as MediaQueryList);
    const { getAnswerInputComponent } = await import('./adapter');
    const Component = getAnswerInputComponent();
    expect(Component.name).toBe('HandwritingInput');
  });

  it('returns KeyboardInput when pointer is fine (desktop)', async () => {
    vi.mocked(window.matchMedia).mockReturnValue({ matches: false } as MediaQueryList);
    const { getAnswerInputComponent } = await import('./adapter');
    const Component = getAnswerInputComponent();
    expect(Component.name).toBe('KeyboardInput');
  });
});
```

- [ ] **Step 2: Vérifier que les tests échouent**

```bash
npm run test -- adapter.spec
```

Expected: FAIL with "Cannot find module './adapter'"

- [ ] **Step 3: Implémenter l'adapter**

```typescript
// src/components/AnswerInput/adapter.ts
import React from 'react';
import { HandwritingInput } from './HandwritingInput';
import { KeyboardInput } from './KeyboardInput';
import type { AnswerInputProps } from './port';

export const getAnswerInputComponent = (): React.FC<AnswerInputProps> => {
  const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
  return isTouchDevice ? HandwritingInput : KeyboardInput;
};
```

- [ ] **Step 4: Créer l'index**

```typescript
// src/components/AnswerInput/index.ts
import React from 'react';
import { getAnswerInputComponent } from './adapter';
import type { AnswerInputProps } from './port';

export const useAnswerInput = (): React.FC<AnswerInputProps> =>
  React.useMemo(() => getAnswerInputComponent(), []);

export type { AnswerInputProps };
```

- [ ] **Step 5: Vérifier que les tests passent**

```bash
npm run test -- adapter.spec
```

Expected: 2 tests PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/AnswerInput/adapter.ts src/components/AnswerInput/adapter.spec.ts src/components/AnswerInput/index.ts
git commit -m "feat: add AnswerInput adapter with device detection"
```

---

### Task 7: HandwritingInput component

**Files:**

- Create: `src/components/AnswerInput/HandwritingInput.tsx`
- Create: `src/components/AnswerInput/HandwritingInput.spec.tsx`

- [ ] **Step 1: Écrire les tests (failing)**

```typescript
// src/components/AnswerInput/HandwritingInput.spec.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HandwritingInput } from './HandwritingInput';

vi.mock('../../services/digit-recognition', () => ({
  digitRecognitionPort: { recognize: vi.fn() },
}));

import { digitRecognitionPort } from '../../services/digit-recognition';

beforeEach(() => {
  vi.mocked(digitRecognitionPort.recognize).mockResolvedValue(42);
  HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
    fillStyle: '',
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    strokeStyle: '',
    lineWidth: 0,
    lineCap: '',
    lineJoin: '',
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
  });
});

describe('HandwritingInput', () => {
  it('renders canvas, Effacer and Valider buttons', () => {
    render(<HandwritingInput onSubmit={vi.fn()} disabled={false} />);
    expect(screen.getByRole('button', { name: 'Effacer' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Valider' })).toBeInTheDocument();
    expect(document.querySelector('canvas')).toBeInTheDocument();
  });

  it('calls onSubmit with recognized number on Valider click', async () => {
    const onSubmit = vi.fn();
    render(<HandwritingInput onSubmit={onSubmit} disabled={false} />);
    fireEvent.click(screen.getByRole('button', { name: 'Valider' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(42));
  });

  it('shows error message when recognition returns null', async () => {
    vi.mocked(digitRecognitionPort.recognize).mockResolvedValue(null);
    render(<HandwritingInput onSubmit={vi.fn()} disabled={false} />);
    fireEvent.click(screen.getByRole('button', { name: 'Valider' }));
    await waitFor(() =>
      expect(screen.getByText('Impossible de lire, réessaie')).toBeInTheDocument()
    );
  });

  it('disables both buttons when disabled prop is true', () => {
    render(<HandwritingInput onSubmit={vi.fn()} disabled={true} />);
    expect(screen.getByRole('button', { name: 'Effacer' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Valider' })).toBeDisabled();
  });
});
```

- [ ] **Step 2: Vérifier que les tests échouent**

```bash
npm run test -- HandwritingInput
```

Expected: FAIL with "Cannot find module './HandwritingInput'"

- [ ] **Step 3: Implémenter HandwritingInput**

```tsx
// src/components/AnswerInput/HandwritingInput.tsx
import React from 'react';
import { Button } from '../Button';
import type { AnswerInputProps } from './port';
import { digitRecognitionPort } from '../../services/digit-recognition';
import type { Stroke, Point } from '../../services/digit-recognition/port';

export const HandwritingInput: React.FC<AnswerInputProps> = ({ onSubmit, disabled }) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [strokes, setStrokes] = React.useState<Stroke[]>([]);
  const currentStroke = React.useRef<Point[]>([]);
  const [isRecognizing, setIsRecognizing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const getCtx = () => canvasRef.current?.getContext('2d') ?? null;

  const fillWhite = () => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  React.useEffect(() => {
    fillWhite();
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const pt: Point = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    currentStroke.current = [pt];
    setError(null);

    const ctx = getCtx()!;
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(pt.x, pt.y);
    canvasRef.current!.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled || currentStroke.current.length === 0) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const pt: Point = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    currentStroke.current.push(pt);

    const ctx = getCtx()!;
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
  };

  const handlePointerUp = () => {
    if (currentStroke.current.length === 0) return;
    setStrokes((prev) => [...prev, { points: [...currentStroke.current] }]);
    currentStroke.current = [];
  };

  const handleClear = () => {
    setStrokes([]);
    setError(null);
    currentStroke.current = [];
    fillWhite();
  };

  const handleValidate = async () => {
    if (!canvasRef.current || isRecognizing) return;
    setIsRecognizing(true);
    setError(null);

    const result = await digitRecognitionPort.recognize(canvasRef.current, strokes);
    setIsRecognizing(false);

    if (result === null) {
      setError('Impossible de lire, réessaie');
      return;
    }

    onSubmit(result);
  };

  return (
    <div className="space-y-4">
      <canvas
        ref={canvasRef}
        width={400}
        height={200}
        className="w-full rounded-xl border-2 border-slate-200 bg-white touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />
      {error && <p className="text-sm text-red-500 text-center">{error}</p>}
      <div className="flex gap-3">
        <Button
          variant="secondary"
          size="lg"
          className="flex-1"
          onClick={handleClear}
          disabled={disabled}
        >
          Effacer
        </Button>
        <Button
          size="lg"
          className="flex-1"
          onClick={handleValidate}
          disabled={disabled || isRecognizing}
        >
          {isRecognizing ? '...' : 'Valider'}
        </Button>
      </div>
    </div>
  );
};
```

- [ ] **Step 4: Vérifier que les tests passent**

```bash
npm run test -- HandwritingInput
```

Expected: 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/AnswerInput/HandwritingInput.tsx src/components/AnswerInput/HandwritingInput.spec.tsx
git commit -m "feat: add HandwritingInput canvas component"
```

---

### Task 8: Mettre à jour GameView

**Files:**

- Modify: `src/views/GameView.tsx`

- [ ] **Step 1: Vérifier que tous les tests passent avant modification**

```bash
npm run test
```

Expected: tous les tests existants PASS

- [ ] **Step 2: Remplacer le contenu de GameView**

Remplacer entièrement `src/views/GameView.tsx` par :

```tsx
// src/views/GameView.tsx
import React from 'react';
import { GameClient } from '../services/GameClient';
import type { Game, Question } from '../types';
import { useQuestionCategoryLabels } from '../lib/useQuestionCategoryLabels';
import { resolveCategoryLabel } from '../services/questionCategoryLabels';
import { useAnswerInput } from '../components/AnswerInput';

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
  const [lastSubmittedId, setLastSubmittedId] = React.useState<string | null>(null);
  const [questionCountdown, setQuestionCountdown] = React.useState<number | null>(null);
  const [displayedQuestionIndex, setDisplayedQuestionIndex] = React.useState<number>(
    game.current_question_index
  );
  const categoryLabels = useQuestionCategoryLabels();
  const AnswerInputComponent = useAnswerInput();

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
            <span className="shrink-0">{player.score} pts</span>
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
            <>
              <div className="text-9xl font-black text-primary animate-pulse">
                {questionCountdown}
              </div>
              <div className="text-2xl font-bold text-slate-600">Préparez-vous...</div>
            </>
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

              <AnswerInputComponent
                onSubmit={(value) => {
                  if (hasAnswered) return;
                  client.submitAnswer(value);
                  setLastSubmittedId(currentQuestion.id);
                }}
                disabled={hasAnswered}
              />
            </>
          )}
        </div>

        {scoreBoard}
      </div>
    </div>
  );
};
```

Note: `lastSubmittedId` est conservé pour ne pas changer le comportement existant des tests (`GameView.auto-advance.spec.tsx` vérifie la gestion de l'index de question).

- [ ] **Step 3: Vérifier que tous les tests passent**

```bash
npm run test
```

Expected: tous les tests PASS (y compris `GameView.auto-advance.spec.tsx` et `App.podium.spec.tsx`)

- [ ] **Step 4: Vérifier le build TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit final**

```bash
git add src/views/GameView.tsx
git commit -m "feat: integrate AnswerInput port into GameView"
```

---

## Post-implémentation — vérification manuelle

Tester dans DevTools (mode responsive, simuler un appareil tactile) :

1. Sur mobile simulé : la zone canvas blanche s'affiche à la place du champ texte
2. Tracer des traits avec la souris (simulant le doigt) : les traits apparaissent en noir
3. Cliquer "Effacer" : le canvas redevient blanc
4. Cliquer "Valider" : le bouton affiche "..." puis la réponse est envoyée
5. Sur desktop (sans simuler mobile) : le champ texte + bouton Valider s'affichent normalement
