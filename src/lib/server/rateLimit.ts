import { ApiError } from './http';

/**
 * In-memory token-bucket rate limiter, keyed by uid. Used to protect the AI
 * routes (10 req/min/uid by default). Single-instance scope is acceptable here:
 * Cloud Run runs with min-instances=1 and the limiter is a guard against abuse,
 * not a billing boundary.
 *
 * `now` is injected so the limiter stays pure and unit-testable.
 */
interface Bucket {
  tokens: number;
  lastRefill: number;
}

export class RateLimiter {
  private readonly buckets = new Map<string, Bucket>();

  constructor(
    private readonly capacity = 10,
    private readonly refillPerMs = 10 / 60_000, // 10 tokens per minute
  ) {}

  /** Returns true if the request is allowed and consumes a token. */
  tryConsume(key: string, now: number): boolean {
    const bucket = this.buckets.get(key) ?? { tokens: this.capacity, lastRefill: now };

    const elapsed = now - bucket.lastRefill;
    if (elapsed > 0) {
      bucket.tokens = Math.min(this.capacity, bucket.tokens + elapsed * this.refillPerMs);
      bucket.lastRefill = now;
    }

    if (bucket.tokens < 1) {
      this.buckets.set(key, bucket);
      return false;
    }

    bucket.tokens -= 1;
    this.buckets.set(key, bucket);
    return true;
  }
}

/** Shared limiter for the AI routes. */
export const aiRateLimiter = new RateLimiter();

/** Throws a 429 ApiError if the key has exhausted its budget. */
export function enforceRateLimit(key: string, limiter: RateLimiter = aiRateLimiter): void {
  if (!limiter.tryConsume(key, Date.now())) {
    throw new ApiError('rate_limited', 'Too many requests. Please wait a moment and try again.');
  }
}
