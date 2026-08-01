import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { SubscriptionCancelPage } from './SubscriptionCancelPage';

describe('SubscriptionCancelPage', () => {
  it('shows a cancellation message with a link back to the subscription page', () => {
    render(
      <MemoryRouter>
        <SubscriptionCancelPage />
      </MemoryRouter>
    );

    expect(screen.getByText("Paiement annulé, rien n'a été débité.")).toBeInTheDocument();
    expect(screen.getByRole('link', { name: "Retour à l'abonnement" })).toHaveAttribute(
      'href',
      '/subscription'
    );
  });
});
