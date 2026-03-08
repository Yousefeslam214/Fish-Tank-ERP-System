import { mergeConfig } from 'vite';
import { defineConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/tests/**/*.test.ts', 'src/tests/**/*.test.tsx'],
      exclude: ['src/tests/**/*.live.test.ts'],
      clearMocks: true,
      css: false,
    },
  }),
);
