import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/server/auth', () => ({ requireUser: vi.fn() }));
vi.mock('@/lib/server/services/onboardingService', () => ({ seedBaseline: vi.fn() }));

import { requireUser } from '@/lib/server/auth';
import { seedBaseline } from '@/lib/server/services/onboardingService';
import { POST } from '@/app/api/onboarding/route';
import { ApiError } from '@/lib/server/http';

function req(body: unknown, auth = true): Request {
  return new Request('http://localhost/api/onboarding', {
    method: 'POST',
    headers: auth ? { authorization: 'Bearer tok', 'content-type': 'application/json' } : {},
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(requireUser).mockResolvedValue({ uid: 'u1', email: 'a@b.com' });
});

describe('POST /api/onboarding', () => {
  it('seeds a baseline and returns 201', async () => {
    vi.mocked(seedBaseline).mockResolvedValue(4);
    const res = await POST(req({ region: 'IN', householdSize: 2, diet: 'average' }));
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ ok: true, seeded: 4 });
  });

  it('applies defaults for an empty (skipped) onboarding', async () => {
    vi.mocked(seedBaseline).mockResolvedValue(4);
    const res = await POST(req({}));
    expect(res.status).toBe(201);
  });

  it('rejects an invalid household size (400)', async () => {
    const res = await POST(req({ householdSize: 0 }));
    expect(res.status).toBe(400);
  });

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(requireUser).mockRejectedValue(new ApiError('unauthorized', 'no'));
    const res = await POST(req({}, false));
    expect(res.status).toBe(401);
  });
});
