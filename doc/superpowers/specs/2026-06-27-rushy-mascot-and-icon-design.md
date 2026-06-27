# Rushy — mascotte Calc Rush & nouvelle icône d'app

**Date** : 2026-06-27
**Statut** : design validé, en attente de revue spec avant plan d'implémentation

## Contexte & objectif

L'icône actuelle (`public/icon.png`, 800 o, 48×48, pictogramme en trait noir) n'a
aucun lien avec l'identité du jeu. Calc Rush est un jeu de **calcul mental
multijoueur en temps réel** ciblant les **enfants**.

Objectif : une icône-signature qui donne envie de jouer, cohérente avec la charte
(indigo + ambre), **et** transformer ce travail en un personnage mascotte
réutilisable dans toute l'app.

## Décisions validées (brainstorming)

- **Concept** : une mascotte (effet d'attachement « à la Duolingo »).
- **Personnage** : une **calculatrice speedy** (jeu de mots « Calc Rush », lue
  immédiatement comme « maths »). Nom : **Rushy**.
- **Production** : SVG flat vectoriel produit en interne (upgrade IA possible plus
  tard sans rejeter l'acquis).
- **Pose de l'icône** : « Coureur joyeux » (`joyeux`).
- **Réutilisation** : on garde plusieurs poses comme bibliothèque + on documente
  les règles de construction pour générer de nouvelles variantes cohérentes.
- **Forme du livrable** : à la fois un **composant React `<Mascot>`** (usage
  in-app) **et** des **PNG statiques** (favicon/PWA — un `<img>`/favicon ne peut
  pas être un composant React).

## La bible de Rushy (règles de construction)

Canvas de référence : `viewBox="0 0 256 256"`. Tokens couleur (= charte
`tailwind.config.js`) :

| Rôle                                                       | Couleur       | Hex       |
| ---------------------------------------------------------- | ------------- | --------- |
| Indigo principal / fond                                    | primary       | `#4f46e5` |
| Indigo foncé / fond bas, jambes, écran-ombre               | primary-dark  | `#312e81` |
| Indigo clair / boutons                                     | primary-light | `#c7d2fe` |
| Ambre / accents (bouche, sourcils, baskets, bouton « go ») | secondary     | `#fbbf24` |
| Slate / écran-visage                                       | slate-800     | `#1e293b` |
| Blanc / corps & mains-gants                                | —             | `#ffffff` |

Anatomie :

- **Corps** : calculatrice, rectangle arrondi blanc (`rx≈24`), penché ~`-8°`.
- **Écran-visage** : rectangle `#1e293b`, yeux blancs à pupilles `#1e293b`, bouche
  et/ou sourcils en ambre. **C'est l'écran qui porte l'expression.**
- **Clavier** : boutons `#c7d2fe` + un bouton « go » ambre allongé.
- **Membres** : bras fins `#312e81` terminés par des mains-gants blanches ; jambes
  `#312e81`, baskets ambre.
- **Décor d'icône** : fond squircle (`rx=60`) en dégradé `#4f46e5`→`#312e81`,
  lignes de vitesse ambre à gauche.

### Catalogue de poses (5)

| Pose (`prop`) | Description                                          | Usage type                           |
| ------------- | ---------------------------------------------------- | ------------------------------------ |
| `joyeux`      | Course, grands yeux, large sourire ouvert, étincelle | **Icône app**, accueil, célébrations |
| `determine`   | Course, sourcils décidés, sourire concentré          | Compétition, départ de partie        |
| `clindoeil`   | Course, un œil qui cligne, sourire en coin           | Astuces, onboarding                  |
| `champion`    | Debout, clin d'œil, pouce levé, éclair ambre         | Podium, victoire                     |
| `tete`        | « Tête » de calculatrice plein cadre, très lisible   | Favicon mini, avatar, logo compact   |

Le **SVG canonique** de chaque pose vit dans le composant `<Mascot>` (source de
vérité versionnée). Les maquettes validées sont archivées dans
`.superpowers/brainstorm/` (gitignoré) le temps de l'implémentation.

## Architecture du livrable

### 1. Composant `<Mascot>`

- Emplacement : `src/components/Mascot/Mascot.tsx` (+ `index.ts` pour l'export).
- Pattern : SVG-dans-`.tsx`, export nommé — calqué sur
  `src/components/streak/StreakBadge.tsx`.
- API :
  ```tsx
  export type MascotPose = 'joyeux' | 'determine' | 'clindoeil' | 'champion' | 'tete';
  interface MascotProps {
    pose?: MascotPose; // défaut 'joyeux'
    size?: number; // px, défaut 256 ; pilote width/height
    className?: string;
    title?: string; // <title> SVG pour l'accessibilité
  }
  ```
- Rendu : un seul `<svg viewBox="0 0 256 256">` ; le corps commun + un sous-arbre
  conditionnel par `pose`. Couleurs en hex de la charte (les SVG ne consomment pas
  directement les tokens Tailwind ; les hex sont la charte).
- Test : `Mascot.spec.tsx` — rend chaque pose sans crash, vérifie le `<title>` et
  un `data-pose`/role pour l'accessibilité.

### 2. Icônes & assets sociaux statiques (besoin initial)

**Principe** : la source est **vectorielle**, donc on rastérise **nativement à
chaque taille cible** (jamais de downscale d'un grand PNG → toujours net). Et on
choisit **la pose selon la taille**, ce qui justifie la bibliothèque de variantes :

- **≤ 48 px (favicon)** → pose `tete` : seule réellement lisible en 16/32 px.
- **≥ 180 px (apple-touch, PWA, social)** → pose `joyeux` : le héros, détaillé.

**Sources SVG** (committées, servent de source de génération et d'assets autonomes) :

- `public/favicon.svg` — pose `tete`, fond inclus. Sert aussi de favicon vectoriel
  pour les navigateurs modernes.
- `public/mascot/rushy-joyeux.svg` — pose `joyeux`, squircle complet.
- `public/og/og-banner.svg` — bannière sociale 1200×630 : Rushy (`joyeux`) +
  logotype « Calc Rush » + tagline, sur fond indigo.

**Génération** : script Node `scripts/generate-mascot-icons.mjs` (devDependencies
`@resvg/resvg-js` pour SVG→PNG à taille exacte + `png-to-ico` pour empaqueter le
`.ico`). Idempotent et réexécutable → régénère tout après une modif du perso.

**Sorties** (tous rastérisés nativement à la taille exacte) :

| Fichier                        | Taille    | Source                                                | Rôle                                              |
| ------------------------------ | --------- | ----------------------------------------------------- | ------------------------------------------------- |
| `public/favicon.svg`           | vectoriel | `tete`                                                | Favicon navigateurs modernes (net partout, ~1 Ko) |
| `public/favicon.ico`           | 16/32/48  | `tete`                                                | Fallback legacy + requête auto `/favicon.ico`     |
| `public/apple-touch-icon.png`  | 180×180   | `joyeux`                                              | Écran d'accueil iOS                               |
| `public/icon-192.png`          | 192×192   | `joyeux`                                              | PWA (`purpose: "any"`)                            |
| `public/icon-512.png`          | 512×512   | `joyeux`                                              | PWA (`purpose: "any"`)                            |
| `public/icon-maskable-512.png` | 512×512   | `joyeux` (perso scalé ~78 % dans la zone de sécurité) | PWA (`purpose: "maskable"`)                       |
| `public/og-image.png`          | 1200×630  | `og-banner.svg`                                       | OG/Twitter (vraie bannière, pas un carré étiré)   |

L'actuel `public/icon.png` est **supprimé** (plus aucune référence après mise à jour).

**Mises à jour** (cf. CLAUDE.md « update all occurrences ») :

- `index.html` :
  - `<link rel="icon" type="image/svg+xml" href="/favicon.svg" />`
  - `<link rel="icon" type="image/x-icon" href="/favicon.ico" sizes="any" />`
  - `<link rel="apple-touch-icon" href="/apple-touch-icon.png" />`
  - `og:image` et `twitter:image` → `https://www.calc-rush.fr/og-image.png`
    (+ `twitter:card` = `summary_large_image`).
- `public/manifest.json` : entrées `icons` = `icon-192.png` (any),
  `icon-512.png` (any), `icon-maskable-512.png` (maskable).

### 3. Documentation

- `doc/mascot.md` : la bible ci-dessus (tokens, anatomie, catalogue, **procédure
  pour ajouter une pose** : dupliquer le sous-arbre, ne changer que le bloc
  visage/pose, ajouter la valeur à `MascotPose`, régénérer l'icône si besoin).
- `doc/index.md` : ajouter une entrée pointant vers `mascot.md`.

## SVG canonique — pose `joyeux` (référence)

```svg
<svg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="rushyBg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#4f46e5"/><stop offset="1" stop-color="#312e81"/>
    </linearGradient>
  </defs>
  <rect width="256" height="256" rx="60" fill="url(#rushyBg)"/>
  <g stroke="#fbbf24" stroke-width="7" stroke-linecap="round" opacity=".9">
    <line x1="18" y1="96" x2="60" y2="96"/><line x1="12" y1="128" x2="66" y2="128"/><line x1="20" y1="160" x2="56" y2="160"/>
  </g>
  <g transform="rotate(-8 128 132)">
    <g stroke="#312e81" stroke-width="14" stroke-linecap="round"><path d="M116 158 L104 190"/><path d="M150 158 L170 184"/></g>
    <ellipse cx="100" cy="194" rx="17" ry="10" fill="#fbbf24"/><ellipse cx="176" cy="188" rx="17" ry="10" fill="#fbbf24"/>
    <path d="M96 118 L72 132" stroke="#312e81" stroke-width="12" stroke-linecap="round"/><circle cx="68" cy="134" r="9" fill="#fff"/>
    <rect x="86" y="54" width="92" height="112" rx="24" fill="#fff"/>
    <path d="M172 116 L196 96" stroke="#312e81" stroke-width="12" stroke-linecap="round"/><circle cx="199" cy="93" r="9" fill="#fff"/>
    <rect x="98" y="68" width="68" height="42" rx="11" fill="#1e293b"/>
    <circle cx="117" cy="86" r="8.5" fill="#fff"/><circle cx="149" cy="86" r="8.5" fill="#fff"/>
    <circle cx="119" cy="87" r="4.4" fill="#1e293b"/><circle cx="151" cy="87" r="4.4" fill="#1e293b"/>
    <path d="M116 98 Q133 116 150 98 Z" fill="#fbbf24"/>
    <g fill="#c7d2fe"><rect x="98" y="122" width="20" height="16" rx="5"/><rect x="122" y="122" width="20" height="16" rx="5"/><rect x="98" y="144" width="20" height="14" rx="5"/><rect x="122" y="144" width="20" height="14" rx="5"/></g>
    <rect x="146" y="122" width="20" height="36" rx="6" fill="#fbbf24"/>
  </g>
  <path d="M196 56 l4 9 9 4 -9 4 -4 9 -4 -9 -9 -4 9 -4 z" fill="#fbbf24"/>
</svg>
```

Les blocs « visage » et « pose » des autres variantes (déterminé, clin d'œil,
champion, tête) sont issus des maquettes validées et seront transcrits dans le
composant lors de l'implémentation.

## Hors périmètre (YAGNI)

- Animation du composant (le perso peut bouger plus tard ; pas pour l'icône).
- Génération IA haute-fidélité (option de secours documentée, non engagée).
- Refonte d'autres assets/illustrations du site.

## Validation

`./scripts/validate.sh` (lint, prettier, `tsc -b`, vitest) doit passer. L'icône
est vérifiée visuellement (rendu 512 et mini 48). Pas de commit de version dans
cette spec — le bump `npm version` + CHANGELOG se feront au moment de l'intégration
(cf. CLAUDE.md « Before push »).
