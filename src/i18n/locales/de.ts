import type { Translation } from './fr';

export const de = {
  common: {
    loading: 'Wird geladen...',
    backHome: 'Zurück zur Startseite',
  },
  locale: {
    auto: 'Automatisch',
  },
  settings: {
    title: 'Einstellungen',
    loginRequired: 'Melde dich an, um deine Einstellungen zu sehen.',
    deviceOnly: 'Diese Einstellung gilt nur für dieses Gerät.',
    inputMode: {
      title: 'Eingabemodus',
      labels: {
        auto: 'Automatisch',
        keyboard: 'Tastatur',
        handwriting: 'Handschrift',
        keypad: 'Zahlenfeld',
      },
      descriptions: {
        auto: 'Wählt automatisch passend zu deinem Gerät: Handschrift auf Touchscreens, sonst Tastatur.',
        keyboard: 'Ein klassisches Eingabefeld, das die Tastatur deines Geräts öffnet.',
        handwriting: 'Zeichne die Ziffer, sie wird automatisch erkannt.',
        keypad: 'Ein Zahlenfeld auf dem Bildschirm, ohne Tastatur.',
      },
    },
    language: {
      title: 'Sprache',
      autoDescription: 'Folgt der Sprache deines Geräts.',
    },
  },
} satisfies Translation;
