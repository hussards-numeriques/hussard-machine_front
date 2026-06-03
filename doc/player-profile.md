# Player Profile — Profil joueur

## Vue d'ensemble

La page `ProfilePage` (`src/pages/ProfilePage.tsx`) est accessible uniquement aux utilisateurs authentifiés via `/profile`. Elle affiche :

- Le pseudo et l'avatar (initiales)
- Le niveau scolaire (ex : CM2, 6ème) et le grade (Bronze → Diamant)
- Une barre d'XP segmentée par grade
- Le bouton de promotion de niveau si `can_promote === true`
- L'historique des parties jouées

## Types (src/types.ts)

### PlayerProfile

```typescript
interface PlayerProfile {
  username: string;
  level: string; // clé parmi les niveaux (ex: 'CM2', 'SIXIEME')
  experience: number; // XP total cumulé
  grade: string; // clé parmi les grades (ex: 'BRONZE', 'GOLD')
  can_promote: boolean;
  history: GameHistoryEntry[];
}
```

### GameConfig

```typescript
interface GameConfig {
  experience_per_grade: number; // XP nécessaire par grade
  promotion_threshold: number;
  grades: string[]; // ['BRONZE', 'SILVER', 'GOLD', 'PLATINE', 'DIAMOND']
  levels: string[]; // ['CP', 'CE1', 'CE2', 'CM1', 'CM2', 'SIXIEME', ...]
}
```

### GameHistoryEntry

```typescript
interface GameHistoryEntry {
  id: string;
  played_at: string; // ISO 8601
  duration_seconds: number;
  is_quick_game: boolean;
  questions_count: number;
  winner_display_name: string | null;
  my_rank: number;
  my_score: number;
  my_correct_answers: number;
  my_total_answers: number;
  experience_gained: number; // peut être négatif
  participants: GameHistoryParticipant[];
}
```

## Appels API

| Appel             | Endpoint                         | Description                                                        |
| ----------------- | -------------------------------- | ------------------------------------------------------------------ |
| Chargement config | `GET /game/config`               | Publique. Grades, niveaux, XP par grade.                           |
| Chargement profil | `GET /me/details` (authentifié)  | Profil complet avec historique. 404 si premier joueur.             |
| Promotion         | `POST /me/promote` (authentifié) | Monte d'un niveau si `can_promote`. Retourne le profil mis à jour. |

Les appels `/me/...` passent par `authClient.authorizedFetch()` (refresh token automatique).

## Système de grades et niveaux

**Grades** (dans l'ordre) : BRONZE → SILVER → GOLD → PLATINE → DIAMOND

Chaque grade nécessite `experience_per_grade` XP. La barre XP est segmentée visuellement en autant de cases que de grades.

**Niveaux scolaires** (dans l'ordre) : CP → CE1 → CE2 → CM1 → CM2 → SIXIÈME → CINQUIÈME → QUATRIÈME → TROISIÈME → SECONDE → PREMIÈRE → TERMINALE

La **promotion** change le niveau scolaire (pas le grade). Elle est disponible quand `can_promote === true`, c'est-à-dire quand le joueur a atteint le grade DIAMOND au niveau courant.

## Composants internes à ProfilePage

| Composant        | Rôle                                                        |
| ---------------- | ----------------------------------------------------------- |
| `GradeBadge`     | Badge coloré affichant le label du grade                    |
| `SegmentedXpBar` | Barre XP multi-segments, une case par grade                 |
| `HistoryRow`     | Ligne d'historique expandable avec tableau des participants |

## Ajouter une feature profil

- Nouvelle stat → ajouter dans `PlayerProfile` (types.ts) et dans le rendu de `ProfilePage`
- Nouveau badge / rang → ajouter dans les maps `GRADE_STYLES`, `GRADE_LABELS`, etc. en haut de `ProfilePage`
- Nouvelle action sur le profil → ajouter un bouton + `authClient.authorizedFetch(url, { method: 'POST' })`
