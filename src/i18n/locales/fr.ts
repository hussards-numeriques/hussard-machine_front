export const fr = {
  common: {
    loading: 'Chargement...',
    backHome: "Retour à l'accueil",
  },
  locale: {
    auto: 'Automatique',
  },
} as const;

type Messages<T> = { [K in keyof T]: T[K] extends string ? string : Messages<T[K]> };
export type Translation = Messages<typeof fr>;
