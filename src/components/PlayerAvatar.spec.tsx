import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PlayerAvatar } from './PlayerAvatar';

describe('PlayerAvatar', () => {
  it('shows the two-letter uppercase initials', () => {
    render(<PlayerAvatar name="alice" grade="GOLD" isBot={false} />);
    expect(screen.getByText('AL')).toBeInTheDocument();
  });

  it('rings the avatar with the grade metal', () => {
    render(<PlayerAvatar name="Bob" grade="DIAMOND" isBot={false} />);
    expect(screen.getByTestId('player-avatar').className).toContain('grade-metal-diamond');
  });

  it('uses the bot background for bots', () => {
    render(<PlayerAvatar name="Botty" grade="BRONZE" isBot />);
    expect(screen.getByText('BO').className).toContain('bg-slate-400');
  });

  it('shows the level on a tab and describes the full rank', () => {
    render(<PlayerAvatar name="Bob" grade="GOLD" level="CM2" isBot={false} />);
    expect(screen.getByText('CM2')).toBeInTheDocument();
    expect(screen.getByTestId('player-avatar')).toHaveAttribute('title', 'CM2 · Or');
  });

  it('shows the profile icon instead of the initials when provided', () => {
    const { container } = render(
      <PlayerAvatar name="Bob" grade="GOLD" isBot={false} iconUrl="/icons/fox.png" />
    );
    expect(container.querySelector('img')).toHaveAttribute('src', '/icons/fox.png');
    expect(screen.queryByText('BO')).not.toBeInTheDocument();
  });
});
