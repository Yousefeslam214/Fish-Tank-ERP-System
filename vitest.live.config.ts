import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/tests/**/*.live.test.ts'],
    testTimeout: 45000,
    hookTimeout: 45000,
  },
});
