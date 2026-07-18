import { describe, it, expect } from 'vitest';
import { ANSWER_INPUT_COMPONENTS } from './adapter';

describe('ANSWER_INPUT_COMPONENTS', () => {
  it('maps each resolved mode to its component', () => {
    expect(ANSWER_INPUT_COMPONENTS.keyboard.name).toBe('KeyboardInput');
    expect(ANSWER_INPUT_COMPONENTS.handwriting.name).toBe('HandwritingInput');
    expect(ANSWER_INPUT_COMPONENTS.keypad.name).toBe('KeypadInput');
  });
});
