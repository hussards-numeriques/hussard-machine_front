# Rushy — Mascotte & Icône d'app — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer l'icône générique de Calc Rush par une mascotte « Rushy » (calculatrice speedy), livrée à la fois comme composant React réutilisable et comme jeu complet d'assets statiques (favicon, PWA, bannière sociale) générés depuis une source vectorielle unique.

**Architecture:** Le composant `<Mascot>` (SVG-dans-TSX, source de vérité) expose 5 poses. Un script Node (`tsx`) importe ce composant, rend chaque pose en SVG statique via `react-dom/server`, puis rastérise nativement à chaque taille cible avec `@resvg/resvg-js` (PNG) et `png-to-ico` (favicon.ico). `index.html` et `manifest.json` sont recâblés sur ces assets, l'ancien `icon.png` est supprimé.

**Tech Stack:** React 19 + TypeScript, `react-dom/server` (renderToStaticMarkup), `@resvg/resvg-js`, `png-to-ico`, `tsx`, Vitest.

## Global Constraints

- TypeScript strict, **aucun `any`**. (CLAUDE.md)
- **Aucun commentaire** dans le code sauf directives linter. (CLAUDE.md)
- Composants fonctionnels, **export nommé** (pas d'`export default`). (conventions.md)
- Couleurs charte (verbatim) : primary `#4f46e5`, primary-dark `#312e81`, primary-light `#c7d2fe`, secondary `#fbbf24`, écran-visage `#1e293b`, blanc `#ffffff`.
- Canvas mascotte : `viewBox="0 0 256 256"`.
- Tous les checks passent avant commit : `npm run lint`, `npx prettier --check .`, `npx tsc -b`, `npm run test` (ou `./scripts/validate.sh`). Le hook Husky les rejoue.
- URL de prod pour les balises absolues : `https://www.calc-rush.fr/`.
- `poses.tsx` ne doit importer **que** `react` (aucun import CSS/asset) pour rester importable depuis un script Node.

---

## File Structure

| Fichier                                                                                                                                                                                                          | Responsabilité                                                                                                                                                                       |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/components/Mascot/poses.tsx`                                                                                                                                                                                | Type `MascotPose`, primitives partagées (fond, lignes de vitesse, membres du coureur, boutons), 5 contenus de pose, export des parties réutilisables (`JoyeuxRunner`, `SpeedLines`). |
| `src/components/Mascot/Mascot.tsx`                                                                                                                                                                               | Composant `<Mascot>` : coque `<svg>` + sélection de pose + accessibilité.                                                                                                            |
| `src/components/Mascot/index.ts`                                                                                                                                                                                 | Exports publics (`Mascot`, type `MascotPose`).                                                                                                                                       |
| `src/components/Mascot/Mascot.spec.tsx`                                                                                                                                                                          | Tests de rendu des 5 poses + accessibilité.                                                                                                                                          |
| `src/components/Mascot/SocialAssets.tsx`                                                                                                                                                                         | `MaskableIcon` (512, zone de sécurité) et `OgBanner` (1200×630) — utilisés uniquement par le script de génération.                                                                   |
| `scripts/generate-mascot-icons.tsx`                                                                                                                                                                              | Génère SVG statiques + PNG + ICO dans `public/`.                                                                                                                                     |
| `scripts/assets/Nunito-ExtraBold.ttf`                                                                                                                                                                            | Police vendue (OFL) pour le texte de la bannière OG.                                                                                                                                 |
| `public/favicon.svg`, `public/favicon.ico`, `public/apple-touch-icon.png`, `public/icon-192.png`, `public/icon-512.png`, `public/icon-maskable-512.png`, `public/og-image.png`, `public/mascot/rushy-joyeux.svg` | Assets générés.                                                                                                                                                                      |
| `index.html`, `public/manifest.json`                                                                                                                                                                             | Recâblage des références.                                                                                                                                                            |
| `doc/mascot.md`, `doc/index.md`                                                                                                                                                                                  | Documentation de la bible Rushy.                                                                                                                                                     |
| `CHANGELOG.md`, `package.json`                                                                                                                                                                                   | Release.                                                                                                                                                                             |

---

## Task 1 : Composant `<Mascot>` et ses poses

**Files:**

- Create: `src/components/Mascot/poses.tsx`
- Create: `src/components/Mascot/Mascot.tsx`
- Create: `src/components/Mascot/index.ts`
- Test: `src/components/Mascot/Mascot.spec.tsx`

**Interfaces:**

- Produces:
  - `export type MascotPose = 'joyeux' | 'determine' | 'clindoeil' | 'champion' | 'tete';`
  - `export const Mascot: React.FC<MascotProps>` avec `interface MascotProps { pose?: MascotPose; size?: number; className?: string; title?: string; }` (défaut `pose='joyeux'`, `size=256`).
  - `export const SpeedLines: React.FC` et `export const JoyeuxRunner: React.FC` (consommés par Task 3).
  - `export const POSE_CONTENT: Record<MascotPose, React.ReactNode>`.

- [ ] **Step 1: Écrire le test qui échoue**

`src/components/Mascot/Mascot.spec.tsx` :

```tsx
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Mascot } from './index';
import type { MascotPose } from './index';

const POSES: MascotPose[] = ['joyeux', 'determine', 'clindoeil', 'champion', 'tete'];

describe('Mascot', () => {
  it.each(POSES)('renders the %s pose as an svg with a data-pose marker', (pose) => {
    const { container } = render(<Mascot pose={pose} />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute('data-pose')).toBe(pose);
    expect(svg?.getAttribute('viewBox')).toBe('0 0 256 256');
  });

  it('defaults to the joyeux pose', () => {
    const { container } = render(<Mascot />);
    expect(container.querySelector('svg')?.getAttribute('data-pose')).toBe('joyeux');
  });

  it('exposes an accessible title when provided', () => {
    const { getByTitle } = render(<Mascot title="Rushy la mascotte" />);
    expect(getByTitle('Rushy la mascotte')).toBeTruthy();
  });

  it('applies the requested size to width and height', () => {
    const { container } = render(<Mascot size={128} />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('128');
    expect(svg?.getAttribute('height')).toBe('128');
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `npx vitest run src/components/Mascot/Mascot.spec.tsx`
Expected: FAIL (`Cannot find module './index'`).

- [ ] **Step 3: Écrire `poses.tsx`**

`src/components/Mascot/poses.tsx` :

```tsx
import React from 'react';

export type MascotPose = 'joyeux' | 'determine' | 'clindoeil' | 'champion' | 'tete';

export const SpeedLines: React.FC = () => (
  <g stroke="#fbbf24" strokeWidth="7" strokeLinecap="round" opacity="0.9">
    <line x1="18" y1="96" x2="60" y2="96" />
    <line x1="12" y1="128" x2="66" y2="128" />
    <line x1="20" y1="160" x2="56" y2="160" />
  </g>
);

const IconBackground: React.FC = () => (
  <>
    <defs>
      <linearGradient id="rushyGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#4f46e5" />
        <stop offset="1" stopColor="#312e81" />
      </linearGradient>
    </defs>
    <rect width="256" height="256" rx="60" fill="url(#rushyGrad)" />
  </>
);

const RunnerLimbs: React.FC = () => (
  <>
    <g stroke="#312e81" strokeWidth="14" strokeLinecap="round">
      <path d="M116 158 L104 190" />
      <path d="M150 158 L170 184" />
    </g>
    <ellipse cx="100" cy="194" rx="17" ry="10" fill="#fbbf24" />
    <ellipse cx="176" cy="188" rx="17" ry="10" fill="#fbbf24" />
    <path d="M96 118 L72 132" stroke="#312e81" strokeWidth="12" strokeLinecap="round" />
    <circle cx="68" cy="134" r="9" fill="#fff" />
    <rect x="86" y="54" width="92" height="112" rx="24" fill="#fff" />
  </>
);

const RunnerButtons: React.FC = () => (
  <>
    <g fill="#c7d2fe">
      <rect x="98" y="124" width="20" height="16" rx="5" />
      <rect x="122" y="124" width="20" height="16" rx="5" />
      <rect x="98" y="146" width="20" height="12" rx="5" />
      <rect x="122" y="146" width="20" height="12" rx="5" />
    </g>
    <rect x="146" y="124" width="20" height="34" rx="6" fill="#fbbf24" />
  </>
);

const RunnerScreen: React.FC = () => (
  <rect x="98" y="68" width="68" height="42" rx="11" fill="#1e293b" />
);

const FrontArmHigh: React.FC = () => (
  <>
    <path d="M172 116 L196 96" stroke="#312e81" strokeWidth="12" strokeLinecap="round" />
    <circle cx="199" cy="93" r="9" fill="#fff" />
  </>
);

const FrontArmMid: React.FC = () => (
  <>
    <path d="M172 116 L198 100" stroke="#312e81" strokeWidth="12" strokeLinecap="round" />
    <circle cx="201" cy="98" r="9" fill="#fff" />
  </>
);

const FaceJoyeux: React.FC = () => (
  <>
    <circle cx="117" cy="86" r="8.5" fill="#fff" />
    <circle cx="149" cy="86" r="8.5" fill="#fff" />
    <circle cx="119" cy="87" r="4.4" fill="#1e293b" />
    <circle cx="151" cy="87" r="4.4" fill="#1e293b" />
    <path d="M118 99 Q133 110 148 99 Z" fill="#fbbf24" />
  </>
);

const FaceDetermine: React.FC = () => (
  <>
    <path d="M110 76 L126 80" stroke="#fbbf24" strokeWidth="3.5" strokeLinecap="round" />
    <path d="M154 76 L138 80" stroke="#fbbf24" strokeWidth="3.5" strokeLinecap="round" />
    <circle cx="118" cy="89" r="7" fill="#fff" />
    <circle cx="148" cy="89" r="7" fill="#fff" />
    <circle cx="120" cy="90" r="3.5" fill="#1e293b" />
    <circle cx="150" cy="90" r="3.5" fill="#1e293b" />
    <path
      d="M120 101 Q134 106 148 101"
      stroke="#fbbf24"
      strokeWidth="3.5"
      fill="none"
      strokeLinecap="round"
    />
  </>
);

const FaceClindoeil: React.FC = () => (
  <>
    <circle cx="118" cy="88" r="7.5" fill="#fff" />
    <circle cx="120" cy="89" r="3.8" fill="#1e293b" />
    <path
      d="M140 90 Q149 83 158 90"
      stroke="#fff"
      strokeWidth="4"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M118 100 Q132 108 150 99"
      stroke="#fbbf24"
      strokeWidth="3.8"
      fill="none"
      strokeLinecap="round"
    />
  </>
);

export const JoyeuxRunner: React.FC = () => (
  <g transform="rotate(-8 128 132)">
    <RunnerLimbs />
    <FrontArmHigh />
    <RunnerScreen />
    <FaceJoyeux />
    <RunnerButtons />
  </g>
);

const DetermineRunner: React.FC = () => (
  <g transform="rotate(-8 128 132)">
    <RunnerLimbs />
    <FrontArmMid />
    <RunnerScreen />
    <FaceDetermine />
    <RunnerButtons />
  </g>
);

const ClindoeilRunner: React.FC = () => (
  <g transform="rotate(-8 128 132)">
    <RunnerLimbs />
    <FrontArmMid />
    <RunnerScreen />
    <FaceClindoeil />
    <RunnerButtons />
  </g>
);

const Champion: React.FC = () => (
  <>
    <defs>
      <radialGradient id="rushyGradB" cx="50%" cy="38%" r="75%">
        <stop offset="0" stopColor="#6366f1" />
        <stop offset="1" stopColor="#312e81" />
      </radialGradient>
    </defs>
    <rect width="256" height="256" rx="60" fill="url(#rushyGradB)" />
    <path
      d="M188 36 L150 120 L180 120 L150 196 L210 100 L182 100 Z"
      fill="#fbbf24"
      opacity="0.28"
    />
    <ellipse cx="108" cy="206" rx="15" ry="9" fill="#fbbf24" />
    <ellipse cx="150" cy="206" rx="15" ry="9" fill="#fbbf24" />
    <g stroke="#1e293b" strokeWidth="12" strokeLinecap="round">
      <line x1="110" y1="178" x2="108" y2="198" />
      <line x1="148" y1="178" x2="150" y2="198" />
    </g>
    <g stroke="#312e81" strokeWidth="11" strokeLinecap="round">
      <line x1="170" y1="120" x2="190" y2="92" />
    </g>
    <circle cx="194" cy="86" r="11" fill="#fbbf24" />
    <rect x="84" y="64" width="92" height="116" rx="24" fill="#fff" />
    <rect x="96" y="80" width="68" height="40" rx="11" fill="#1e293b" />
    <circle cx="116" cy="100" r="7.5" fill="#fff" />
    <circle cx="118" cy="101" r="3.6" fill="#1e293b" />
    <path
      d="M138 100 Q146 94 154 100"
      stroke="#fff"
      strokeWidth="4"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M114 112 Q130 122 146 112"
      stroke="#fbbf24"
      strokeWidth="4"
      fill="none"
      strokeLinecap="round"
    />
    <g fill="#c7d2fe">
      <rect x="96" y="132" width="20" height="17" rx="5" />
      <rect x="120" y="132" width="20" height="17" rx="5" />
      <rect x="96" y="156" width="20" height="17" rx="5" />
      <rect x="120" y="156" width="20" height="17" rx="5" />
    </g>
    <rect x="144" y="132" width="20" height="41" rx="6" fill="#fbbf24" />
  </>
);

const Tete: React.FC = () => (
  <>
    <rect width="256" height="256" rx="60" fill="#4f46e5" />
    <rect x="44" y="46" width="168" height="164" rx="36" fill="#fff" />
    <rect x="64" y="64" width="128" height="74" rx="16" fill="#1e293b" />
    <circle cx="104" cy="98" r="11" fill="#fff" />
    <circle cx="152" cy="98" r="11" fill="#fff" />
    <circle cx="107" cy="100" r="5.2" fill="#1e293b" />
    <circle cx="155" cy="100" r="5.2" fill="#1e293b" />
    <path
      d="M100 118 Q128 134 156 118"
      stroke="#fbbf24"
      strokeWidth="6"
      fill="none"
      strokeLinecap="round"
    />
    <path d="M176 70 l5 11 11 5 -11 5 -5 11 -5 -11 -11 -5 11 -5 z" fill="#fbbf24" />
    <g fill="#c7d2fe">
      <rect x="64" y="156" width="26" height="20" rx="6" />
      <rect x="98" y="156" width="26" height="20" rx="6" />
      <rect x="132" y="156" width="26" height="20" rx="6" />
      <rect x="64" y="184" width="26" height="18" rx="6" />
      <rect x="98" y="184" width="26" height="18" rx="6" />
    </g>
    <rect x="166" y="156" width="26" height="46" rx="7" fill="#fbbf24" />
  </>
);

const Sparkle: React.FC = () => (
  <path d="M196 56 l4 9 9 4 -9 4 -4 9 -4 -9 -9 -4 9 -4 z" fill="#fbbf24" />
);

export const POSE_CONTENT: Record<MascotPose, React.ReactNode> = {
  joyeux: (
    <>
      <IconBackground />
      <SpeedLines />
      <JoyeuxRunner />
      <Sparkle />
    </>
  ),
  determine: (
    <>
      <IconBackground />
      <SpeedLines />
      <DetermineRunner />
    </>
  ),
  clindoeil: (
    <>
      <IconBackground />
      <SpeedLines />
      <ClindoeilRunner />
    </>
  ),
  champion: <Champion />,
  tete: <Tete />,
};
```

- [ ] **Step 4: Écrire `Mascot.tsx`**

`src/components/Mascot/Mascot.tsx` :

```tsx
import React from 'react';
import { POSE_CONTENT, type MascotPose } from './poses';

interface MascotProps {
  pose?: MascotPose;
  size?: number;
  className?: string;
  title?: string;
}

export const Mascot: React.FC<MascotProps> = ({
  pose = 'joyeux',
  size = 256,
  className,
  title,
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 256 256"
    width={size}
    height={size}
    className={className}
    data-pose={pose}
    role="img"
    aria-label={title ?? 'Rushy'}
  >
    {title ? <title>{title}</title> : null}
    {POSE_CONTENT[pose]}
  </svg>
);
```

- [ ] **Step 5: Écrire `index.ts`**

`src/components/Mascot/index.ts` :

```ts
export { Mascot } from './Mascot';
export { SpeedLines, JoyeuxRunner, POSE_CONTENT } from './poses';
export type { MascotPose } from './poses';
```

- [ ] **Step 6: Lancer le test pour vérifier qu'il passe**

Run: `npx vitest run src/components/Mascot/Mascot.spec.tsx`
Expected: PASS (8 tests : 5 poses + défaut + titre + taille).

- [ ] **Step 7: Valider lint + types + format**

Run: `npm run lint && npx tsc -b && npx prettier --check src/components/Mascot`
Expected: aucun warning. Si prettier signale un format, lancer `npx prettier --write src/components/Mascot`.

- [ ] **Step 8: Commit**

```bash
git add src/components/Mascot
git commit -m "feat: add Rushy mascot component with 5 poses

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2 : Compositions sociales (`MaskableIcon`, `OgBanner`)

**Files:**

- Create: `src/components/Mascot/SocialAssets.tsx`

**Interfaces:**

- Consumes (Task 1) : `SpeedLines`, `JoyeuxRunner` depuis `./poses`.
- Produces : `export const MaskableIcon: React.FC` (svg 512×512, fond plein bord, perso dans la zone de sécurité) et `export const OgBanner: React.FC` (svg 1200×630, Rushy + wordmark « Calc Rush »).

Pas de test unitaire dédié (composants purement présentationnels consommés par le script ; leur rendu réel est vérifié à la Task 3 via les dimensions PNG). On valide seulement la compilation.

- [ ] **Step 1: Écrire `SocialAssets.tsx`**

`src/components/Mascot/SocialAssets.tsx` :

```tsx
import React from 'react';
import { SpeedLines, JoyeuxRunner } from './poses';

export const MaskableIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
    <defs>
      <linearGradient id="rushyGradMask" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#4f46e5" />
        <stop offset="1" stopColor="#312e81" />
      </linearGradient>
    </defs>
    <rect width="512" height="512" fill="url(#rushyGradMask)" />
    <g transform="translate(51.2 51.2) scale(1.6)">
      <SpeedLines />
      <JoyeuxRunner />
    </g>
  </svg>
);

export const OgBanner: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
    <defs>
      <linearGradient id="rushyGradOg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#4f46e5" />
        <stop offset="1" stopColor="#312e81" />
      </linearGradient>
    </defs>
    <rect width="1200" height="630" fill="url(#rushyGradOg)" />
    <g stroke="#fbbf24" strokeWidth="10" strokeLinecap="round" opacity="0.7">
      <line x1="60" y1="120" x2="160" y2="120" />
      <line x1="40" y1="170" x2="190" y2="170" />
    </g>
    <g transform="translate(150 120) scale(1.45)">
      <SpeedLines />
      <JoyeuxRunner />
    </g>
    <text x="560" y="300" fontFamily="Nunito" fontWeight="800" fontSize="120" fill="#ffffff">
      Calc Rush
    </text>
    <text x="562" y="370" fontFamily="Nunito" fontWeight="700" fontSize="44" fill="#fbbf24">
      Le calcul mental qui rush
    </text>
    <text x="562" y="430" fontFamily="Nunito" fontWeight="600" fontSize="34" fill="#c7d2fe">
      Défie tes amis · gagne des niveaux
    </text>
  </svg>
);
```

- [ ] **Step 2: Vérifier la compilation et le format**

Run: `npx tsc -b && npm run lint && npx prettier --check src/components/Mascot/SocialAssets.tsx`
Expected: OK (sinon `npx prettier --write`).

- [ ] **Step 3: Commit**

```bash
git add src/components/Mascot/SocialAssets.tsx
git commit -m "feat: add maskable icon and social banner compositions

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3 : Script de génération + dépendances + assets

**Files:**

- Modify: `package.json` (devDependencies + script `generate:icons`)
- Create: `scripts/generate-mascot-icons.tsx`
- Create: `scripts/assets/Nunito-ExtraBold.ttf` (vendu)
- Génère: `public/favicon.svg`, `public/favicon.ico`, `public/apple-touch-icon.png`, `public/icon-192.png`, `public/icon-512.png`, `public/icon-maskable-512.png`, `public/og-image.png`, `public/mascot/rushy-joyeux.svg`

**Interfaces:**

- Consumes : `Mascot` (Task 1), `MaskableIcon`, `OgBanner` (Task 2).
- Produces : commande `npm run generate:icons` idempotente écrivant tous les assets ci-dessus.

- [ ] **Step 1: Installer les dépendances de génération**

```bash
npm install -D @resvg/resvg-js png-to-ico tsx
```

Expected: `package.json` gagne `@resvg/resvg-js`, `png-to-ico`, `tsx` en `devDependencies`.

- [ ] **Step 2: Vendre la police Nunito (OFL) pour le texte OG**

```bash
mkdir -p scripts/assets
curl -fsSL -o scripts/assets/Nunito-ExtraBold.ttf \
  "https://raw.githubusercontent.com/google/fonts/main/ofl/nunito/Nunito%5Bwght%5D.ttf"
```

Expected: fichier TTF non vide (`test -s scripts/assets/Nunito-ExtraBold.ttf`). Si le réseau est indisponible, fallback : retirer le bloc `font` du script (Step 3) et le texte OG sera rendu avec la police système par défaut (acceptable mais hors-charte).

- [ ] **Step 3: Écrire le script de génération**

`scripts/generate-mascot-icons.tsx` :

```tsx
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Resvg } from '@resvg/resvg-js';
import pngToIco from 'png-to-ico';
import { Mascot } from '../src/components/Mascot/Mascot';
import { MaskableIcon, OgBanner } from '../src/components/Mascot/SocialAssets';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pub = (p: string) => resolve(root, 'public', p);
const fontPath = resolve(root, 'scripts/assets/Nunito-ExtraBold.ttf');

const XML_HEADER = '<?xml version="1.0" encoding="UTF-8"?>\n';

const svgOf = (node: React.ReactElement): string => XML_HEADER + renderToStaticMarkup(node);

const fontOption = { fontFiles: [fontPath], defaultFontFamily: 'Nunito', loadSystemFonts: false };

const pngFrom = (svg: string, width: number, withFont = false): Buffer => {
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: width },
    ...(withFont ? { font: fontOption } : {}),
  });
  return resvg.render().asPng();
};

const writeFile = (relPath: string, data: string | Buffer) => {
  const full = pub(relPath);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, data);
  console.log('wrote', relPath);
};

const main = async () => {
  const faviconSvg = svgOf(<Mascot pose="tete" title="Calc Rush" />);
  const joyeuxSvg = svgOf(<Mascot pose="joyeux" title="Rushy" />);
  const maskableSvg = svgOf(<MaskableIcon />);
  const ogSvg = svgOf(<OgBanner />);

  writeFile('favicon.svg', faviconSvg);
  writeFile('mascot/rushy-joyeux.svg', joyeuxSvg);

  writeFile('apple-touch-icon.png', pngFrom(joyeuxSvg, 180));
  writeFile('icon-192.png', pngFrom(joyeuxSvg, 192));
  writeFile('icon-512.png', pngFrom(joyeuxSvg, 512));
  writeFile('icon-maskable-512.png', pngFrom(maskableSvg, 512));
  writeFile('og-image.png', pngFrom(ogSvg, 1200, true));

  const ico = await pngToIco([
    pngFrom(faviconSvg, 16),
    pngFrom(faviconSvg, 32),
    pngFrom(faviconSvg, 48),
  ]);
  writeFile('favicon.ico', ico);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 4: Ajouter le script npm**

Dans `package.json`, section `scripts`, ajouter :

```json
"generate:icons": "tsx scripts/generate-mascot-icons.tsx"
```

- [ ] **Step 5: Lancer la génération**

Run: `npm run generate:icons`
Expected (stdout) : 8 lignes `wrote ...` ; aucune erreur.

- [ ] **Step 6: Vérifier les fichiers et leurs dimensions**

Run:

```bash
node -e '
const fs=require("fs");
const dim=(f)=>{const b=fs.readFileSync("public/"+f);return [b.readUInt32BE(16),b.readUInt32BE(20)];};
for (const [f,w] of [["icon-192.png",192],["icon-512.png",512],["icon-maskable-512.png",512],["apple-touch-icon.png",180],["og-image.png",1200]]) {
  const [W,H]=dim(f); if (W!==w) throw new Error(f+" largeur "+W+" != "+w); console.log(f, W+"x"+H);
}
for (const f of ["favicon.svg","favicon.ico","mascot/rushy-joyeux.svg"]) {
  if (!fs.statSync("public/"+f).size) throw new Error(f+" vide"); console.log(f, "ok");
}
'
```

Expected : `icon-192.png 192x192`, `icon-512.png 512x512`, `icon-maskable-512.png 512x512`, `apple-touch-icon.png 180x180`, `og-image.png 1200x630`, puis `favicon.svg ok`, `favicon.ico ok`, `mascot/rushy-joyeux.svg ok`.

- [ ] **Step 7: Inspection visuelle**

Ouvrir `public/og-image.png`, `public/icon-512.png` et `public/favicon.svg`. Vérifier : Rushy net, couleurs charte, texte « Calc Rush » lisible sur la bannière, tête bien centrée dans le favicon.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json scripts public/favicon.svg public/favicon.ico public/apple-touch-icon.png public/icon-192.png public/icon-512.png public/icon-maskable-512.png public/og-image.png public/mascot
git commit -m "feat: generate Rushy icon and social assets from the mascot component

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4 : Recâbler `index.html` et `manifest.json`, supprimer l'ancienne icône

**Files:**

- Modify: `index.html:15-16`, `index.html:26`, `index.html:37`
- Modify: `public/manifest.json`
- Delete: `public/icon.png`

**Interfaces:**

- Consumes : les assets générés à la Task 3.

- [ ] **Step 1: Mettre à jour les balises d'icône de `index.html`**

Remplacer les deux lignes existantes :

```html
<link rel="icon" type="image/png" href="/icon.png" />
<link rel="apple-touch-icon" href="/icon.png" />
```

par :

```html
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link rel="icon" type="image/x-icon" href="/favicon.ico" sizes="any" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
```

- [ ] **Step 2: Mettre à jour les balises sociales de `index.html`**

Remplacer `https://www.calc-rush.fr/icon.png` par `https://www.calc-rush.fr/og-image.png` dans les balises `og:image` (ligne 26) **et** `twitter:image` (ligne 37). Vérifier/positionner aussi `twitter:card` à `summary_large_image` (l'ajouter s'il est absent, à côté de `twitter:image`).

- [ ] **Step 3: Mettre à jour `public/manifest.json`**

Remplacer le tableau `icons` actuel (entrée unique 48×48) par :

```json
"icons": [
  { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
  { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
  { "src": "/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
]
```

- [ ] **Step 4: Supprimer l'ancienne icône**

```bash
git rm public/icon.png
```

- [ ] **Step 5: Vérifier qu'aucune référence à l'ancien `icon.png` ne subsiste**

Run: `grep -rn "icon.png" index.html public/ src/`
Expected : aucune occurrence de `"/icon.png"` ou `icon.png` (uniquement les nouveaux `icon-192.png`, etc., qui contiennent `icon-`). Si une référence résiduelle apparaît, la corriger.

- [ ] **Step 6: Vérifier le build et le format**

Run: `npx tsc -b && npx vite build && npx prettier --check index.html public/manifest.json`
Expected : build OK, prettier OK (sinon `npx prettier --write`).

- [ ] **Step 7: Commit**

```bash
git add index.html public/manifest.json
git commit -m "feat: wire favicon, PWA icons and social banner; drop legacy icon.png

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5 : Documentation (`doc/mascot.md` + index)

**Files:**

- Create: `doc/mascot.md`
- Modify: `doc/index.md`

**Interfaces:** aucune (documentation).

- [ ] **Step 1: Écrire `doc/mascot.md`**

Contenu (la bible) :

````markdown
# Rushy — la mascotte

Rushy est une calculatrice speedy, mascotte de Calc Rush. Source de vérité : le
composant `src/components/Mascot/`. Les assets statiques (favicon, PWA, bannière
OG) sont **générés** depuis ce composant — ne jamais les éditer à la main.

## Composant

```tsx
import { Mascot } from '../components/Mascot';

<Mascot pose="joyeux" size={96} title="Rushy" />;
```

Props : `pose?` (défaut `joyeux`), `size?` (px, défaut 256), `className?`, `title?`.

## Poses

| `pose`      | Usage                                                   |
| ----------- | ------------------------------------------------------- |
| `joyeux`    | Icône de l'app, accueil, célébrations                   |
| `determine` | Compétition, départ de partie                           |
| `clindoeil` | Astuces, onboarding                                     |
| `champion`  | Podium, victoire                                        |
| `tete`      | Favicon, avatar, logo compact (le plus lisible en mini) |

## Charte (tokens = `tailwind.config.js`)

primary `#4f46e5` · primary-dark `#312e81` · primary-light `#c7d2fe` ·
secondary `#fbbf24` · écran-visage `#1e293b` · blanc `#ffffff`.

## Anatomie

Canvas `viewBox="0 0 256 256"`. Corps = calculatrice arrondie blanche penchée
~-8°. Écran `#1e293b` portant l'expression (yeux blancs, bouche/sourcils ambre).
Boutons `#c7d2fe` + un bouton « go » ambre. Bras/jambes `#312e81`, mains-gants
blanches, baskets ambre. Fond d'icône : dégradé `#4f46e5`→`#312e81` + lignes de
vitesse ambre.

## Ajouter une pose

1. Dans `src/components/Mascot/poses.tsx`, réutiliser `RunnerLimbs`, `SpeedLines`,
   `RunnerButtons` et ne dessiner que le nouveau visage/la nouvelle pose.
2. Ajouter la valeur à `MascotPose` et à `POSE_CONTENT`.
3. Ajouter un cas au test `Mascot.spec.tsx`.

## Régénérer les assets

Après toute modif du composant :

```bash
npm run generate:icons
```

Écrit dans `public/` : `favicon.svg`, `favicon.ico`, `apple-touch-icon.png`,
`icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `og-image.png`,
`mascot/rushy-joyeux.svg`. Vérifier visuellement puis committer.
````

- [ ] **Step 2: Ajouter l'entrée dans `doc/index.md`**

Dans la section « Feature index » de `doc/index.md`, ajouter (après l'entrée `streak.md`) :

```markdown
### [mascot.md](mascot.md)

Rushy, la mascotte (calculatrice speedy) : composant `<Mascot>` et ses 5 poses,
charte/anatomie, et le pipeline de génération des assets statiques (favicon, PWA,
bannière OG) via `npm run generate:icons`.
→ Read when: afficher la mascotte dans l'app, ajouter une pose, ou régénérer les icônes.
```

- [ ] **Step 3: Vérifier le format**

Run: `npx prettier --check doc/mascot.md doc/index.md`
Expected : OK (sinon `npx prettier --write doc/mascot.md doc/index.md`).

- [ ] **Step 4: Commit**

```bash
git add doc/mascot.md doc/index.md
git commit -m "docs: add Rushy mascot bible and doc index entry

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6 : Release (version + CHANGELOG)

**Files:**

- Modify: `CHANGELOG.md`
- Modify: `package.json` (via `npm version`)

**Interfaces:** aucune.

- [ ] **Step 1: Vérifier la suite complète**

Run: `./scripts/validate.sh`
Expected : lint + prettier + `tsc -b` + tests OK.

- [ ] **Step 2: Ajouter l'entrée CHANGELOG**

Dans `CHANGELOG.md`, ajouter en tête une entrée pour la version mineure à venir (la mascotte est une nouvelle feature), au format des entrées existantes :

```markdown
## [0.8.0] - 2026-06-27

### Added

- Mascotte « Rushy » (calculatrice speedy) : composant `<Mascot>` réutilisable (5 poses).
- Nouveau jeu d'icônes généré depuis le composant : favicon SVG + ICO, icônes PWA
  192/512 + maskable, bannière sociale OG 1200×630.

### Changed

- `index.html` et `manifest.json` recâblés sur les nouveaux assets.

### Removed

- Ancienne `public/icon.png` générique.
```

(Adapter le numéro de version au `package.json` courant : prochaine mineure.)

- [ ] **Step 3: Vérifier le format du CHANGELOG**

Run: `npx prettier --check CHANGELOG.md`
Expected : OK (sinon `npx prettier --write CHANGELOG.md`).

- [ ] **Step 4: Commit du CHANGELOG**

```bash
git add CHANGELOG.md
git commit -m "docs: changelog for Rushy mascot and new app icons

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

- [ ] **Step 5: Bump de version**

Run: `npm version minor`
Expected : `package.json` passe à la mineure suivante et un commit/tag de version est créé. (Ne pas pousser ; le push reste à la main de l'utilisateur.)

- [ ] **Step 6: Vérification finale**

Run: `git status && git log --oneline -8`
Expected : arbre propre, historique cohérent des 6 tâches. Sitemap inchangé (aucune nouvelle page).

---

## Self-Review (effectuée)

- **Couverture spec :** composant `<Mascot>` (T1) ✓ ; 5 poses bibliothèque (T1) ✓ ; assets statiques natifs par taille + favicon svg/ico + apple-touch + PWA any/maskable + OG 1200×630 (T2/T3) ✓ ; suppression `icon.png` (T4) ✓ ; maj `index.html`/`manifest.json` (T4) ✓ ; doc bible + index (T5) ✓ ; release/CHANGELOG/version (T6) ✓.
- **Placeholders :** aucun — tout le code (composant, script, édits) est fourni en entier.
- **Cohérence des types :** `MascotPose`, `POSE_CONTENT`, `Mascot`, `SpeedLines`, `JoyeuxRunner`, `MaskableIcon`, `OgBanner` portent les mêmes noms entre tâches productrices et consommatrices.
- **Hors périmètre (YAGNI) :** animation, génération IA, placement in-app de `<Mascot>` (le composant est livré comme bibliothèque pour usage ultérieur).
- **Risque connu :** le texte OG dépend de la police vendue à la Task 3 Step 2 ; fallback documenté si le réseau est indisponible.
