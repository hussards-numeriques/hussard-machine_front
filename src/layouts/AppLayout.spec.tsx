import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AppLayout } from './AppLayout';

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<div>home content</div>} />
          <Route path="/profile" element={<div>profile content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );

describe('AppLayout', () => {
  it('shows the footer on the home page', () => {
    renderAt('/');
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('hides the footer on other pages', () => {
    renderAt('/profile');
    expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument();
  });
});
