import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Mascot } from './index';
import type { MascotPose } from './index';

const POSES: MascotPose[] = ['joyeux', 'determine', 'clindoeil', 'champion', 'tete'];

describe('Mascot', () => {
  it.each(POSES)('renders the %s pose as an svg with a data-pose marker', (pose) => {
    const { container } = render(<Mascot pose={pose} />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute('data-pose')).toBe(pose);
    expect(svg?.getAttribute('viewBox')).toBe('0 0 256 256');
  });

  it('defaults to the joyeux pose', () => {
    const { container } = render(<Mascot />);
    expect(container.querySelector('svg')?.getAttribute('data-pose')).toBe('joyeux');
  });

  it('exposes an accessible title when provided', () => {
    const { getByTitle } = render(<Mascot title="Rushy la mascotte" />);
    expect(getByTitle('Rushy la mascotte')).toBeTruthy();
  });

  it('applies the requested size to width and height', () => {
    const { container } = render(<Mascot size={128} />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('128');
    expect(svg?.getAttribute('height')).toBe('128');
  });
});
