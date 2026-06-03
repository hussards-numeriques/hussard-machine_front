# Handwriting Input — Design Spec

**Date:** 2026-06-03

## Contexte

Sur mobile et tablette, remplacer l'input texte de `GameView` par une zone de dessin manuscrit où le joueur écrit sa réponse avec le doigt et valide. Sur desktop, l'input texte actuel est conservé.

La reconnaissance de chiffres est encapsulée derrière un port pour permettre de swapper l'implémentation (TF.js → API custom) sans toucher aux composants UI.

---

## Architecture

### Port de reconnaissance de chiffres

```
src/services/digit-recognition/
  port.ts              ← interface DigitRecognitionPort
  TfjsMnistAdapter.ts  ← implémentation TF.js + MNIST
  index.ts             ← exporte l'instance active
```

**`DigitRecognitionPort`** :

```ts
interface DigitRecognitionPort {
  recognize(canvas: HTMLCanvasElement): Promise<number | null>;
}
```

`TfjsMnistAdapter` implémente ce port. Il charge TF.js et le modèle MNIST de manière lazy au premier appel. Il segmente les strokes du canvas par chiffre (groupement par position X), passe chaque chiffre au modèle MNIST, reconstitue le nombre entier. Le signe "-" est détecté séparément.

Pour remplacer par une API custom : créer `MyApiAdapter.ts`, implémenter `DigitRecognitionPort`, changer l'export dans `index.ts`.

---

### Port de composant de saisie

```
src/components/AnswerInput/
  port.ts              ← type AnswerInputProps
  HandwritingInput.tsx ← canvas manuscrit (mobile/tablette)
  KeyboardInput.tsx    ← input texte actuel (desktop)
  adapter.ts           ← détection device
  index.ts             ← exporte useAnswerInput()
```

**`AnswerInputProps`** :

```ts
interface AnswerInputProps {
  onSubmit: (value: number) => void;
  disabled: boolean;
}
```

**Détection device** : `window.matchMedia('(pointer: coarse)')` — pointer tactile = mobile/tablette → `HandwritingInput`, sinon → `KeyboardInput`.

`GameView` remplace son formulaire par :

```tsx
const AnswerInputComponent = useAnswerInput();
<AnswerInputComponent onSubmit={handleSubmit} disabled={hasAnswered} />;
```

---

## HandwritingInput — UX

- Zone canvas pleine largeur, hauteur ~200px, fond blanc, coins arrondis
- Dessin via events `touch` (pointermove/pointerdown/pointerup)
- Deux boutons : **Effacer** (remet canvas à blanc) et **Valider**
- Au tap "Valider" : spinner pendant la reconnaissance (~quelques ms)
- Si reconnaissance réussit : appelle `onSubmit(number)`
- Si reconnaissance échoue (null) : message discret "Impossible de lire, réessaie", canvas intact

---

## Chargement TF.js

- TF.js + modèle MNIST (~3-5MB) chargés uniquement si `HandwritingInput` est monté
- Sur desktop : zéro impact bundle
- Le modèle est gardé en mémoire après le premier chargement (entre les questions)

---

## Ce qui ne change pas

- `GameClient`, `GameContext`, `handleSubmit` dans `GameView` : inchangés
- La valeur soumise est toujours un `number` (integer)
- `KeyboardInput` est l'input texte actuel extrait de `GameView` tel quel
