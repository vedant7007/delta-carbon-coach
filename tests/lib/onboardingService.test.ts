import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/server/repository', () => ({
  activityRepository: { create: vi.fn() },
  userRepository: { upsert: vi.fn() },
}));

import { activityRepository, userRepository } from '@/lib/server/repository';
import { seedBaseline } from '@/lib/server/services/onboardingService';
import { onboardingSchema } from '@/lib/schemas';

const create = vi.mocked(activityRepository.create);
const upsert = vi.mocked(userRepository.upsert);

beforeEach(() => vi.clearAllMocks());

describe('seedBaseline', () => {
  it('persists one activity per seed and writes the profile', async () => {
    create.mockResolvedValue({
      id: 'x',
      factorId: 'food.rice',
      amount: 0.15,
      kgCO2e: 0,
      loggedAt: 'x',
      source: 'manual',
    });
    upsert.mockResolvedValue(undefined);

    const now = new Date('2026-06-19T00:00:00.000Z');
    const count = await seedBaseline('u1', 'a@b.com', onboardingSchema.parse({}), now);

    expect(count).toBeGreaterThan(0);
    expect(create).toHaveBeenCalledTimes(count);
    // Server computes kgCO2e for every seed.
    for (const call of create.mock.calls) {
      expect(call[1]).toHaveProperty('kgCO2e');
      expect(call[1].kgCO2e).toBeGreaterThanOrEqual(0);
      expect(call[1].loggedAt).toBe(now.toISOString());
    }
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ uid: 'u1', email: 'a@b.com' }),
    );
  });
});
