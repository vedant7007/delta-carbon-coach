import { describe, it, expect } from 'vitest';
import { assertNever } from '@/lib/assert';

describe('assertNever', () => {
  it('throws when an unhandled union member is reached', () => {
    expect(() => assertNever('unexpected' as never)).toThrow(/Unhandled union member/);
  });
});
