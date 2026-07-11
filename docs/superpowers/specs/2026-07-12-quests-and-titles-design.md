# Quêtes & Titres — Design

Date: 2026-07-12
Status: Approved (brainstorming)

## Goal

Afficher un **titre cosmétique** (raretés `BRONZE`/`SILVER`/`GOLD`/`DIAMOND`) équipé par
le joueur, visible des autres pendant une partie (lobby + podium), et donner accès à
une page dédiée où le joueur consulte sa progression sur les **quêtes** qui débloquent
ces titres et choisit lequel arborer.

Contrat back : voir `CONTRAT-FRONT-quetes-titres.md` (non commité) — 3 routes REST
(`GET /quests`, `GET /me/titles`, `PUT /me/selected-title`) + un champ `title` ajouté
aux objets `player` déjà reçus en WS (`PLAYER_JOINED`, `GAME_UPDATE`), au même titre
que `level`/`grade`/`daily_streak`.

Pas d'event WS de déblocage : le déblocage se détecte côté front par diff sur
`GET /me/titles` entre l'entrée en partie et le podium (voir §6).

## Data source

### `GET /quests` — catalogue public, sans auth, cache navigateur 7 jours

```ts
interface QuestTitle {
  id: string;
  label: string;
  rarity: string; // liste ouverte : BRONZE | SILVER | GOLD | DIAMOND connues aujourd'hui
}
interface QuestTier {
  threshold: number;
  title: QuestTitle;
}
interface Quest {
  id: string;
  label: string;
  tiers: QuestTier[];
}
type QuestCatalog = Quest[];
```

### `GET /me/titles` — auth requise, propre au joueur, non cacheable

```ts
interface MyTitle {
  id: string;
  label: string;
  rarity: string;
  unlocked_at: string; // ISO 8601
}
interface MyQuestTier {
  threshold: number;
  title_id: string;
  unlocked: boolean;
}
interface MyQuest {
  id: string;
  label: string;
  progress: number;
  tiers: MyQuestTier[];
}
interface MyTitlesResponse {
  selected_title_id: string | null;
  titles: MyTitle[];
  quests: MyQuest[];
}
```

Erreurs : `401` token invalide, `404` compte introuvable (même sémantique que
`fetchPlayerProfile`).

### `PUT /me/selected-title` — auth requise

Requête `{ title_id: string | null }`. Réponse `{ selected_title_id: string | null }`.

Le front ne laisse jamais taper un `title_id` arbitraire : l'UI de sélection est
filtrée sur `MyTitlesResponse.titles` (règle explicite du contrat, le `400` backend
n'est pas utilisé pour l'UX).

## Architecture

### Types partagés — `src/types.ts`

```ts
export interface PlayerTitle {
  id: string;
  label: string;
  rarity: string;
}
```

`Player.title: PlayerTitle | null` ajouté à l'interface `Player`.

### Validation WS — `src/services/gameSchemas.ts`

```ts
const titleSchema = z.object({
  id: z.string(),
  label: z.string(),
  rarity: z.string(),
}) satisfies z.ZodType<PlayerTitle>;
```

`playerSchema` gagne `title: titleSchema.nullable()`.

### Lib domaine — `src/lib/titles.ts` (miroir de `src/lib/grades.ts`)

```ts
export const RARITIES = ['BRONZE', 'SILVER', 'GOLD', 'DIAMOND'] as const;
export type Rarity = (typeof RARITIES)[number];

export const resolveRarityLabel: (rarity: string) => string;
export const resolveRarityTextColor: (rarity: string) => string; // couleur du texte de la pastille
export const resolveRarityBadgeStyle: (rarity: string) => string; // bg/text/border, pour la page /quests
export const DEFAULT_RARITY_TEXT_COLOR: string;
export const DEFAULT_RARITY_BADGE_STYLE: string;
```

Palette calquée sur `lib/grades.ts` (BRONZE = ambre, SILVER = slate, GOLD = jaune,
DIAMOND = cyan) pour rester visuellement cohérent avec le système de grade existant.
Toute rareté inconnue retombe sur le style par défaut (liste ouverte, comme
`resolveGradeLabel` gère une valeur hors `GRADES`).

### Couche service — `src/services/quests/` (port/adapter, calqué sur `src/services/streak/`)

```
port.ts                  → types (QuestCatalog, MyTitlesResponse, MyTitle, MyQuest,
                            AuthorizedFetch) + interface QuestsRepository
HttpQuestsAdapter.ts      → implémentation HTTP
HttpQuestsAdapter.spec.ts
index.ts                  → instance résolue + ré-exports
```

**`port.ts`**

```ts
export interface QuestsRepository {
  fetchCatalog(): Promise<QuestCatalog>;
  fetchMyTitles(authorizedFetch: AuthorizedFetch): Promise<MyTitlesResponse>;
  selectTitle(authorizedFetch: AuthorizedFetch, titleId: string | null): Promise<string | null>;
}
```

**`HttpQuestsAdapter.ts`** — `getApiUrl()` (même pattern que `HttpStreakAdapter`) :

- `fetchCatalog()` : `GET /quests`, pas d'`authorizedFetch` (route publique) — throw si
  non-OK, parse + valide avec un schéma zod dérivé du type `QuestCatalog`.
- `fetchMyTitles(authorizedFetch)` : `GET /me/titles`.
- `selectTitle(authorizedFetch, titleId)` : `PUT /me/selected-title`, body
  `{ title_id: titleId }`, `Content-Type: application/json`, retourne
  `selected_title_id` de la réponse.

**`index.ts`** : `export const questsRepository: QuestsRepository = new HttpQuestsAdapter();`
+ ré-export des types.

### Hooks TanStack Query — `src/hooks/useQuests.ts`

```ts
export const useQuestCatalog = () =>
  useQuery({ queryKey: ['quests-catalog'], queryFn: questsRepository.fetchCatalog, staleTime: Infinity });

export const useMyTitles = () => {
  const { client, isAuthenticated, isLoading } = useAuth();
  return useQuery({
    queryKey: ['my-titles'],
    queryFn: () => questsRepository.fetchMyTitles((i, init) => client.authorizedFetch(i, init)),
    enabled: isAuthenticated && !isLoading,
  });
};

export const useSelectTitle = () => {
  const { client } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (titleId: string | null) =>
      questsRepository.selectTitle((i, init) => client.authorizedFetch(i, init), titleId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-titles'] }),
  });
};
```

Pas de `Context`/`Provider` dédié : contrairement au streak (affiché en permanence
dans le `Header`), les titres ne sont consommés que par la page `/quests` et par la
détection de déblocage (§6) — un hook `useQuery` suffit, réutilisé partout où
`['my-titles']` est nécessaire (React Query dédoublonne déjà les requêtes concurrentes
sur la même clé).

## Affichage en jeu (lobby + podium)

### `src/components/PlayerTitle.tsx` (miroir de `PlayerStreak.tsx`)

```ts
interface PlayerTitleProps {
  title: PlayerTitle | null;
  className?: string;
}
```

Rend `null` si `title === null`. Sinon une ligne compacte `☆ {label}`, `text-xs
font-bold truncate`, colorée via `resolveRarityTextColor(title.rarity)`.

### `LobbyView`

Dans la carte joueur, sous la ligne nom + `PlayerStreak`, au-dessus de la ligne de
statut (« Humain »/« Robot »/« Déconnecté ») :

```
(Avatar) Nom            🔥 12
         ☆ Légende de l'Arène
         Humain
```

### `PodiumView`

- **Colonnes top-3** : titre **non affiché** (même règle que le ring de grade, déjà
  masqué sur ces colonnes — espace contraint, labels de titre potentiellement longs).
- **Classement complet** : la ligne joueur passe d'un simple `flex` horizontal à une
  colonne pour le bloc nom, afin de loger le titre en dessous :

```
1.  (Av) Nom          🔥 12          240 pts
        ☆ Légende de l'Arène
```

## Page `/quests`

### Routing

- `src/App.tsx` : `<Route path="quests" element={<QuestsPage />} />` sous `AppLayout`.
- `src/components/Header.tsx` : lien « Quêtes & Titres » ajouté dans le menu
  utilisateur, entre « Mon profil » et « Se déconnecter » (même style que le lien
  profil, visible uniquement quand `isAuthenticated`).

### `src/pages/QuestsPage.tsx`

- Garde d'auth identique à `ProfilePage` (`ProfileNotice`-like : message + lien retour
  si `!isAuthenticated`, état de chargement si `authLoading`).
- Layout "long content" (`min-h-screen p-4 pt-20 max-w-2xl mx-auto space-y-6`, carte
  `bg-white rounded-3xl shadow-lg border-2 border-slate-100 p-8 space-y-6`), cohérent
  avec `ProgressionPage`/`ProfilePage`.
- `useQuestCatalog()` + `useMyTitles()` : pour chaque `Quest` du catalogue, on
  retrouve la `MyQuest` correspondante par `id` (toujours présente, `progress: 0` et
  tous les paliers `unlocked: false` si le joueur n'a rien commencé — pas d'état
  "non démarré" séparé côté back).
- `src/components/quests/QuestProgressCard.tsx` (un par quête) :
  - En-tête : label de la quête + `progress` courant.
  - Un `QuestTierRow` par palier (croisement `QuestTier` catalogue ×
    `MyQuestTier.unlocked`) :
    - Verrouillé : pastille vide, label + seuil grisés, pas d'action.
    - Débloqué, non équipé : pastille pleine, label, bouton **Équiper**.
    - Débloqué, équipé (`title.id === selected_title_id`) : bouton **✓ Équipé**
      (cliquer déséquipe → `useSelectTitle().mutate(null)`).
  - `useSelectTitle().mutate(tierTitleId)` sur clic « Équiper ».
- États de chargement/erreur : squelette simple pendant le chargement, message
  d'erreur générique si `useMyTitles()` échoue (pattern `profileErrorMessage`).

## Toast « titre débloqué »

Recette du contrat backend (§5) : pas d'event serveur, détection par diff côté front.

### `src/hooks/useTitleUnlocks.ts`

```ts
function useTitleUnlocks(gameState: GameState | null, gameId: string | undefined): MyTitle[]
```

- S'appuie sur `useMyTitles()` (même clé de cache `['my-titles']`, pas de requête
  dupliquée si la page `/quests` est ouverte ailleurs).
- Maintient un snapshot (`Set<string>` des `id` de `titles[]`) :
  - Remis à zéro à chaque changement de `gameId` (nouvelle partie).
  - Mis à jour en continu tant que `gameState` est `WAITING`/`COUNTDOWN` (capture
    l'état "connu" le plus proche du début de partie).
  - Gelé dès que `gameState` passe à `IN_PROGRESS`.
- Quand `gameState` devient `FINISHED` : `refetch()` de `['my-titles']`, diff contre
  le snapshot gelé. Si aucun nouvel `id`, un seul retry après ~1.5s (le calcul backend
  est asynchrone best-effort, quelques centaines de ms à quelques secondes).
- Retourne la liste des `MyTitle` nouvellement débloqués (vide si non authentifié —
  les invités n'ont jamais de titres).

### Câblage

- `GamePage` appelle `useTitleUnlocks(game?.state ?? null, game?.id)` et passe le
  résultat en prop `newTitles: MyTitle[]` à `PodiumView`.
- `src/components/quests/TitleUnlockToast.tsx` : reçoit `newTitles`, affiche un toast
  empilé par titre (« Titre débloqué : {label} ({rareté}) »), coloré via
  `resolveRarityBadgeStyle`, auto-dismiss après quelques secondes (pattern déjà présent
  ailleurs dans le projet pour les feedbacks temporaires — `AnswerFeedbackPop`).

## Tests

- `src/lib/titles.spec.ts` : résolution rareté connue/inconnue (label, couleurs,
  fallback).
- `src/services/quests/HttpQuestsAdapter.spec.ts` : bonnes URLs/méthodes, parsing,
  throw si non-OK, pour les 3 appels.
- `src/hooks/useTitleUnlocks.spec.ts` : snapshot capturé en lobby, gelé en jeu, diff
  correct au podium, retry unique si rien de nouveau au premier essai, reset sur
  changement de `gameId`, tableau vide si non authentifié.
- `src/components/PlayerTitle.spec.tsx` : `null` si `title === null`, rendu sinon.
- `src/components/quests/TitleUnlockToast.spec.tsx` : rendu par titre, auto-dismiss.
- Validation finale : `./scripts/validate.sh`.

## Out of scope

- Icônes/illustrations dédiées par rareté (texte + couleur seulement, comme la
  première itération du streak avant raffinement visuel).
- Titre affiché dans le `Header` en dehors d'une partie (non demandé — seulement
  lobby, podium, page `/quests`).
- Notifications de déblocage hors podium (ex. push, email) — hors périmètre front.
- Historique des titres débloqués dans le temps au-delà de ce qu'expose déjà
  `GET /me/titles`.

## Release

Au commit (conforme à `CLAUDE.md`) : entrée `CHANGELOG.md` + bump `npm version`.
Mettre à jour `doc/index.md` (nouvelle page `doc/quests-titles.md` recommandée, sur le
modèle de `doc/streak.md`) + `doc/game-views.md` (section "Player vitrine") +
`doc/routing.md` (nouvelle route `/quests`) + `doc/player-profile.md` (lien croisé).
Le fichier `CONTRAT-FRONT-quetes-titres.md` n'est pas commité — à supprimer une fois
l'implémentation alignée dessus (ou à archiver hors du repo, au choix de l'utilisateur).
