import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { SubscriptionCard } from './SubscriptionCard';
import type { SubscriptionPlan, SubscriptionStatus } from '../../services/subscription';

const plans: SubscriptionPlan[] = [
  { key: 'ONE_MONTH', label: '1 mois', amount: 442, currency: 'eur' },
  { key: 'THREE_MONTHS', label: '3 mois', amount: 842, currency: 'eur' },
  { key: 'ONE_YEAR', label: '1 an', amount: 2718, currency: 'eur' },
];

const renderCard = (overrides: Partial<Parameters<typeof SubscriptionCard>[0]> = {}) => {
  const onPurchase = vi.fn();
  render(
    <MemoryRouter>
      <SubscriptionCard
        plans={plans}
        status={undefined}
        onPurchase={onPurchase}
        isPurchasePending={false}
        {...overrides}
      />
    </MemoryRouter>
  );
  return { onPurchase };
};

describe('SubscriptionCard', () => {
  it('selects 3 months by default and shows its total price', () => {
    renderCard();
    expect(screen.getByText('8,42 €')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^3 mois/ })).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows the per-month price and savings badge for every plan at once', () => {
    renderCard();
    expect(screen.getByText('4,42 €/mois')).toBeInTheDocument();
    expect(screen.getByText('2,81 €/mois')).toBeInTheDocument();
    expect(screen.getByText('2,27 €/mois')).toBeInTheDocument();
    expect(screen.getByText('-37%')).toBeInTheDocument();
    expect(screen.getByText('-49%')).toBeInTheDocument();
  });

  it('never claims popularity or a recommendation', () => {
    renderCard();
    expect(screen.queryByText(/populaire/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/recommandé/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/meilleur choix/i)).not.toBeInTheDocument();
  });

  it('states there is no auto-renewal', () => {
    renderCard();
    expect(screen.getByText(/Pas de renouvellement automatique/)).toBeInTheDocument();
  });

  it('switches the displayed price when another plan is selected', () => {
    renderCard();
    fireEvent.click(screen.getByRole('button', { name: /^1 an/ }));
    expect(screen.getByText('27,18 €')).toBeInTheDocument();
  });

  it('calls onPurchase with the selected plan key', () => {
    const { onPurchase } = renderCard();
    fireEvent.click(screen.getByRole('button', { name: /^1 an/ }));
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByText('Soutenir 1 an'));
    expect(onPurchase).toHaveBeenCalledWith('ONE_YEAR');
  });

  it('disables the CTA while a purchase is pending', () => {
    renderCard({ isPurchasePending: true });
    fireEvent.click(screen.getByRole('checkbox'));
    expect(screen.getByText('Soutenir 3 mois')).toBeDisabled();
  });

  it('shows the active banner and switches the CTA to "Prolonger" when already subscribed', () => {
    const status: SubscriptionStatus = { active: true, expires_at: '2026-08-21T12:00:00' };
    renderCard({ status });
    expect(screen.getByText("Actif jusqu'au 21/08.")).toBeInTheDocument();
    expect(screen.getByText('Prolonger de 3 mois')).toBeInTheDocument();
  });

  it('disables the CTA until the consent checkbox is checked', () => {
    renderCard();
    expect(screen.getByText('Soutenir 3 mois')).toBeDisabled();
    fireEvent.click(screen.getByRole('checkbox'));
    expect(screen.getByText('Soutenir 3 mois')).not.toBeDisabled();
  });

  it('links the consent checkbox label to the terms of sale', () => {
    renderCard();
    expect(screen.getByRole('link', { name: 'conditions générales de vente' })).toHaveAttribute(
      'href',
      '/terms-of-sale'
    );
  });
});
