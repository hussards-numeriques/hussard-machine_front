# Abonnement Stripe

Un joueur authentifié peut acheter un abonnement (1 mois / 3 mois / 1 an, achat
unique, pas de récurrence Stripe) qui débloque la **progression** des quêtes
(voir `doc/quests-titles.md`). Jouer reste 100% gratuit dans tous les cas — XP,
niveau, grade et streak ne dépendent jamais de l'abonnement.

## Backend contract

Trois routes REST (`src/services/subscription/`, port/adapter pattern) :

| Route                         | Auth   | Notes                                                              |
| ----------------------------- | ------ | ------------------------------------------------------------------ |
| `GET /subscription/plans`     | none   | Catalogue public des 3 formules, prix en centimes (`amount`)       |
| `GET /subscription`           | Bearer | `{ active, expires_at }` du joueur connecté                        |
| `POST /subscription/checkout` | Bearer | `{ plan }` → `{ checkout_url }`, le front redirige la page entière |

La source de vérité est le webhook Stripe → back (jamais appelé par le front) —
le statut se met à jour de façon asynchrone après paiement, d'où le polling sur
la page succès (voir ci-dessous).

## Data layer (`src/services/subscription/`)

Même forme que `src/services/quests/` (voir `doc/quests-titles.md`) : `port.ts`
(types + `SubscriptionRepository`), `HttpSubscriptionAdapter.ts` (lève une
`ApiError` — `src/services/http.ts` — sur toute réponse non-OK, pas une `Error`
générique, pour permettre un futur affichage différencié par code statut),
`index.ts` (exporte le singleton `subscriptionRepository`).

## Hooks (`src/hooks/useSubscription.ts`)

`useSubscriptionPlans()` (public, `staleTime: Infinity`), `useSubscriptionStatus()`
(activé seulement si authentifié), `useStartCheckout()` (redirige
`window.location.assign` vers `checkout_url` en `onSuccess`). Pas de
Context/Provider dédié — le statut est lu par 4 endroits (`SubscriptionPage`,
`SubscriptionSuccessPage`, `SubscriptionBadge`, `QuestsPage`), `useQuery`
dédoublonne déjà sur la clé `['subscription-status']`.

## Pages

- `/subscription` (`SubscriptionPage.tsx`) : intro + mascotte Rushy, puis une
  carte unique (`components/subscription/SubscriptionCard.tsx`) avec un
  sélecteur des 3 formules (par défaut sur 3 mois, simple accent visuel — jamais
  d'étiquette "populaire"/"recommandé"), le prix/mois et le % d'économie de
  chaque formule affichés simultanément (`lib/subscriptionPricing.ts`), la
  liste de ce que ça débloque (progression cosmétique des quêtes/titres,
  badge de soutien, aide à l'infra — jamais d'avantage de jeu), et un rappel
  explicite qu'il s'agit d'un paiement unique sans renouvellement automatique.
  Lien vers `/terms-of-sale` en bas de page.
- `/subscription/success` (`SubscriptionSuccessPage.tsx`) : re-fetch le statut,
  poll toutes les 1.5s jusqu'à 6 tentatives (`POLL_INTERVAL_MS`,
  `MAX_POLL_ATTEMPTS`) si pas encore actif, puis message d'attente prolongée.
- `/subscription/cancel` (`SubscriptionCancelPage.tsx`) : retour simple, aucun
  appel réseau.
- `Header` : lien "Abonnement" dans le menu utilisateur + badge "Actif jusqu'au
  JJ/MM" (`SubscriptionBadge.tsx`) à côté du `StreakBadge`.
- `QuestsPage` : bandeau non bloquant quand `active === false`, lien vers
  `/subscription`.

## Tests

`src/lib/money.spec.ts`, `src/lib/date.spec.ts`,
`src/services/subscription/HttpSubscriptionAdapter.spec.ts`,
`src/hooks/useSubscription.spec.tsx`, une spec par page/composant ci-dessus.
