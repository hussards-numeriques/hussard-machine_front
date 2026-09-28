import '@testing-library/jest-dom';
import { vi } from 'vitest';

window.matchMedia ??= vi.fn().mockReturnValue({ matches: false });
