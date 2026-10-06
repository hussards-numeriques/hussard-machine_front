import type { Translation } from './fr';

export const ptBR = {
  common: {
    loading: 'Carregando...',
    backHome: 'Voltar ao início',
  },
  locale: {
    auto: 'Automático',
  },
  settings: {
    title: 'Configurações',
    loginRequired: 'Entre para acessar suas configurações.',
    deviceOnly: 'Esta configuração é específica deste dispositivo.',
    inputMode: {
      title: 'Modo de entrada',
      labels: {
        auto: 'Automático',
        keyboard: 'Teclado',
        handwriting: 'Escrita à mão',
        keypad: 'Teclado numérico',
      },
      descriptions: {
        auto: 'Escolhe automaticamente conforme seu dispositivo: escrita à mão em telas sensíveis ao toque, teclado nos outros casos.',
        keyboard: 'Um campo de texto clássico que abre o teclado do seu dispositivo.',
        handwriting: 'Desenhe o número e ele é reconhecido automaticamente.',
        keypad: 'Um teclado de números na tela, sem teclado.',
      },
    },
    language: {
      title: 'Idioma',
      autoDescription: 'Segue o idioma do seu dispositivo.',
    },
  },
} satisfies Translation;
