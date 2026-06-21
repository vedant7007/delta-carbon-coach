import { describe, it, expect } from 'vitest';
import {
  createInMemoryActivityRepository,
  createInMemoryUserRepository,
} from '@/lib/server/repository/memory';
import type { NewActivity } from '@/lib/server/repository/types';

function activity(loggedAt: string, factorId = 'food.beef'): NewActivity {
  return { factorId, amount: 1, kgCO2e: 60, loggedAt, source: 'manual' };
}

describe('in-memory activity repository', () => {
  it('creates, lists newest-first, filters by since, and removes', async () => {
    const repo = createInMemoryActivityRepository();
    const first = await repo.create('u1', activity('2026-06-20T00:00:00.000Z'));
    await repo.create('u1', activity('2026-06-21T00:00:00.000Z', 'food.rice'));

    const all = await repo.listSince('u1', '2026-06-01T00:00:00.000Z');
    expect(all).toHaveLength(2);
    expect(all[0]!.loggedAt > all[1]!.loggedAt).toBe(true); // newest first

    const recent = await repo.listSince('u1', '2026-06-21T00:00:00.000Z');
    expect(recent).toHaveLength(1);

    expect(await repo.remove('u1', first.id)).toBe(true);
    expect(await repo.remove('u1', 'missing')).toBe(false);
  });

  it('isolates state between users', async () => {
    const repo = createInMemoryActivityRepository();
    await repo.create('u1', activity('2026-06-20T00:00:00.000Z'));
    expect(await repo.listSince('u2', '2000-01-01T00:00:00.000Z')).toHaveLength(0);
  });
});

describe('in-memory user repository', () => {
  it('upserts and merges a profile without throwing', async () => {
    const repo = createInMemoryUserRepository();
    await repo.upsert({ uid: 'u1', email: 'a@b.com', createdAt: 'x' });
    await expect(
      repo.upsert({ uid: 'u1', email: 'c@d.com', createdAt: 'y' }),
    ).resolves.toBeUndefined();
  });
});
