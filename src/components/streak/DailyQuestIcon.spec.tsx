import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DailyQuestIcon } from './DailyQuestIcon';

describe('DailyQuestIcon', () => {
  it('renders the secured (check) state', () => {
    const { container } = render(<DailyQuestIcon state="secured" />);
    expect(container.querySelector('[data-quest="secured"]')).not.toBeNull();
  });

  it('applies the pulse animation only in last-chance state when animated', () => {
    const { container } = render(<DailyQuestIcon state="last-chance" />);
    expect(container.querySelector('.animate-quest-pulse')).not.toBeNull();
  });

  it('does not animate when animated is false', () => {
    const { container } = render(<DailyQuestIcon state="last-chance" animated={false} />);
    expect(container.querySelector('.animate-quest-pulse')).toBeNull();
  });
});
