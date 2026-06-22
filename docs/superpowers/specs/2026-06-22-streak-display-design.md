# Streak Display — Design

Date: 2026-06-22
Status: Approved (brainstorming)

## Goal

Afficher la notion de **série quotidienne (daily streak)** pour les joueurs connectés.
Première cible : un composant dans le header, à gauche du bouton username.
Les icônes de flamme doivent être réutilisables ailleurs plus tard (ex. joueurs en
partie, quand l'API exposera le streak par joueur).

La donnée vient de la route back `GET /me/streak` (voir `FRONT_STREAK_CHANGES.md`).

## Data source

Route: `GET /me/streak`, auth `Bearer <token>` (même base URL que `/me/details`,
via `getApiUrl()`).

`StreakResponse`:

```ts
interface StreakResponse {
  current_count: number;        // longueur effective (0 = morte ou aucune série)
  played_today: boolean;        // partie déjà jouée aujourd'hui (point acquis)
  freeze_available_on: string | null; // date de recharge du freeze (YYYY-MM-DD, UTC) ; null = dispo maintenant
}
```

États dérivés (calculés côté front, jamais stockés), conformes au guide back :

```ts
isAlive    = current_count > 0;
freezeReady = freeze_available_on === null;
atRisk     = isAlive && !played_today;
lastChance = atRisk && !freezeReady;
```

## Architecture

### Data layer

- `src/types.ts` : ajout de `StreakResponse`.
- `src/services/AuthClient.ts` : ajout de `fetchStreak(): Promise<StreakResponse>`
  utilisant `authorizedFetch` sur `${getApiUrl()}/me/streak`. `getApiUrl()` suit le
  même pattern que dans `ProfilePage`/`questionCategoryLabels` (base API, pas FastAuth).
- `src/contexts/StreakContext.ts`, `StreakProvider.tsx`, `useStreak.ts` :
  - `StreakProvider` se place **dans** `AuthProvider` (lit `useAuth`).
  - Fetch au mount **uniquement si authentifié** ; re-fetch sur changement d'auth
    (login/logout vide ou recharge l'état).
  - Expose `{ streak: StreakResponse | null, isLoading: boolean, refresh: () => Promise<void> }`.
  - `refresh()` servira plus tard à rafraîchir après une partie.
  - `useStreak()` throw si utilisé hors provider (pattern `useAuth`).

### Lib helper

- `src/lib/daysUntil.ts` : `daysUntil(dateStr: string): number` — nombre de jours
  calendaires entre aujourd'hui (horloge locale, minuit) et la date donnée. Calcul
  côté front pour rester correct même si la réponse est cachée après minuit.
  Testé isolément.

### Composant header — `StreakBadge`

`src/components/streak/StreakBadge.tsx`

- Rendu uniquement si `isAuthenticated` (sinon `null`).
- Placé dans `Header.tsx`, à gauche du bouton username.
- Pilule blanche cohérente avec le bouton username
  (`rounded-full shadow border border-slate-200`), 3 éléments de gauche à droite :
  1. **Valeur** : `current_count`, `font-black`, couleur accordée au palier.
     Masquée si `current_count === 0`.
  2. **Flamme** : `<StreakFlame count={current_count} />` (factory, voir plus bas).
  3. **Icône quête** : `<DailyQuestIcon />` à 3 états.

- Cas `current_count === 0` (morte / aucune série) : état **sourdine** — flamme
  dormante (braise grise éteinte), pas de halo, valeur masquée, icône quête neutre.
  La pilule **reste visible** (donne envie de rallumer la série).

### Icône quête — `DailyQuestIcon`

`src/components/streak/DailyQuestIcon.tsx`

États (props dérivées passées par `StreakBadge`) :

| Condition                     | Apparence                          | Cliquable | Message popover                                                                 |
| ----------------------------- | ---------------------------------- | --------- | ------------------------------------------------------------------------------ |
| `played_today`                | ✓ vert « sécurisé »                | non       | —                                                                              |
| `atRisk && freezeReady`       | cible ambrée douce                 | oui       | « Joue aujourd'hui pour sécuriser ta série ! » (pas de compteur)              |
| `lastChance`                  | cible rouge **pulsante**           | oui       | « Dernière chance… ❄ Filet de sécurité de retour dans N jours. »            |
| `!isAlive` (count 0)          | cible neutre                       | non       | —                                                                              |

- **N** = `daysUntil(freeze_available_on)`.

### Popover

- Géré par `StreakBadge` (ouverture/fermeture, fermeture au clic extérieur — même
  logique que `showUserMenu` dans `Header`).
- Style menu existant : `bg-white rounded-xl shadow-xl border-2 border-slate-100`,
  positionné sous la pilule.
- S'ouvre au clic sur `DailyQuestIcon` quand l'icône est cliquable (risque doux ou
  last chance).

### Factory de flammes — `StreakFlame`

`src/components/streak/StreakFlame/`

```
index.tsx        <StreakFlame count size? animated? /> : choisit le tier via getStreakTier
tiers.ts         table des paliers + getStreakTier(count) + métadonnées (couleurs, nom)
EmberFlame.tsx   1–2 j   : braise faible, orange terne (aussi rendu pour count 0, en sourdine)
OrangeFlame.tsx  3–6 j   : flamme orange franche
AmberFlame.tsx   7–13 j  : flamme ambre + glow doux
BlueFlame.tsx    14–29 j : flamme bleue + particules montantes
VioletFlame.tsx  30–59 j : flamme violette + aura rayonnante
GoldFlame.tsx    60+ j   : flamme dorée animée + couronne, scintillement
```

- Chaque flamme = **SVG custom** (dégradés `linearGradient`/`radialGradient`, pas
  d'emoji), dans son propre fichier réutilisable.
- Props communes : `size?` (défaut adapté au header), `animated?` (défaut `true`).
- Montée d'intensité progressive : couleur → glow → particules → aura →
  couronne + scintillement.
- `animated={false}` désactive les animations (tests et `prefers-reduced-motion`).
- La factory ne dépend que de `count` → réutilisable directement plus tard pour les
  joueurs en partie.

#### Paliers (bornes incluses)

| Palier  | Plage     | Identité visuelle                          |
| ------- | --------- | ------------------------------------------ |
| ember   | 1–2 j     | braise faible, orange terne                |
| orange  | 3–6 j     | flamme orange franche                      |
| amber   | 7–13 j    | flamme ambre + glow doux                   |
| blue    | 14–29 j   | flamme bleue + particules montantes        |
| violet  | 30–59 j   | flamme violette + aura rayonnante          |
| gold    | 60+ j     | flamme dorée animée + couronne, scintille  |

(count 0 → ember en sourdine, géré par `StreakBadge`.)

### Animations

Ajoutées comme keyframes dans `tailwind.config.js` (le projet en a déjà :
`pop-in`, `shake`, `combo-grow`…). Types : vacillement de flamme, pulsation du halo,
particules montantes, scintillement doré, pulsation rouge de l'icône last chance.

## Tests

- `src/lib/daysUntil.spec.ts` : bornes, aujourd'hui, dates passées/futures.
- `src/components/streak/StreakFlame/index.spec.tsx` : la factory rend le bon palier
  par count, bornes incluses ; `count === 0`.
- `src/components/streak/StreakBadge.spec.tsx` : masquage si non-authentifié ;
  états quête (sécurisé / risque doux / last chance) ; cas count 0 ; ouverture du
  popover au clic et contenu (N jours en last chance) ; fermeture au clic extérieur.
- `useStreak` hors provider → throw.
- `matchMedia` mocké si nécessaire (pattern existant).
- Validation finale : `./scripts/validate.sh`.

## Out of scope

- Affichage du streak par joueur pendant une partie (l'API ne le fournit pas encore ;
  la factory `StreakFlame` est conçue pour ce réemploi futur).
- Rafraîchissement automatique après une partie (`refresh()` est exposé mais son
  câblage post-partie n'est pas dans ce lot).
- Modifs SEO (manifest/sitemap inchangés).

## Release

Au commit (conforme à `CLAUDE.md`) : entrée `CHANGELOG.md` + bump `npm version`.
Vérifier `doc/index.md` (potentielle nouvelle page de doc pour la feature streak).
