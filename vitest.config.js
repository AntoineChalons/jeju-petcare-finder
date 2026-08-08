// Vitest configuration. Node environment on purpose: every module under
// test (`src/filters.js`, `src/state.js`) is pure logic with no DOM
// dependency, so we don't pay the jsdom startup cost. DOM tests, if we
// ever add them, will live in a separate config (see issue #20).
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.js'],
    environment: 'node',
  },
});
