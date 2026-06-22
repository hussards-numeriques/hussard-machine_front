import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GradeGuide } from './GradeGuide';

const config = {
  experience_per_grade: 100,
  promotion_threshold: 500,
  grades: ['BRONZE', 'SILVER', 'GOLD', 'PLATINE', 'DIAMOND'],
  levels: ['CP', 'CE1', 'SIXIEME'],
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('GradeGuide', () => {
  it('renders grades and levels from the fetched config', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => config }));
    render(<GradeGuide />);
    await waitFor(() => expect(screen.getByText('Bronze')).toBeInTheDocument());
    expect(screen.getByText('Diamant')).toBeInTheDocument();
    expect(screen.getByText('6ème')).toBeInTheDocument();
  });

  it('shows a loading indicator before config resolves', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => {}))
    );
    render(<GradeGuide />);
    expect(screen.getByText(/Chargement des seuils/i)).toBeInTheDocument();
  });
});
