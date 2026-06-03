# Answer Input — Saisie de réponse

Le composant `AnswerInput` permet au joueur de soumettre sa réponse numérique. Il s'adapte au type d'appareil : clavier sur desktop, saisie manuscrite sur tactile.

## Pattern port / adapter

```
src/components/AnswerInput/
├── port.ts          ← interface commune AnswerInputProps
├── adapter.ts       ← sélectionne l'implémentation selon le device
├── index.ts         ← exporte le composant résolu
├── KeyboardInput.tsx
└── HandwritingInput.tsx
```

### Port (interface commune)

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

L'adapter est appelé une seule fois à l'import (`index.ts`) pour éviter de re-évaluer `matchMedia` à chaque render.

### Utilisation dans GameView

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

Champ texte numérique avec bouton "Valider". Soumission par Enter ou clic.

---

## HandwritingInput (src/components/AnswerInput/HandwritingInput.tsx)

Canvas de dessin libre avec reconnaissance de chiffres manuscrits via TensorFlow.js.

### Interactions pointer

Utilise les événements `PointerEvent` (compatible stylet, doigt, souris) :

- `onPointerDown` → début de trait, capture le pointeur
- `onPointerMove` → dessin en temps réel
- `onPointerUp` / `onPointerCancel` → fin de trait, stocke dans `strokes`

### État local

```typescript
strokes: Stroke[]         // traits complétés
currentStroke: Ref<Point[]> // trait en cours (ref pour éviter les re-renders)
isRecognizing: boolean    // true pendant l'appel TensorFlow
error: string | null      // message d'erreur si reconnaissance échoue
```

### Validation

Au clic sur "Valider" :

1. Appelle `digitRecognitionPort.recognize(canvas, strokes)`
2. Si `null` → affiche "Impossible de lire, réessaie"
3. Si valeur → appelle `onSubmit(value)`

---

## Reconnaissance de chiffres (src/services/digit-recognition/)

### Pattern port / adapter

```
digit-recognition/
├── port.ts               ← interface DigitRecognitionPort
├── index.ts              ← exporte l'instance singleton TfjsMnistAdapter
├── TfjsMnistAdapter.ts   ← implémentation TensorFlow.js
└── segmentation.ts       ← algorithme de segmentation
```

### Interface

```typescript
// port.ts
interface DigitRecognitionPort {
  recognize(canvas: HTMLCanvasElement, strokes: Stroke[]): Promise<number | null>;
}
```

### TfjsMnistAdapter

Modèle MNIST chargé en lazy depuis GCS (`tfjs-examples/mnist-transfer-cnn`). Le chargement est déclenché au premier appel à `recognize()` et mis en cache (`loadPromise`).

Pipeline de reconnaissance :

1. `segmentStrokes(strokes)` → liste de `DigitRegion` (un par chiffre)
2. Si la première région ressemble à un signe moins (`isMinusSign`) → `isNegative = true`
3. Pour chaque région : `renderRegion()` → canvas 28×28 → `predictDigit()` → chiffre 0-9
4. Concatène les chiffres en entier, applique le signe

### Segmentation (segmentation.ts)

Algorithme de clustering des traits par chevauchement horizontal :

1. Chaque trait → une `DigitRegion` avec sa `BoundingBox`
2. Fusion itérative : si deux régions se chevauchent horizontalement → fusionnées en une
3. Tri des régions par `minX` (gauche → droite)

`isMinusSign` : une région est un signe moins si `height < width * 0.3` et `width > canvasWidth * 0.05`.

---

## Ajouter une nouvelle implémentation d'input

1. Créer `MonInput.tsx` qui implémente `AnswerInputProps` (port.ts)
2. Modifier `adapter.ts` pour retourner `MonInput` selon la condition souhaitée
3. Aucune autre modification nécessaire — `GameView` utilise `AnswerInput` de façon opaque

## Remplacer la reconnaissance de chiffres

1. Créer une classe qui implémente `DigitRecognitionPort`
2. Modifier `src/services/digit-recognition/index.ts` pour exporter la nouvelle instance
3. Aucune autre modification nécessaire
