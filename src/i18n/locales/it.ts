import type { Translation } from './fr';

export const it = {
  common: {
    loading: 'Caricamento...',
    backHome: 'Torna alla home',
  },
  locale: {
    auto: 'Automatico',
  },
  settings: {
    title: 'Impostazioni',
    loginRequired: 'Accedi per vedere le tue impostazioni.',
    deviceOnly: 'Questa impostazione vale solo per questo dispositivo.',
    inputMode: {
      title: 'Modalità di inserimento',
      labels: {
        auto: 'Automatica',
        keyboard: 'Tastiera',
        handwriting: 'Scrittura a mano',
        keypad: 'Tastierino numerico',
      },
      descriptions: {
        auto: 'Sceglie in automatico in base al tuo dispositivo: scrittura a mano sugli schermi tattili, tastiera negli altri casi.',
        keyboard: 'Un campo di testo classico che apre la tastiera del tuo dispositivo.',
        handwriting: 'Disegna la cifra e viene riconosciuta automaticamente.',
        keypad: 'Un tastierino di numeri sullo schermo, senza tastiera.',
      },
    },
    language: {
      title: 'Lingua',
      autoDescription: 'Segue la lingua del tuo dispositivo.',
    },
  },
} satisfies Translation;
