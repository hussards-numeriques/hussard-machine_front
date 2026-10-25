import { describe, expect, it } from 'vitest';
import { pickLoadingTip } from './loadingTips';

describe('pickLoadingTip', () => {
  it('returns inputMode for the lowest random values', () => {
    expect(pickLoadingTip(() => 0)).toBe('inputMode');
  });

  it('returns inputMode just below the inputMode/levelUp boundary', () => {
    expect(pickLoadingTip(() => 0.49)).toBe('inputMode');
  });

  it('returns levelUp right at the inputMode/levelUp boundary', () => {
    expect(pickLoadingTip(() => 0.5)).toBe('levelUp');
  });

  it('returns levelUp just below the levelUp/language boundary', () => {
    expect(pickLoadingTip(() => 0.83)).toBe('levelUp');
  });

  it('returns language right at the levelUp/language boundary', () => {
    expect(pickLoadingTip(() => 0.8334)).toBe('language');
  });

  it('returns language for the highest random values', () => {
    expect(pickLoadingTip(() => 0.999999)).toBe('language');
  });

  it('falls back to a valid tip for a random value of exactly 1', () => {
    expect(pickLoadingTip(() => 1)).toBe('language');
  });

  it('uses Math.random by default', () => {
    expect(['inputMode', 'levelUp', 'language']).toContain(pickLoadingTip());
  });
});
