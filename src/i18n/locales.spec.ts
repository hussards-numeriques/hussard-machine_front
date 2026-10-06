import { describe, it, expect } from 'vitest';
import { fr } from './locales/fr';
import { en } from './locales/en';
import { es } from './locales/es';
import { it as italian } from './locales/it';
import { ptBR } from './locales/pt-BR';
import { de } from './locales/de';

type Tree = { [key: string]: string | Tree };

const emptyKeys = (tree: Tree, prefix = ''): string[] =>
  Object.entries(tree).flatMap(([key, value]) =>
    typeof value === 'string'
      ? value.trim() === ''
        ? [`${prefix}${key}`]
        : []
      : emptyKeys(value, `${prefix}${key}.`)
  );

describe.each([
  ['fr', fr],
  ['en', en],
  ['es', es],
  ['it', italian],
  ['pt-BR', ptBR],
  ['de', de],
])('%s messages', (_, messages) => {
  it('has no empty value', () => {
    expect(emptyKeys(messages)).toEqual([]);
  });
});
