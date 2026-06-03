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

Free-draw canvas with handwritten digit recognition via TensorFlow.js.

### Pointer interactions

Uses `PointerEvent` events (compatible with stylus, finger, mouse):

- `onPointerDown` → stroke start, captures the pointer
- `onPointerMove` → real-time drawing
- `onPointerUp` / `onPointerCancel` → stroke end, stores in `strokes`

### Local state

```typescript
strokes: Stroke[]           // completed strokes
currentStroke: Ref<Point[]> // current stroke (ref to avoid re-renders)
isRecognizing: boolean      // true during TensorFlow call
error: string | null        // error message if recognition fails
```

### Validation

On "Submit" click:

1. Calls `digitRecognitionPort.recognize(canvas, strokes)`
2. If `null` → displays "Cannot read, please try again"
3. If value → calls `onSubmit(value)`

---

## Digit recognition (src/services/digit-recognition/)

### Port / adapter pattern

```
digit-recognition/
├── port.ts               ← DigitRecognitionPort interface
├── index.ts              ← exports the TfjsMnistAdapter singleton instance
├── TfjsMnistAdapter.ts   ← TensorFlow.js implementation
└── segmentation.ts       ← segmentation algorithm
```

### Interface

```typescript
// port.ts
interface DigitRecognitionPort {
  recognize(canvas: HTMLCanvasElement, strokes: Stroke[]): Promise<number | null>;
}
```

### TfjsMnistAdapter

MNIST model lazily loaded from GCS (`tfjs-examples/mnist-transfer-cnn`). Loading is triggered on the first call to `recognize()` and cached (`loadPromise`).

Recognition pipeline:

1. `segmentStrokes(strokes)` → list of `DigitRegion` (one per digit)
2. If the first region looks like a minus sign (`isMinusSign`) → `isNegative = true`
3. For each region: `renderRegion()` → 28×28 canvas → `predictDigit()` → digit 0-9
4. Concatenates digits into an integer, applies the sign

### Segmentation (segmentation.ts)

Stroke clustering algorithm by horizontal overlap:

1. Each stroke → a `DigitRegion` with its `BoundingBox`
2. Iterative merge: if two regions overlap horizontally → merged into one
3. Regions sorted by `minX` (left → right)

`isMinusSign`: a region is a minus sign if `height < width * 0.3` and `width > canvasWidth * 0.05`.

---

## Adding a new input implementation

1. Create `MyInput.tsx` implementing `AnswerInputProps` (port.ts)
2. Modify `adapter.ts` to return `MyInput` based on the desired condition
3. No other changes needed — `GameView` uses `AnswerInput` opaquely

## Replacing digit recognition

1. Create a class implementing `DigitRecognitionPort`
2. Modify `src/services/digit-recognition/index.ts` to export the new instance
3. No other changes needed
