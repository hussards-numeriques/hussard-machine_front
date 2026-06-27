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
