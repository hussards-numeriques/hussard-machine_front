import type { Translation } from './fr';

export const es = {
  common: {
    loading: 'Cargando...',
    backHome: 'Volver al inicio',
  },
  locale: {
    auto: 'Automático',
  },
  settings: {
    title: 'Ajustes',
    loginRequired: 'Inicia sesión para acceder a tus ajustes.',
    deviceOnly: 'Este ajuste es propio de este dispositivo.',
    inputMode: {
      title: 'Modo de entrada',
      labels: {
        auto: 'Automático',
        keyboard: 'Teclado',
        handwriting: 'Escritura a mano',
        keypad: 'Teclado numérico',
      },
      descriptions: {
        auto: 'Elige automáticamente según tu dispositivo: escritura a mano en pantallas táctiles, teclado en los demás.',
        keyboard: 'Un campo de texto clásico que abre el teclado de tu dispositivo.',
        handwriting: 'Dibuja el número y se reconoce automáticamente.',
        keypad: 'Un teclado de números en pantalla, sin teclado.',
      },
    },
    language: {
      title: 'Idioma',
      autoDescription: 'Sigue el idioma de tu dispositivo.',
    },
  },
} satisfies Translation;
