import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PlayerAvatar } from './PlayerAvatar';

describe('PlayerAvatar', () => {
  it('shows the two-letter uppercase initials', () => {
    render(<PlayerAvatar name="alice" grade="GOLD" isBot={false} />);
    expect(screen.getByText('AL')).toBeInTheDocument();
  });

  it('applies the grade ring color', () => {
    render(<PlayerAvatar name="Bob" grade="DIAMOND" isBot={false} />);
    expect(screen.getByText('BO').className).toContain('ring-cyan-400');
  });

  it('uses the bot background for bots', () => {
    render(<PlayerAvatar name="Botty" grade="BRONZE" isBot />);
    expect(screen.getByText('BO').className).toContain('bg-slate-400');
  });
});
