# Answer Input — Answer submission

The `AnswerInput` component allows the player to submit their numeric answer. It supports
four **modes** — `keyboard`, `handwriting`, `keypad`, and an `auto` mode that adapts to the
device type (handwriting on touch, keyboard otherwise). The player can override the mode
per-device from the `/settings` page; the choice is persisted in `localStorage`.

## Port / adapter pattern

```
src/components/AnswerInput/
├── port.ts               ← common interface AnswerInputProps
├── mode.ts                ← AnswerInputMode union, labels/descriptions, resolveAnswerInputMode
├── adapter.ts             ← ANSWER_INPUT_COMPONENTS map (resolved mode → component)
├── index.ts               ← AnswerInput: reads the stored mode, resolves it, renders from the map
├── KeyboardInput.tsx
├── HandwritingInput.tsx
└── KeypadInput.tsx

src/hooks/
└── useAnswerInputMode.ts  ← localStorage-backed store for the selected mode

src/pages/
└── SettingsPage.tsx       ← lets the player pick their answer-input mode
```

### Port (common interface)

```typescript
// port.ts
interface AnswerInputProps {
  onSubmit: (value: number) => void;
  disabled: boolean;
}
```

### Mode resolution (mode.ts)

```typescript
// mode.ts
type AnswerInputMode = 'auto' | 'keyboard' | 'handwriting' | 'keypad';
type ResolvedAnswerInputMode = 'keyboard' | 'handwriting' | 'keypad';

const resolveAnswerInputMode = (
  mode: AnswerInputMode,
  isCoarsePointer: boolean
): ResolvedAnswerInputMode => {
  if (mode === 'auto') return isCoarsePointer ? 'handwriting' : 'keyboard';
  return mode;
};
```

`mode.ts` also exports `DEFAULT_ANSWER_INPUT_MODE` (`'auto'`), `ANSWER_INPUT_MODES` (the
ordered list of the four modes, used to render the settings page), `ANSWER_INPUT_MODE_LABELS`
and `ANSWER_INPUT_MODE_DESCRIPTIONS` (French copy shown to the player, keyed by mode), and
the type guard `isAnswerInputMode` used when reading back an untrusted `localStorage` value.
`resolveAnswerInputMode` is a pure function: it never touches `matchMedia` or storage itself.

### Adapter (adapter.ts)

```typescript
// adapter.ts
export const ANSWER_INPUT_COMPONENTS: Record<
  ResolvedAnswerInputMode,
  React.FC<AnswerInputProps>
> = {
  keyboard: KeyboardInput,
  handwriting: HandwritingInput,
  keypad: KeypadInput,
};
```

The adapter is now a plain lookup map from a `ResolvedAnswerInputMode` to its component —
there is no `getAnswerInputComponent` function anymore.

### Resolution in index.ts

`AnswerInput` (`index.ts`) reads the current mode from `useAnswerInputMode()`, computes
`isCoarsePointer` from `window.matchMedia('(pointer: coarse)').matches`, resolves the pair
through `resolveAnswerInputMode`, and looks up the component in `ANSWER_INPUT_COMPONENTS`.
This resolution happens **on every render**, not once at import — it is reactive to the
stored mode, so a change made on the settings page takes effect immediately without a reload.

### Usage in GameView

```typescript
import { AnswerInput } from '../components/AnswerInput';

<AnswerInput
  onSubmit={(value) => {
    if (hasAnswered) return;
    client.submitAnswer(value);
  }}
  disabled={hasAnswered}
/>
```

---

## Mode selection (useAnswerInputMode + SettingsPage)

### useAnswerInputMode (src/hooks/useAnswerInputMode.ts)

A `localStorage`-backed store built on `useSyncExternalStore`, under the key
`calc-rush:answer-input-mode`. It defaults to `'auto'` when the key is absent or holds an
invalid value (checked with `isAnswerInputMode`). State is shared across every component
instance in the tab (a module-level listener set, not React state) and stays in sync across
tabs/windows via the `storage` event. It returns a `[mode, setMode]` pair, mirroring
`useState`.

```typescript
const [mode, setMode] = useAnswerInputMode();
```

### The four modes

| Mode          | Behavior                                                                        |
| ------------- | ------------------------------------------------------------------------------- |
| `auto`        | Adaptive (default): handwriting on a coarse pointer (touch), keyboard otherwise |
| `keyboard`    | Always `KeyboardInput`                                                          |
| `handwriting` | Always `HandwritingInput`                                                       |
| `keypad`      | Always `KeypadInput`                                                            |

### SettingsPage (src/pages/SettingsPage.tsx)

Auth-gated page routed at `/settings`, linked from the Header user menu ("Réglages"). Shows
a loading state while auth resolves, and a "sign in" notice for anonymous visitors. Once
authenticated, it renders one selectable card per entry of `ANSWER_INPUT_MODES`
(Automatique / Clavier / Écriture manuscrite / Pavé numérique), using
`ANSWER_INPUT_MODE_LABELS`/`ANSWER_INPUT_MODE_DESCRIPTIONS` for copy, and calls `setMode`
on click. The choice is per-device (stored in `localStorage`, not synced to the backend).

---

## KeyboardInput (src/components/AnswerInput/KeyboardInput.tsx)

Numeric text field with a "Submit" button. Submission via Enter or click.

---

## HandwritingInput (src/components/AnswerInput/HandwritingInput.tsx)

Draw canvas with handwritten digit recognition, **one digit at a time**. The player
writes a single digit; it is recognized and appended to the running answer, then the
canvas clears for the next digit. This avoids the unsolved problem of segmenting
touching/overlapping multi-digit handwriting.

### Pointer interactions

Uses `PointerEvent` events (compatible with stylus, finger, mouse):

- `onPointerDown` → stroke start, captures the pointer, cancels any pending recognition
- `onPointerMove` → real-time drawing
- `onPointerUp` / `onPointerCancel` → (re)arms a debounce timer (`RECOGNIZE_DELAY_MS`,
  700 ms) so multi-stroke digits (4, 5, 7) are completed before recognition fires

### Local state

```typescript
digits: string; // accumulated answer digits
isNegative: boolean; // sign toggled via the ± button
isRecognizing: boolean; // true during an ONNX inference
error: string | null; // error message if recognition fails
```

### Flow

1. On debounce expiry → `digitRecognitionPort.recognizeDigit(canvas)`
2. If `null` → displays "Impossible de lire, réessaie", keeps the drawing
3. If a digit → appends to `digits` and clears the canvas

### Controls

- **±** — toggles the sign
- **⌫** — removes the last digit (use repeatedly to clear the whole answer)
- **Valider** — parses `digits` with the sign and calls `onSubmit(value)` (disabled when empty)

All three controls sit on a single row (no dedicated "clear all" button).

---

## KeypadInput (src/components/AnswerInput/KeypadInput.tsx)

On-screen numeric keypad — no device keyboard or drawing involved, well suited to
touch devices where the player prefers a fixed layout over handwriting recognition.

### Layout

Telephone-style grid: digits `1-9` on a 3-column grid (rows 1-2-3), then a bottom row with
**±** (sign toggle), **0**, and **Valider**. The running answer and a backspace button
("Effacer", `⌫`) sit above the grid, next to the display.

### Local state

```typescript
digits: string; // accumulated answer digits (no sign)
isNegative: boolean; // sign toggled via the ± button
```

### Controls

- **1-9 / 0** — append the digit to `digits`
- **±** — toggles the sign
- **⌫ (Effacer)** — removes the last digit
- **Valider** — parses `digits` with the sign and calls `onSubmit(value)` (disabled when `digits` is empty)

Like `HandwritingInput`, it resets its local state (`digits`, `isNegative`) whenever
`disabled` transitions back to `false`, so a fresh question starts from a blank answer.

---

## Digit recognition (src/services/digit-recognition/)

### Port / adapter pattern

```
digit-recognition/
├── port.ts               ← DigitRecognitionPort interface
├── index.ts              ← exports the OnnxMnistAdapter singleton instance
├── OnnxMnistAdapter.ts   ← onnxruntime-web implementation
└── preprocessing.ts      ← pure canvas-pixels → 28×28 tensor helpers
```

### Interface

```typescript
// port.ts
interface DigitRecognitionPort {
  recognizeDigit(canvas: HTMLCanvasElement): Promise<number | null>; // 0-9 or null
}
```

### OnnxMnistAdapter

Runs **client-side** with `onnxruntime-web`. The MNIST model is bundled in the app
(`public/models/mnist-12.onnx`, ONNX Model Zoo, ~26 KB) and loaded via a relative URL —
no external dependency, works offline. The session is lazily created on the first call
and cached (`loadPromise`). Input tensor `Input3` `[1,1,28,28]`, output `Plus214_Output_0` `[1,10]`.

Recognition pipeline (single digit):

1. Read canvas pixels (`getImageData`)
2. `toMnistInput()` → find the ink bounding box, scale it into a 20×20 box centered in
   28×28 (MNIST convention), produce a `Float32Array` (bright ink on dark background)
3. Run the ONNX session → logits → `argMax` → digit 0-9 (empty canvas → `null`)

### Preprocessing (preprocessing.ts)

Pure, framework-free functions (unit-tested without a real canvas):

- `findInkBox(data, width, height)` → tight bounding box of non-white pixels, or `null`
- `toMnistInput(data, width, height)` → centered 28×28 `Float32Array`, or `null`

The onnxruntime-web `.wasm` is emitted as a hashed Vite asset (`optimizeDeps.exclude`),
served from the app itself.

---

## Adding a new input implementation

1. Create `MyInput.tsx` implementing `AnswerInputProps` (port.ts)
2. Add it to the `ANSWER_INPUT_COMPONENTS` map in `adapter.ts`
3. If it should be a brand-new user-selectable mode (not just an alternate resolution of an
   existing one): add it to the `AnswerInputMode`/`ResolvedAnswerInputMode` unions and
   `ANSWER_INPUT_MODES` in `mode.ts`, give it an entry in `ANSWER_INPUT_MODE_LABELS` and
   `ANSWER_INPUT_MODE_DESCRIPTIONS`, and decide how `resolveAnswerInputMode` should treat it
   (e.g. whether `auto` can resolve to it)
4. No other changes needed — `GameView` uses `AnswerInput` opaquely, and the settings page
   picks up new entries of `ANSWER_INPUT_MODES` automatically

## Replacing digit recognition

1. Create a class implementing `DigitRecognitionPort`
2. Modify `src/services/digit-recognition/index.ts` to export the new instance
3. No other changes needed
