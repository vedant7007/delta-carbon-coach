import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    exclude: ['e2e/**', 'node_modules/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/lib/**/*.ts', 'src/app/api/**/*.ts'],
      exclude: [
        // Thin I/O adapters / SDK wrappers — exercised via mocks, not unit-covered.
        'src/lib/server/firebaseAdmin.ts',
        'src/lib/server/repository/**',
        'src/lib/ai/client.ts',
        'src/lib/firebaseClient.ts',
        // Pure re-export barrel.
        'src/lib/engine/index.ts',
        '**/*.d.ts',
        '**/types.ts',
      ],
      thresholds: {
        // Global gates per spec §13.
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
        // The engine is the core — held to a higher bar.
        'src/lib/engine/**/*.ts': {
          lines: 95,
          functions: 95,
          branches: 90,
          statements: 95,
        },
      },
    },
  },
});
