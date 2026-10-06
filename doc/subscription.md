# Abonnement Stripe

Un joueur authentifié peut acheter un abonnement (1 mois / 3 mois / 1 an, achat
unique, pas de récurrence Stripe), présenté sous le nom **Calc Rush+**, qui
débloque la création de **parties privées** (voir `doc/game-flow.md`), la
**progression** des quêtes (voir `doc/quests-titles.md`) et la couronne du header. Jouer reste 100% gratuit dans tous les cas — XP,
niveau, grade et streak ne dépendent jamais de l'abonnement.

## Backend contract

Trois routes REST (`src/services/subscription/`, port/adapter pattern) :

| Route                         | Auth   | Notes                                                              |
| ----------------------------- | ------ | ------------------------------------------------------------------ |
| `GET /subscription/plans`     | none   | `[{ key, amount, currency }]`, prix en centimes (`amount`)         |
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
`index.ts` (exporte le singleton `subscriptionRepository`). Les erreurs passent par
`apiErrorFrom`, qui lit le code `{"detail": CODE}` dans `ApiError.code` (ex.
`INVALID_REDEEM_CODE` sur `/vip`). Le libellé d'une formule vient de
`SUBSCRIPTION_PLAN_LABELS[plan.key]` (`src/lib/labels.ts`), le prix de `formatEuros`
(`Intl.NumberFormat('fr-FR')`).

## Hooks (`src/hooks/useSubscription.ts`)

`useSubscriptionPlans()` (public, `staleTime: Infinity`), `useSubscriptionStatus()`
(activé seulement si authentifié, `staleTime` 5 min pour ne pas refetch à chaque navigation), `useStartCheckout()` (redirige
`window.location.assign` vers `checkout_url` en `onSuccess`). Pas de
Context/Provider dédié — le statut est lu par 4 endroits (`SubscriptionPage`,
`SubscriptionSuccessPage`, `Header` via `SubscriptionStatus`, `QuestsPage`), `useQuery`
dédoublonne déjà sur la clé `['subscription-status']`.

## Pages

- `/subscription` (`SubscriptionPage.tsx`) : titre « Calc Rush+ » + mascotte Rushy
  et une accroche orientée bénéfice joueur (jamais « aidez le dev »), le tout dans
  un bandeau dégradé `from-primary to-violet-500` (couleur signature de Calc Rush+,
  comme la carte du menu joueur) qui liste les avantages en blanc, lisibles sans clic
  (`PERKS` : parties privées, quêtes et titres, couronne — n'y lister que des
  avantages réellement livrés), puis une carte unique (`components/subscription/SubscriptionCard.tsx`) avec un
  sélecteur des 3 formules (par défaut sur 3 mois, simple accent visuel — jamais
  d'étiquette "populaire"/"recommandé"), le prix/mois et le % d'économie de
  chaque formule affichés simultanément (`lib/subscriptionPricing.ts`), et un rappel
  explicite qu'il s'agit d'un paiement unique sans renouvellement automatique.
  CTA : « Passer à Calc Rush+ · <durée> » (abonné : « Prolonger · <durée> »).
  En bas de page : « le jeu reste gratuit et équitable » (pas de mention « projet
  indé » : la page doit faire produit, pas appel aux dons), puis lien vers `/terms-of-sale`.
  La carte d'achat (`SubscriptionCard`) n'active le bouton d'achat qu'une
  fois une case de consentement cochée (acceptation des CGV + renonciation
  au délai de rétractation de 14 jours).
  Le clic sur le bouton d'achat ne lance pas le paiement directement : il
  ouvre un **parental gate** (`components/subscription/ParentalGate.tsx`),
  une modale « Demande à un adulte » avec une question de culture générale
  à réponse numérique tirée de `lib/parentalGate.ts` (10 questions, saisie
  tolérante aux espaces). Mauvaise réponse → une autre question ; bonne
  réponse → `startCheckout.mutate(plan)`. Jamais de question de calcul : les
  joueurs s'entraînent justement au calcul mental. Les questions sont
  volontairement faciles (le but est de freiner l'achat impulsif d'un enfant,
  pas de bloquer les parents).
- `/subscription/success` (`SubscriptionSuccessPage.tsx`) : re-fetch le statut,
  poll toutes les 1.5s jusqu'à 6 tentatives (`POLL_INTERVAL_MS`,
  `MAX_POLL_ATTEMPTS`) si pas encore actif, puis message d'attente prolongée.
- `/subscription/cancel` (`SubscriptionCancelPage.tsx`) : retour simple, aucun
  appel réseau.
- `Header` : lien "Abonnement" dans le menu utilisateur + icône "plus"
  (`SubscriptionBadge.tsx`) à côté du `StreakBadge` — pas de date visible sans
  clic ; le clic ouvre un popover avec la date complète
  (`lib/date.ts#formatLongDate`) et un lien "Prolonger →" vers
  `/subscription`.
- `/profile` (`ProfilePage.tsx`) : si l'abonnement est actif, une ligne de
  texte dans la carte identité donne la date complète de fin
  (`formatLongDate`) — pas de badge, pas d'incitation à l'achat si inactif.
- `QuestsPage` : bandeau non bloquant quand `active === false`, lien vers
  `/subscription`.

## Tests

`src/lib/money.spec.ts`, `src/lib/date.spec.ts`, `src/lib/parentalGate.spec.ts`,
`src/services/subscription/HttpSubscriptionAdapter.spec.ts`,
`src/hooks/useSubscription.spec.tsx`, une spec par page/composant ci-dessus.

## Secret redeem code (`/vip`, hidden page)

A fourth route, `POST /subscription/redeem` (Bearer, `{ code }` → same shape as `GET /subscription`), activates a free one-year subscription from a single-use code distributed manually by the operator (no admin UI, no Stripe involved — see the back-end docs for how codes are generated). `VipPage` (`src/pages/VipPage.tsx`) is the only consumer, reached at `/vip`. This route is deliberately **not** part of the "Backend contract" table above and **not** linked from any nav/menu — do not add a link to it, do not add `/vip` to `public/sitemap.xml` or `public/robots.txt`. `redeem` on `subscriptionRepository`/`useRedeem` follow the exact same port/adapter/hook shape as `createCheckoutSession`/`useStartCheckout`.

## Affichage dans le header (`components/SubscriptionStatus.tsx`)

L'offre est nommée **Calc Rush+** partout dans l'UI (le composant garde son nom de code `SupporterCrown`) :

- `SupporterCrown` : couronne dorée posée en biais sur l'avatar du header quand
  `active === true` — c'est la « Couronne » listée dans les avantages de `/subscription`.
- `SubscriptionMenuCard` : carte en tête du menu joueur, lien vers `/subscription`.
  Non abonné → carte indigo « Passe à Calc Rush+ » ; abonné → carte dorée
  « Calc Rush+ · Jusqu'au <date> » ; à ≤ 7 jours de l'expiration
  (`daysUntil` de `lib/date.ts`) → carte rose « Expire dans N jours · Prolonger ».
