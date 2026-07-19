import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock the next/navigation hooks which fail in jsdom test environments
vi.mock('next/navigation', () => ({
  usePathname() {
    return '/';
  },
  useRouter() {
    return {
      push: () => {},
      replace: () => {},
      prefetch: () => {},
    };
  },
}));
