import { describe, expect, it } from 'vitest';
import { pickGameTipKey, resolveTipAudience } from './gameTips';

describe('resolveTipAudience', () => {
  it('treats unauthenticated players as guests', () => {
    expect(resolveTipAudience(false, false)).toBe('guest');
  });

  it('treats authenticated non-subscribers as members', () => {
    expect(resolveTipAudience(true, false)).toBe('member');
  });

  it('treats authenticated subscribers as subscribers', () => {
    expect(resolveTipAudience(true, true)).toBe('subscriber');
  });
});

describe('pickGameTipKey', () => {
  it('picks the first tip of the audience for the lowest random value', () => {
    expect(pickGameTipKey('guest', 0)).toBe('gameTips.guest.progress');
  });

  it('picks the last tip of the audience for a random value of exactly 1', () => {
    expect(pickGameTipKey('subscriber', 1)).toBe('gameTips.subscriber.inputMode');
  });

  it('stays within the audience tips', () => {
    expect(pickGameTipKey('member', 0.5)).toMatch(/^gameTips\.member\./);
  });
});
