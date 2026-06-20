import { describe, it, expect, vi, beforeEach } from 'vitest';

const createActivity = vi.fn();
const upsertUserProfile = vi.fn();
vi.mock('@/lib/server/repository/activityRepository', () => ({
  createActivity: (...a: unknown[]) => createActivity(...a),
}));
vi.mock('@/lib/server/repository/userRepository', () => ({
  upsertUserProfile: (...a: unknown[]) => upsertUserProfile(...a),
}));

import { seedBaseline } from '@/lib/server/services/onboardingService';
import { onboardingSchema } from '@/lib/schemas';

beforeEach(() => vi.clearAllMocks());

describe('seedBaseline', () => {
  it('persists one activity per seed and writes the profile', async () => {
    createActivity.mockResolvedValue({ id: 'x' });
    upsertUserProfile.mockResolvedValue(undefined);

    const now = new Date('2026-06-19T00:00:00.000Z');
    const count = await seedBaseline('u1', 'a@b.com', onboardingSchema.parse({}), now);

    expect(count).toBeGreaterThan(0);
    expect(createActivity).toHaveBeenCalledTimes(count);
    // Server computes kgCO2e for every seed.
    for (const call of createActivity.mock.calls) {
      expect(call[1]).toHaveProperty('kgCO2e');
      expect(call[1].kgCO2e).toBeGreaterThanOrEqual(0);
      expect(call[1].loggedAt).toBe(now.toISOString());
    }
    expect(upsertUserProfile).toHaveBeenCalledWith(
      expect.objectContaining({ uid: 'u1', email: 'a@b.com' }),
    );
  });
});
