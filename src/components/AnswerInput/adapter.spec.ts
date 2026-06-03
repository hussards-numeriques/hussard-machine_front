import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

beforeEach(() => {
  vi.stubGlobal('matchMedia', vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('getAnswerInputComponent', () => {
  it('returns HandwritingInput when pointer is coarse (mobile/tablette)', async () => {
    vi.mocked(window.matchMedia).mockReturnValue({ matches: true } as MediaQueryList);
    const { getAnswerInputComponent } = await import('./adapter');
    const Component = getAnswerInputComponent();
    expect(Component.name).toBe('HandwritingInput');
  });

  it('returns KeyboardInput when pointer is fine (desktop)', async () => {
    vi.mocked(window.matchMedia).mockReturnValue({ matches: false } as MediaQueryList);
    const { getAnswerInputComponent } = await import('./adapter');
    const Component = getAnswerInputComponent();
    expect(Component.name).toBe('KeyboardInput');
  });
});
