import 'vitest';
import type { AxeMatchers } from 'vitest-axe/matchers';

// Augments Vitest's expect with the axe matchers registered in tests/setup.ts.
declare module 'vitest' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface Assertion<T = unknown> extends AxeMatchers {}
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface AsymmetricMatchersContaining extends AxeMatchers {}
}
