import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LevelChangeConfirmModal } from './LevelChangeConfirmModal';

describe('LevelChangeConfirmModal', () => {
  it('shows promote copy and confirms', () => {
    const onConfirm = vi.fn();
    render(
      <LevelChangeConfirmModal
        variant="promote"
        targetLevel="4ème"
        currentLevel="5ème"
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByText('Passer en 4ème ?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmer' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('shows promote titles copy', () => {
    render(
      <LevelChangeConfirmModal
        variant="promote"
        targetLevel="4ème"
        currentLevel="5ème"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(
      screen.getByText(
        'Côté titres, tu passes à la progression de 4ème : nouvelles quêtes, nouveaux titres à décrocher. Ceux de 5ème restent consultables dans Quêtes & Titres, mais ne seront plus actifs.'
      )
    ).toBeInTheDocument();
  });

  it('shows demote copy', () => {
    render(
      <LevelChangeConfirmModal
        variant="demote"
        targetLevel="3ème"
        currentLevel="4ème"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByText('Redescendre en 3ème ?')).toBeInTheDocument();
    expect(screen.getByText(/perdre l'XP de ton niveau actuel/)).toBeInTheDocument();
  });

  it('shows demote titles copy', () => {
    render(
      <LevelChangeConfirmModal
        variant="demote"
        targetLevel="3ème"
        currentLevel="4ème"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(
      screen.getByText(
        'Côté titres, tu retrouves la progression de 3ème. Ceux de 4ème restent consultables dans Quêtes & Titres, mais ne seront plus actifs.'
      )
    ).toBeInTheDocument();
  });

  it('cancels on the Annuler button', () => {
    const onCancel = vi.fn();
    render(
      <LevelChangeConfirmModal
        variant="promote"
        targetLevel="4ème"
        currentLevel="5ème"
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('cancels on backdrop click but not on card click', () => {
    const onCancel = vi.fn();
    const { container } = render(
      <LevelChangeConfirmModal
        variant="promote"
        targetLevel="4ème"
        currentLevel="5ème"
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />
    );

    fireEvent.click(screen.getByText('Les calculs vont devenir plus difficiles.'));
    expect(onCancel).not.toHaveBeenCalled();

    fireEvent.click(container.firstChild as HTMLElement);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
