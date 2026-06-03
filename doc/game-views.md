# Game Views — Les 3 vues de jeu

Les trois vues sont rendues par `GamePage` selon `game.state`. Elles reçoivent toutes `client`, `game` et `currentPlayerId` (= `client.getPlayerId()`).

## LobbyView (src/views/LobbyView.tsx)

**Quand :** `game.state === 'WAITING'` ou `'COUNTDOWN'`

Affiche la liste des joueurs et les boutons d'action.

### Comportements clés

- **Code du salon** : affiché en grand si `!game.is_quick_game`
- **Partie Rapide** : affiche "Partie Rapide" à la place du code
- **Prêt/Pas prêt** : `client.setReady(!isReady)` — bascule l'état du joueur courant
- **Lancer** : visible uniquement si `canStart && !game.is_quick_game`
  - `canStart` = `game.players.length >= 1 && game.players.every(p => p.is_ready)`
  - Les parties rapides démarrent automatiquement côté serveur
- **Décompte** : quand `game.state === 'COUNTDOWN'`, le texte "Démarrage..." s'anime

### Props

```typescript
{
  client: GameClient;
  game: Game;
  currentPlayerId: string | null;
}
```

---

## GameView (src/views/GameView.tsx)

**Quand :** `game.state === 'IN_PROGRESS'`

Affiche la question courante, le timer, le scoreboard et le composant de saisie.

### Gestion de l'index de question

Le serveur peut incrémenter `current_question_index` de 1 en 1 (progression normale) ou sauter plusieurs questions. La vue maintient un `displayedQuestionIndex` local pour éviter les flashs :

- Avance seulement si `currentIndex === displayedIndex + 1` (progression normale)
- En cas de saut (`currentIndex > displayedIndex + 1`), affiche directement la nouvelle question et log un warning

### Timer (`useQuestionTimer`)

Hook local qui calcule les secondes restantes à partir de `question.time_limit_seconds` et `game.start_time_current_question` (timestamp Unix). Se rafraîchit toutes les 250 ms.

Quand `questionCountdown !== null` (décompte inter-question actif), le timer est mis en pause.

### Décompte inter-questions (`questionCountdown`)

`GameClient.onQuestionCountdown` est branché dans un `useEffect`. Quand le serveur envoie `QUESTION_COUNTDOWN { seconds: 0 }`, le décompte est effacé et la question s'affiche.

### Saisie de réponse

Le composant `AnswerInput` est désactivé (`disabled`) dès que le joueur a déjà répondu à la question courante :

```typescript
const hasAnswered = game.answers.some(
  (a) => a.question_id === currentQuestion.id && a.player_id === currentPlayerId
);
```

### Scoreboard

Trié par score décroissant. La barre de progression est relative à 1000 pts (max visuel).

---

## PodiumView (src/views/PodiumView.tsx)

**Quand :** `game.state === 'FINISHED'`

Affiche le podium (top 3 en colonnes) et le classement complet.

### Comportements clés

- **Confettis** : lancés au montage via `canvas-confetti`
- **Rejouer** : crée une nouvelle `quickGame` et navigue vers elle en passant `{ playerName, token }` dans le state de navigation
- **Retour accueil** : `navigate('/')`

### Props

```typescript
{
  game: Game;
  currentPlayerId: string | null;
  client: GameClient; // pour créer la nouvelle partie via createQuickGame()
  playerName: string; // pour rejoindre la nouvelle partie
}
```

---

## Ajouter un élément UI dans une vue de jeu

1. La donnée existe dans `Game` → lire directement depuis `game`
2. La donnée vient d'un nouveau message WS → voir [game-flow.md](game-flow.md) pour ajouter la callback
3. Nouvel état de jeu → ajouter dans `GameState` (types.ts) et le `switch` de `GamePage`
4. Nouveau composant réutilisable → le placer dans `src/components/` avec son interface dans un `port.ts` si plusieurs implémentations possibles
