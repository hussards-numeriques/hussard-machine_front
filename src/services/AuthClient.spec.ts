import { describe, expect, it } from 'vitest';
import { parseOAuthFragment } from './AuthClient';

describe('parseOAuthFragment', () => {
  it('extracts tokens from a success fragment', () => {
    const hash = '#access_token=abc&refresh_token=def&token_type=bearer';

    const result = parseOAuthFragment(hash);

    expect(result.tokens).toEqual({
      access_token: 'abc',
      refresh_token: 'def',
      token_type: 'bearer',
    });
    expect(result.error).toBeUndefined();
  });

  it('extracts an error message from an error fragment', () => {
    const hash = '#error=boom';

    const result = parseOAuthFragment(hash);

    expect(result.error).toBe('boom');
    expect(result.tokens).toBeUndefined();
  });

  it('returns nothing useful for an empty fragment', () => {
    const result = parseOAuthFragment('');

    expect(result.tokens).toBeUndefined();
    expect(result.error).toBeUndefined();
  });
});
