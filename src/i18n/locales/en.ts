import type { Translation } from './fr';

export const en = {
  common: {
    loading: 'Loading...',
    backHome: 'Back to home',
  },
  locale: {
    auto: 'Automatic',
  },
  settings: {
    title: 'Settings',
    loginRequired: 'Log in to access your settings.',
    deviceOnly: 'This setting is specific to this device.',
    inputMode: {
      title: 'Input mode',
      labels: {
        auto: 'Automatic',
        keyboard: 'Keyboard',
        handwriting: 'Handwriting',
        keypad: 'Number pad',
      },
      descriptions: {
        auto: 'Picks automatically for your device: handwriting on touchscreens, keyboard otherwise.',
        keyboard: "A classic input field that opens your device's keyboard.",
        handwriting: 'Draw the digit and it is recognized automatically.',
        keypad: 'An on-screen number pad, no keyboard needed.',
      },
    },
    language: {
      title: 'Language',
      autoDescription: "Follows your device's language.",
    },
  },
} satisfies Translation;
