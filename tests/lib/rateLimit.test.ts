import { describe, it, expect } from 'vitest';
import { RateLimiter } from '@/lib/server/rateLimit';

describe('RateLimiter', () => {
  it('allows up to capacity then blocks', () => {
    const rl = new RateLimiter(3);
    const t = 1000;
    expect(rl.tryConsume('k', t)).toBe(true);
    expect(rl.tryConsume('k', t)).toBe(true);
    expect(rl.tryConsume('k', t)).toBe(true);
    expect(rl.tryConsume('k', t)).toBe(false);
  });

  it('refills over time', () => {
    const rl = new RateLimiter(1, 1 / 1000); // 1 token/sec
    expect(rl.tryConsume('k', 0)).toBe(true);
    expect(rl.tryConsume('k', 0)).toBe(false);
    // After 1s a token is back.
    expect(rl.tryConsume('k', 1000)).toBe(true);
  });

  it('keeps separate buckets per key', () => {
    const rl = new RateLimiter(1);
    expect(rl.tryConsume('a', 0)).toBe(true);
    expect(rl.tryConsume('b', 0)).toBe(true);
    expect(rl.tryConsume('a', 0)).toBe(false);
  });

  it('never exceeds capacity when refilling', () => {
    const rl = new RateLimiter(2, 1);
    rl.tryConsume('k', 0); // 1 left
    // Long idle would over-refill without the cap.
    expect(rl.tryConsume('k', 1_000_000)).toBe(true);
    expect(rl.tryConsume('k', 1_000_000)).toBe(true);
    expect(rl.tryConsume('k', 1_000_000)).toBe(false);
  });
});
