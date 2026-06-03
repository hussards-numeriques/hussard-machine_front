# Conventions — Patterns et règles de code

## TypeScript

- Mode strict activé — pas de `any` (sauf les deux endroits déjà annotés `eslint-disable` dans `GameClient`)
- Interfaces préférées aux `type` pour les objets de données
- Types partagés dans `src/types.ts`, types locaux à un service dans le fichier du service
- Les props de composants sont déclarées comme `interface` locale dans le fichier du composant

## Composants React

- Fonctionnels uniquement, avec hooks
- Export nommé (pas de `export default` pour les composants)
- Les hooks custom (`useGame`, `useAuth`, etc.) lancent une erreur si utilisés hors de leur Provider

## Pattern port / adapter

Utilisé pour les abstractions avec plusieurs implémentations possibles :

```
feature/
├── port.ts     ← interface TypeScript (contrat)
├── adapter.ts  ← logique de sélection de l'implémentation
├── index.ts    ← export de l'instance/composant résolu
├── ImplA.tsx
└── ImplB.tsx
```

Exemples existants : `AnswerInput/`, `services/digit-recognition/`

À utiliser dès qu'il y a plusieurs implémentations ou que l'implémentation peut changer (device, feature flag, test).

## Styles (Tailwind CSS)

- Classes utilitaires uniquement, pas de CSS custom sauf `App.css` et `index.css`
- Utilitaire `cn()` (clsx + tailwind-merge) pour les classes conditionnelles :
  ```typescript
  import { cn } from '../lib/utils';
  cn('base-class', condition && 'conditional-class', className);
  ```
- Couleurs projet définies dans `tailwind.config.js` : `primary`, `primary-dark`, `secondary`
- Pas de composants Tailwind UI ou de bibliothèque CSS tierce

## Commentaires

Aucun commentaire dans le code. Si une logique doit être expliquée, l'extraire dans une fonction ou un composant bien nommé.

Exception tolérée : directives linter (`// eslint-disable-next-line`).

## Tests

Framework : Vitest + @testing-library/react

- Fichiers de test : `*.spec.ts` ou `*.spec.tsx` à côté du fichier testé
- `src/test-setup.ts` importe `@testing-library/jest-dom` pour les matchers DOM
- `src/test.spec.ts` : test de smoke global
- Les tests de composants avec media queries utilisent `vi.stubGlobal` pour mocker `matchMedia`

## Validation avant commit

```bash
npm run lint         # ESLint
npx prettier --check .
npx tsc --noEmit     # vérification des types
npm run test         # Vitest
```

Ou en une commande : `./scripts/validate.sh`

Le hook pre-commit Husky exécute cette validation automatiquement.

## Variables d'environnement

Toutes les variables d'env doivent être préfixées `VITE_` pour être accessibles dans le code via `import.meta.env.VITE_XXX`.

## Commandes de dev

```bash
npm install          # installation des dépendances
npm run dev          # serveur de développement (Vite)
npm run build        # build de production
npm run test         # tests en mode run (non interactif)
```
