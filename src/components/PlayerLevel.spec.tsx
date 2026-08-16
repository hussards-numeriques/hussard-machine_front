import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PlayerLevel } from './PlayerLevel';

describe('PlayerLevel', () => {
  it('shows the resolved level label', () => {
    render(<PlayerLevel level="CM2" />);
    expect(screen.getByText('CM2')).toBeInTheDocument();
  });

  it('resolves abbreviated labels for higher levels', () => {
    render(<PlayerLevel level="SIXIEME" />);
    expect(screen.getByText('6ème')).toBeInTheDocument();
  });
});
