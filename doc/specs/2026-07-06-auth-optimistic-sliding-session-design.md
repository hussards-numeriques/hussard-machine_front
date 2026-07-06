# Auth sans flash + session glissante 7 jours — Design

**Date** : 2026-07-06
**Périmètre** : front uniquement (`calc-rush_front`). Aucun changement fastauth.

## Problèmes constatés

1. **Flash « invité → connecté »** : au chargement, `AuthProvider` démarre avec
   `user = null` et attend un `fetchMe()` réseau avant de basculer. `HomePage`
   n'utilise que `isAuthenticated` → l'UI rend ~300 ms en mode invité puis change.
2. **Session non glissante** : le refresh token fastauth dure 7 jours avec
   rotation (chaque `/refresh` émet un token neuf valable 7 jours), mais le front
   n'appelle `/refresh` que sur un 401. Un joueur qui revient après expiration
   est déconnecté même s'il jouait régulièrement.
3. **Déconnexion abusive** : `hydrate()` efface les tokens sur n'importe quelle
   erreur, y compris une coupure réseau.
4. **Course multi-onglets** : la rotation révoque l'ancien refresh token. Deux
   onglets qui refreshent en parallèle → le perdant reçoit 401 et
   `clearTokens()` efface les tokens neufs écrits par le gagnant (localStorage
   partagé) → tout le monde est déconnecté.

## Décisions

- **Stockage** : on conserve localStorage (option cookies httpOnly écartée pour
  ce chantier ; documentée comme évolution possible).
- **Anti-flash** : rendu optimiste depuis un cache de profil, pas d'écran
  d'attente.

## Design

### 1. Cache de profil (anti-flash)

- `AuthClient` : nouvelle clé localStorage `hm_auth_user`.
  - `getCachedUser(): AuthUser | null` — lecture validée par `authUserSchema.safeParse` ;
    contenu corrompu ⇒ `null`.
  - `setCachedUser(user)` — écrit après chaque `fetchMe()` réussi.
  - `clearTokens()` efface aussi le cache.
- `AuthProvider` : initialisation **synchrone** du state :
  `useState(() => client.getAccessToken() ? client.getCachedUser() : null)`.
  Si tokens + cache présents, l'UI rend le mode connecté au premier paint.
  `isLoading` ne bloque plus l'affichage optimiste ; il reste vrai uniquement
  tant que la validation réseau est en cours **et** qu'aucun cache n'existe.

### 2. Refresh proactif au chargement (session glissante)

- `AuthClient` expose une méthode publique `refreshSession(): Promise<TokenResponse | null>`
  (wrapper du `tryRefresh` privé existant, avec la déduplication in-flight).
- Au montage, `AuthProvider` : si refresh token présent → `refreshSession()`
  puis `fetchMe()` (met à jour `user` et le cache).
- La rotation backend repousse l'expiration à J+7 à chaque visite → session
  glissante sans changement fastauth. Effet secondaire souhaitable : l'access
  token est frais au moment de rejoindre une partie (WS).

### 3. Downgrade uniquement sur 401 confirmé

- **401 de fastauth** (refresh refusé, ou `fetchMe` 401 après refresh) →
  `clearTokens()` + cache effacé + `setUser(null)` → bascule invité.
- **Erreur réseau** (fetch rejeté, backend injoignable) → on conserve l'état
  optimiste, aucun effacement. `tryRefresh` ne doit plus `clearTokens()` sur
  une exception réseau (comportement actuel conservé : il retourne `null`),
  et `hydrate()` distingue `AuthError` 401 des autres erreurs.

### 4. Robustesse multi-onglets

Dans `tryRefresh`, sur réponse non-OK : relire `hm_refresh_token` dans le
storage. S'il diffère du token utilisé pour l'appel, un autre onglet a gagné la
course de rotation → adopter les tokens présents dans le storage (retourner un
`TokenResponse` reconstruit depuis le storage) au lieu d'effacer. Sinon
(token inchangé) : vrai 401 → `clearTokens()` comme aujourd'hui.

## Flux au chargement (résumé)

```
paint t=0 : user = cache (si tokens présents) → UI connectée, zéro flash
async     : refreshSession() → rotation, expiration J+7
            fetchMe() → setUser + setCachedUser (profil à jour)
échec 401 : clearTokens + bascule invité (rare)
échec réseau : état optimiste conservé
```

## Tests

- `AuthClient.spec.ts` :
  - cache profil : lecture/écriture, contenu corrompu ⇒ `null`, effacé par `clearTokens`.
  - `refreshSession` : succès (tokens mis à jour), 401 (tokens effacés), erreur réseau (tokens conservés).
  - course multi-onglets : le storage change pendant un refresh qui échoue ⇒ adoption des tokens du storage, pas d'effacement.
- Tests `AuthProvider` :
  - init optimiste depuis le cache (user non nul au premier rendu).
  - downgrade sur 401, maintien sur erreur réseau.
  - `fetchMe` réussi met à jour le cache.

## Hors périmètre

- Cookies httpOnly / modifications fastauth (évolution future documentée ici :
  pattern hybride refresh-token-cookie + access-token-mémoire, compatible avec
  le backend métier qui vérifie l'access token auprès de fastauth).
- Refresh périodique pendant qu'un onglet reste ouvert plusieurs jours (le
  refresh sur 401 existant couvre ce cas).
- Tokens OAuth dans le fragment d'URL (faiblesse connue, chantier backend).
- Course multi-onglets résiduelle : la récupération de `recoverFromLostRefreshRace` suppose que l'onglet gagnant a déjà écrit ses tokens dans le localStorage quand le 401 du perdant arrive. Deux rechargements strictement simultanés peuvent encore déconnecter les deux onglets (auto-réparé à la connexion suivante). Le refresh proactif à chaque chargement augmente la probabilité de cette course par rapport à l'ancien comportement ; durcissement possible plus tard via BroadcastChannel/événements `storage`.
