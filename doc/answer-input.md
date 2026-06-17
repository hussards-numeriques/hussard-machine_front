# Answer Input — Answer submission

The `AnswerInput` component allows the player to submit their numeric answer. It adapts to the device type: keyboard on desktop, handwriting on touch.

## Port / adapter pattern

```
src/components/AnswerInput/
├── port.ts          ← common interface AnswerInputProps
├── adapter.ts       ← selects the implementation based on device
├── index.ts         ← exports the resolved component
├── KeyboardInput.tsx
└── HandwritingInput.tsx
```

### Port (common interface)

```typescript
// port.ts
interface AnswerInputProps {
  onSubmit: (value: number) => void;
  disabled: boolean;
}
```

### Adapter

```typescript
// adapter.ts
export const getAnswerInputComponent = (): React.FC<AnswerInputProps> => {
  const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
  return isTouchDevice ? HandwritingInput : KeyboardInput;
};
```

The adapter is called once at import (`index.ts`) to avoid re-evaluating `matchMedia` on every render.

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
2. Modify `adapter.ts` to return `MyInput` based on the desired condition
3. No other changes needed — `GameView` uses `AnswerInput` opaquely

## Replacing digit recognition

1. Create a class implementing `DigitRecognitionPort`
2. Modify `src/services/digit-recognition/index.ts` to export the new instance
3. No other changes needed
