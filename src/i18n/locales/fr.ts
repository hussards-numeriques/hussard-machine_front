export const fr = {
  common: {
    loading: 'Chargement...',
    backHome: "Retour à l'accueil",
  },
  locale: {
    auto: 'Automatique',
  },
  settings: {
    title: 'Réglages',
    loginRequired: 'Connecte-toi pour accéder à tes réglages.',
    deviceOnly: 'Ce réglage est propre à cet appareil.',
    inputMode: {
      title: 'Mode de saisie',
      labels: {
        auto: 'Automatique',
        keyboard: 'Clavier',
        handwriting: 'Écriture manuscrite',
        keypad: 'Pavé numérique',
      },
      descriptions: {
        auto: 'Choisit automatiquement selon ton appareil : écriture manuscrite sur tactile, clavier sinon.',
        keyboard: 'Champ de saisie classique, ouvre le clavier de ton appareil.',
        handwriting: 'Dessine le chiffre, il est reconnu automatiquement.',
        keypad: "Un pavé de chiffres à l'écran, sans clavier.",
      },
    },
    language: {
      title: 'Langue',
      autoDescription: 'Suit la langue de ton appareil.',
    },
  },
} as const;

type Messages<T> = { [K in keyof T]: T[K] extends string ? string : Messages<T[K]> };
export type Translation = Messages<typeof fr>;
