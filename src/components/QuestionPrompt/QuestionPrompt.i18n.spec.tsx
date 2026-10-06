import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import i18n from '../../i18n';
import { QuestionPrompt } from './QuestionPrompt';

describe('QuestionPrompt i18n', () => {
  it('renders the double prompt in English', async () => {
    await i18n.changeLanguage('en');

    render(<QuestionPrompt prompt={{ type: 'double', value: 7 }} />);

    expect(screen.getByTestId('question-prompt')).toHaveTextContent('Double of7');
  });
});
