import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/server/auth', () => ({ requireUser: vi.fn() }));
vi.mock('@/lib/server/repository', () => ({
  activityRepository: { listSince: vi.fn() },
}));

import { requireUser } from '@/lib/server/auth';
import { activityRepository, type StoredActivity } from '@/lib/server/repository';
import { GET as summaryGET } from '@/app/api/footprint/summary/route';
import { GET as insightsGET } from '@/app/api/insights/route';
import { POST as simulatePOST } from '@/app/api/simulate/route';
import { ApiError } from '@/lib/server/http';

const listSince = vi.mocked(activityRepository.listSince);

const now = new Date('2026-06-19T12:00:00.000Z');

function authReq(url: string, body?: unknown): Request {
  return new Request(url, {
    method: body ? 'POST' : 'GET',
    headers: { authorization: 'Bearer tok', 'content-type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

function act(factorId: string, amount: number, id: string): StoredActivity {
  return {
    id,
    factorId,
    amount,
    kgCO2e: 0,
    loggedAt: now.toISOString(),
    source: 'manual',
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(requireUser).mockResolvedValue({ uid: 'u1', email: null });
});

describe('GET /api/footprint/summary', () => {
  it('returns totals, breakdown, trend and a regional average', async () => {
    listSince.mockResolvedValue([
      act('transport.car.petrol', 100, 'a'),
      act('food.beef', 1, 'b'),
    ]);
    const res = await summaryGET(authReq('http://localhost/api/footprint/summary?period=week'));
    expect(res.status).toBe(200);
    expect(res.headers.get('Cache-Control')).toContain('private');
    const json = await res.json();
    expect(json.total).toBeCloseTo(77);
    expect(json.byCategory.transport).toBeCloseTo(17);
    expect(json.byCategory.food).toBeCloseTo(60);
    expect(json.trend).toHaveLength(7);
    expect(json.regionalAvg).toBeGreaterThan(0);
  });

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(requireUser).mockRejectedValue(new ApiError('unauthorized', 'no'));
    const res = await summaryGET(authReq('http://localhost/api/footprint/summary'));
    expect(res.status).toBe(401);
  });

  it('rejects an invalid period (400)', async () => {
    const res = await summaryGET(
      authReq('http://localhost/api/footprint/summary?period=eon'),
    );
    expect(res.status).toBe(400);
  });
});

describe('GET /api/insights', () => {
  it('ranks actions from the logged data', async () => {
    listSince.mockResolvedValue([act('food.beef', 1, 'a')]);
    const res = await insightsGET(authReq('http://localhost/api/insights?period=week'));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.actions.length).toBeGreaterThan(0);
    expect(json.actions[0].annualKgSaved).toBeGreaterThan(0);
  });

  it('returns an empty list with no data', async () => {
    listSince.mockResolvedValue([]);
    const res = await insightsGET(authReq('http://localhost/api/insights'));
    const json = await res.json();
    expect(json.actions).toEqual([]);
  });
});

describe('POST /api/simulate', () => {
  it('authoritatively recomputes against the user data', async () => {
    listSince.mockResolvedValue([act('transport.car.petrol', 100, 'a')]);
    const res = await simulatePOST(
      authReq('http://localhost/api/simulate?period=week', {
        adjustments: [{ factorId: 'transport.car.petrol', scale: 0 }],
      }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.before).toBeCloseTo(17);
    expect(json.after).toBeCloseTo(0);
    expect(json.deltaPct).toBeCloseTo(-100);
  });

  it('rejects an unknown factor in an adjustment (400)', async () => {
    const res = await simulatePOST(
      authReq('http://localhost/api/simulate', {
        adjustments: [{ factorId: 'transport.warp', scale: 0 }],
      }),
    );
    expect(res.status).toBe(400);
  });
});
