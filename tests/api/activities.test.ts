import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock auth + repository so routes are tested in isolation from Firebase.
vi.mock('@/lib/server/auth', () => ({
  requireUser: vi.fn(),
}));
vi.mock('@/lib/server/repository/activityRepository', () => ({
  createActivity: vi.fn(),
  listActivitiesSince: vi.fn(),
  deleteActivity: vi.fn(),
}));

import { requireUser } from '@/lib/server/auth';
import {
  createActivity,
  listActivitiesSince,
  deleteActivity,
} from '@/lib/server/repository/activityRepository';
import { POST, GET } from '@/app/api/activities/route';
import { DELETE } from '@/app/api/activities/[id]/route';
import { ApiError } from '@/lib/server/http';

const authed = { uid: 'user-1', email: 'a@b.com' };

function req(body?: unknown, opts: { auth?: boolean; url?: string } = {}): Request {
  const { auth = true, url = 'http://localhost/api/activities' } = opts;
  return new Request(url, {
    method: body ? 'POST' : 'GET',
    headers: auth ? { authorization: 'Bearer tok', 'content-type': 'application/json' } : {},
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(requireUser).mockResolvedValue(authed);
});

describe('POST /api/activities', () => {
  it('logs a manual activity with a server-computed number (201)', async () => {
    vi.mocked(createActivity).mockImplementation(async (_uid, data) => ({
      id: 'a1',
      ...data,
    }));
    const res = await POST(req({ factorId: 'transport.car.petrol', amount: 30 }));
    expect(res.status).toBe(201);
    const json = await res.json();
    // 30 km * 0.17 = 5.1 — server recomputes, ignores any client number.
    expect(json.activity.kgCO2e).toBeCloseTo(5.1);
    expect(vi.mocked(createActivity)).toHaveBeenCalledOnce();
  });

  it('rejects an unknown factor (400 with field detail)', async () => {
    const res = await POST(req({ factorId: 'food.dragon', amount: 1 }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.code).toBe('bad_request');
    expect(json.error.fields).toHaveProperty('factorId');
  });

  it('rejects a non-positive amount (400)', async () => {
    const res = await POST(req({ factorId: 'food.beef', amount: 0 }));
    expect(res.status).toBe(400);
  });

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(requireUser).mockRejectedValue(new ApiError('unauthorized', 'no token'));
    const res = await POST(req({ factorId: 'food.beef', amount: 1 }, { auth: false }));
    expect(res.status).toBe(401);
  });

  it('returns 400 for malformed JSON', async () => {
    const bad = new Request('http://localhost/api/activities', {
      method: 'POST',
      headers: { authorization: 'Bearer tok' },
      body: '{not json',
    });
    const res = await POST(bad);
    expect(res.status).toBe(400);
  });
});

describe('GET /api/activities', () => {
  it('lists activities for the default period', async () => {
    vi.mocked(listActivitiesSince).mockResolvedValue([
      { id: 'a1', factorId: 'food.beef', amount: 1, kgCO2e: 60, loggedAt: 'x', source: 'manual' },
    ]);
    const res = await GET(req(undefined, { url: 'http://localhost/api/activities?period=week' }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.activities).toHaveLength(1);
  });

  it('rejects an invalid period (400)', async () => {
    const res = await GET(
      req(undefined, { url: 'http://localhost/api/activities?period=decade' }),
    );
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/activities/[id]', () => {
  const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

  it('deletes an owned activity', async () => {
    vi.mocked(deleteActivity).mockResolvedValue(true);
    const res = await DELETE(req(undefined, { url: 'http://localhost/api/activities/a1' }), ctx('a1'));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it('returns 404 for a missing/unowned activity', async () => {
    vi.mocked(deleteActivity).mockResolvedValue(false);
    const res = await DELETE(
      req(undefined, { url: 'http://localhost/api/activities/missing' }),
      ctx('missing'),
    );
    expect(res.status).toBe(404);
  });
});
