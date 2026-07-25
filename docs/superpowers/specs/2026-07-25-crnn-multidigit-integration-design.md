# Design — Intégration du modèle CRNN+CTC multi-chiffres

Date : 2026-07-25

## Contexte

Le front reconnaît aujourd'hui l'écriture manuscrite **un chiffre à la fois** via un modèle
MNIST (`OnnxMnistAdapter`, `mnist-12.onnx`) : l'utilisateur dessine un chiffre, il est reconnu
après une pause, le canvas se vide, on dessine le suivant, et le nombre se construit chiffre par
chiffre.

Le lab `digit_detection` produit désormais un modèle **CRNN+CTC** (`models/model.onnx`) qui lit
**tout le nombre en une seule passe**. Le format n'est pas compatible avec l'adapter actuel :

| | Front actuel (MNIST) | Nouveau modèle (CRNN+CTC) |
|---|---|---|
| Entrée | `[1,1,28,28]`, valeurs 0-255 | `input` `[1,1,32,128]` f32, valeurs 0-1 |
| Sortie | 1 vecteur → argmax → 1 chiffre | `logits` `[32,1,11]` → décodage CTC → nombre entier |
| Noms I/O | `Input3` / `Plus214_Output_0` | `input` / `logits` |
| UX | 1 chiffre à la fois, effacement entre chaque | tout le nombre d'un coup, une seule passe |

I/O du modèle vérifiés directement sur `model.onnx` : entrée `input [1,1,32,128]`, sortie
`logits [32,1,11]` (32 timesteps, batch 1, 11 classes = 10 chiffres + blank CTC à l'index 10).

## Objectif

Remplacer intégralement la reconnaissance MNIST 1-chiffre par le modèle CRNN+CTC multi-chiffres,
côté service `digit-recognition` et composant `HandwritingInput`. L'ancien adapter et le modèle
MNIST sont **supprimés** (pas de fallback).

## Design

### 1. Fichier modèle

- Copier `digit_detection/models/model.onnx` → `front/public/models/crnn-digits.onnx`
- Supprimer `front/public/models/mnist-12.onnx`
- (Le build recopie `public/` vers `dist/` ; l'ancien `dist/models/mnist-12.onnx` disparaîtra au
  prochain build.)

### 2. Port (`src/services/digit-recognition/port.ts`)

```ts
export interface DigitRecognitionPort {
  recognizeNumber(canvas: HTMLCanvasElement): Promise<number | null>;
}
```

Remplace `recognizeDigit`. Renvoie le nombre entier reconnu (non signé — le signe est géré par
l'UI), ou `null` si le canvas est vide / illisible.

### 3. Préprocessing (`src/services/digit-recognition/preprocessing.ts`)

Nouvelle fonction `toCrnnInput(data, width, height): Float32Array | null` :

1. Lit l'`ImageData` du canvas.
2. Convertit en luminance niveaux de gris.
3. Crop sur la bounding box de l'encre (réutilise `findInkBox`, conservé tel quel).
4. Redimensionne la box à **hauteur 32** en préservant le ratio (largeur ∝, clampée à 128 max).
5. Centre horizontalement sur un canvas **noir 32×128** (padding horizontal).
6. Inverse (encre blanche sur fond noir) **et divise par 255** → valeurs 0-1.
7. Renvoie un `Float32Array` de longueur `32*128`.

On retire `toMnistInput` et les constantes `MNIST_SIZE` / `INNER_BOX` (plus utilisées).
`findInkBox`, `InkBox` et `luminance` restent. Les constantes `CRNN_HEIGHT = 32`,
`CRNN_WIDTH = 128` sont exportées pour l'adapter.

### 4. Adapter (`src/services/digit-recognition/OnnxCrnnAdapter.ts`)

Remplace `OnnxMnistAdapter.ts`.

- `MODEL_URL = '/models/crnn-digits.onnx'`, `INPUT_NAME = 'input'`, `OUTPUT_NAME = 'logits'`
- Chargement paresseux de `onnxruntime-web` + session (même pattern `ensureLoaded` qu'aujourd'hui)
- `recognizeNumber(canvas)` :
  - lit l'ImageData, applique `toCrnnInput`, retourne `null` si vide
  - crée le tensor `[1,1,32,128]`, exécute `session.run({ input: tensor })`
  - récupère `logits` (`Float32Array`, layout `[T=32, 1, C=11]`)
  - **décodage CTC greedy** (blank = 10) :

    ```ts
    const BLANK = 10;
    const decode = (logits: Float32Array, timesteps: number, numClasses: number): number | null => {
      const digits: number[] = [];
      let previous = -1;
      for (let t = 0; t < timesteps; t++) {
        let best = 0;
        for (let c = 1; c < numClasses; c++) {
          if (logits[t * numClasses + c] > logits[t * numClasses + best]) best = c;
        }
        if (best !== previous && best !== BLANK) digits.push(best);
        previous = best;
      }
      return digits.length ? parseInt(digits.join(''), 10) : null;
    };
    ```

- `index.ts` exporte `new OnnxCrnnAdapter()` comme `digitRecognitionPort`.

### 5. UI (`src/components/AnswerInput/HandwritingInput.tsx`)

Flux « nombre entier, réécriture » :

- L'utilisateur écrit **tout le nombre** sur le canvas.
- Après la pause (debounce `RECOGNIZE_DELAY_MS = 700`) → `recognizeNumber(canvas)` → le résultat
  **remplace** l'affichage (état `recognized: number | null` au lieu de l'accumulation `digits`).
- Bouton **Effacer** (remplace le backspace par-chiffre) : `fillWhite(canvas)` + réinitialise
  `recognized` à `null` et l'erreur.
- **±** (négatif) conservé : toggle `isNegative`.
- **Valider** conservé : soumet `isNegative ? -recognized : recognized`, désactivé si
  `recognized === null` ou en cours de reconnaissance.
- Suppression de l'accumulation `prev + digit` et du `fillWhite` automatique après reconnaissance
  (on garde le tracé visible jusqu'à ce que l'utilisateur efface).
- L'affichage montre `${isNegative ? '−' : ''}${recognized ?? ''}`.

### 6. Tests

- **Adapter** (`OnnxCrnnAdapter.spec.ts`, remplace l'éventuelle spec MNIST) : mock de
  `onnxruntime-web`, fournir des `logits` de séquence factices et vérifier le décodage CTC
  (fusion des doublons, saut du blank, `null` si vide).
- **Préprocessing** (`preprocessing.spec.ts`) : nouvelle fonction `toCrnnInput` — sortie de
  longueur 32×128, valeurs dans [0,1], `null` sur canvas vide, centrage/ratio corrects.
- **HandwritingInput** (`HandwritingInput.spec.tsx`) : nouveau flux — reconnaissance remplace
  l'affichage, Effacer réinitialise, Valider soumet la valeur signée.

## Hors périmètre

- Réentraînement / modification du modèle.
- Changement des autres modes de saisie (`KeyboardInput`, `KeypadInput`).
- Gestion de plus de 3 chiffres (le modèle sort jusqu'à 32 timesteps ; le décodage n'impose pas de
  limite, mais l'entraînement cible ≤ 3 chiffres — aucune contrainte ajoutée côté front).
