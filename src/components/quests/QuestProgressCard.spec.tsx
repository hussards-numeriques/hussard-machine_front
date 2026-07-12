import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { QuestProgressCard } from './QuestProgressCard';
import type { MyQuest, Quest } from '../../services/quests';

const quest: Quest = {
  id: 'win-streak',
  label: "Terminer 1er en parties d'affilée",
  tiers: [
    {
      threshold: 5,
      title: { id: 'win-streak-bronze', label: 'Petit Conquérant', rarity: 'BRONZE' },
    },
    { threshold: 10, title: { id: 'win-streak-silver', label: 'Top Player', rarity: 'SILVER' } },
  ],
};

const progress: MyQuest = {
  id: 'win-streak',
  label: quest.label,
  progress: 7,
  tiers: [
    { threshold: 5, title_id: 'win-streak-bronze', unlocked: true },
    { threshold: 10, title_id: 'win-streak-silver', unlocked: false },
  ],
};

describe('QuestProgressCard', () => {
  it('shows an Équiper button on unlocked tiers and no button on locked tiers', () => {
    render(
      <QuestProgressCard
        quest={quest}
        progress={progress}
        selectedTitleId={null}
        onEquip={vi.fn()}
        isPending={false}
      />
    );

    expect(screen.getByText('Équiper')).toBeInTheDocument();
    expect(screen.getByText('Top Player (10)')).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });

  it('shows Équipé and calls onEquip(null) when the equipped tier is clicked', () => {
    const onEquip = vi.fn();
    render(
      <QuestProgressCard
        quest={quest}
        progress={progress}
        selectedTitleId="win-streak-bronze"
        onEquip={onEquip}
        isPending={false}
      />
    );

    fireEvent.click(screen.getByText('✓ Équipé'));
    expect(onEquip).toHaveBeenCalledWith(null);
  });

  it('calls onEquip with the tier title id when Équiper is clicked', () => {
    const onEquip = vi.fn();
    render(
      <QuestProgressCard
        quest={quest}
        progress={progress}
        selectedTitleId={null}
        onEquip={onEquip}
        isPending={false}
      />
    );

    fireEvent.click(screen.getByText('Équiper'));
    expect(onEquip).toHaveBeenCalledWith('win-streak-bronze');
  });
});
