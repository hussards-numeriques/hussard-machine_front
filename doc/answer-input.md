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

Draw canvas with handwritten number recognition. The player writes the **whole number**
(one or several digits) on the canvas; a CRNN model reads the full sequence at once.

### Pointer interactions

Uses `PointerEvent` events (compatible with stylus, finger, mouse). The canvas backing
store is fixed (400×200) while its displayed size follows the layout, so `point()` scales
client coordinates to the backing store.

- `onPointerDown` → stroke start, captures the pointer, cancels any pending recognition
- `onPointerMove` → real-time drawing
- `onPointerUp` / `onPointerCancel` → (re)arms a debounce timer (`RECOGNIZE_DELAY_MS`,
  700 ms) so multi-stroke digits and multi-digit numbers are completed before recognition fires

### Local state

```typescript
recognized: number | null; // last number read from the canvas
isNegative: boolean; // sign toggled via the ± button
isRecognizing: boolean; // true during an ONNX inference
error: string | null; // error message if recognition fails
```

### Flow

1. On debounce expiry → `digitRecognitionPort.recognizeNumber(canvas)` on the whole canvas
2. If `null` → displays "Impossible de lire, réessaie", keeps the drawing
3. If a number → stored in `recognized` and shown above the canvas; the drawing stays, so
   the player can keep writing (recognition re-runs on the whole canvas)

### Controls

- **±** — toggles the sign
- **Effacer** — clears the canvas, the recognized number and the error
- **Valider** — calls `onSubmit(±recognized)` (disabled while recognizing or when nothing is recognized)

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
├── index.ts              ← exports the OnnxCrnnAdapter singleton instance
├── OnnxCrnnAdapter.ts    ← onnxruntime-web implementation + CTC decoding
└── preprocessing.ts      ← pure canvas-pixels → 32×128 tensor helpers
```

### Interface

```typescript
// port.ts
interface DigitRecognitionPort {
  preload(): Promise<void>; // loads the model ahead of time (idempotent)
  recognizeNumber(canvas: HTMLCanvasElement): Promise<number | null>; // whole number or null
}
```

### OnnxCrnnAdapter

Runs **client-side** with `onnxruntime-web`. The CRNN model is bundled in the app
(`public/models/crnn-digits.onnx`, ~7 MB) and loaded via a relative URL — no external
dependency, works offline. Input tensor `input` `[1,1,32,128]`, output `logits` `[T,1,11]`
(10 digits + CTC blank).

The session is created by `preload()` and cached (`loadPromise`; reset on failure so a
later call retries). `recognizeNumber` awaits `preload()`, so without preloading the first
recognition pays for the whole download (~2 s on mobile). To avoid that, `LobbyView` calls
`preload()` when `useResolvedAnswerInputMode()` is `handwriting` — the model is ready
before the first question.

Recognition pipeline:

1. Read canvas pixels (`getImageData`)
2. `toCrnnInput()` → ink map (0-1, ink high), crop to the ink bounding box, resize to a
   height of 32 keeping the aspect ratio, center horizontally in 32×128 (empty canvas → `null`)
3. Run the ONNX session → `decodeCtc()` (greedy CTC: argmax per timestep, merge repeats,
   drop blanks) → parsed number, or `null` if no digit

### Preprocessing (preprocessing.ts)

Pure, framework-free functions (unit-tested without a real canvas). `preprocessInkHigh`
is an exact mirror of the Python `preprocess_ink` used at training time — keep them in sync.

- `findInkBox(data, width, height)` → tight bounding box of non-white pixels, or `null`
- `preprocessInkHigh(ink, width, height)` → 32×128 `Float32Array`
- `toCrnnInput(data, width, height)` → 32×128 `Float32Array`, or `null` when there is no ink

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
