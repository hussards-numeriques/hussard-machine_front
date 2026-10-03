import type { SubscriptionPlanKey } from '../services/subscription';
import { ApiError, type ApiErrorCode } from '../services/http';
import type { WsErrorCode } from '../services/gameSchemas';

const QUESTION_CATEGORIES = [
  'addition',
  'subtraction',
  'multiplication',
  'division',
  'complement',
  'double',
  'half',
  'multiplication_by_power_of_10',
  'operation_priority',
  'relative_number',
  'equation',
  'fraction',
  'percentage',
  'power',
  'square_root',
  'divisibility',
  'function',
] as const;
type QuestionCategory = (typeof QUESTION_CATEGORIES)[number];

const QUESTION_CATEGORY_LABELS: Record<QuestionCategory, string> = {
  addition: 'Addition',
  subtraction: 'Soustraction',
  multiplication: 'Multiplication',
  division: 'Division',
  complement: 'Complément',
  double: 'Double',
  half: 'Moitié',
  multiplication_by_power_of_10: 'Multiplication par 10, 100, 1000',
  operation_priority: 'Priorités opératoires',
  relative_number: 'Nombres relatifs',
  equation: 'Équation',
  fraction: "Fraction d'une quantité",
  percentage: 'Pourcentage',
  power: 'Puissance',
  square_root: 'Racine carrée',
  divisibility: 'Multiples et diviseurs',
  function: 'Fonction',
};

const QUEST_IDS = ['win-streak', 'correct-answers', 'perfect-games'] as const;
type QuestId = (typeof QUEST_IDS)[number];

const QUEST_LABELS: Record<QuestId, string> = {
  'win-streak': "Terminer 1er en parties d'affilée",
  'correct-answers': 'Cumuler des bonnes réponses',
  'perfect-games': 'Réussir des parties parfaites (100 % de bonnes réponses)',
};

const TITLE_IDS = [
  'win-streak-bronze',
  'win-streak-silver',
  'win-streak-gold',
  'correct-answers-bronze',
  'correct-answers-silver',
  'correct-answers-gold',
  'perfect-games-bronze',
  'perfect-games-silver',
  'perfect-games-gold',
] as const;
type TitleId = (typeof TITLE_IDS)[number];

const TITLE_LABELS: Record<TitleId, string> = {
  'win-streak-bronze': 'Petit Conquérant',
  'win-streak-silver': 'Top Player',
  'win-streak-gold': "Légende de l'Arène",
  'correct-answers-bronze': 'Apprenti Calculateur',
  'correct-answers-silver': 'Machine à Calculer',
  'correct-answers-gold': 'Cerveau Quantique',
  'perfect-games-bronze': 'Sans Faute',
  'perfect-games-silver': 'Perfectionniste',
  'perfect-games-gold': 'Chirurgien du Calcul',
};

const ICON_IDS = ['subscriber-star'] as const;
type IconId = (typeof ICON_IDS)[number];

const ICON_LABELS: Record<IconId, string> = {
  'subscriber-star': 'Étoile Abonné',
};

export const SUBSCRIPTION_PLAN_LABELS: Record<SubscriptionPlanKey, string> = {
  ONE_MONTH: '1 mois',
  THREE_MONTHS: '3 mois',
  ONE_YEAR: '1 an',
};

export const API_ERROR_MESSAGES: Record<ApiErrorCode, string> = {
  INVALID_TOKEN: 'Session expirée, reconnecte-toi.',
  ACCOUNT_NOT_FOUND: 'Compte introuvable.',
  INVALID_LEVEL: 'Niveau invalide.',
  TITLE_NOT_UNLOCKED: 'Titre non débloqué.',
  ICON_NOT_UNLOCKED: 'Icône non débloquée.',
  PROMOTION_NOT_ALLOWED: 'Promotion impossible.',
  DEMOTION_NOT_ALLOWED: 'Rétrogradation impossible.',
  AUTH_ACCOUNT_DELETION_FAILED: "Suppression du compte d'authentification impossible.",
  SUBSCRIPTION_REQUIRED: 'Un abonnement actif est requis pour créer un salon.',
  INVALID_REDEEM_CODE: 'Code invalide.',
  INVALID_WEBHOOK_SIGNATURE: 'Signature invalide.',
};

export const WS_ERROR_MESSAGES: Record<WsErrorCode, string> = {
  JOIN_FAILED: 'Impossible de rejoindre ce salon.',
  ADD_BOT_FAILED: "Impossible d'ajouter ce bot.",
  REMOVE_PLAYER_FAILED: 'Impossible de retirer ce joueur.',
};

const lookup =
  <K extends string>(ids: readonly K[], labels: Record<K, string>) =>
  (id: string): string =>
    (ids as readonly string[]).includes(id) ? labels[id as K] : id;

export const resolveQuestionCategoryLabel = lookup(QUESTION_CATEGORIES, QUESTION_CATEGORY_LABELS);
export const resolveQuestLabel = lookup(QUEST_IDS, QUEST_LABELS);
export const resolveTitleLabel = lookup(TITLE_IDS, TITLE_LABELS);
export const resolveIconLabel = lookup(ICON_IDS, ICON_LABELS);

export const resolveApiErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof ApiError && error.code !== null ? API_ERROR_MESSAGES[error.code] : fallback;
