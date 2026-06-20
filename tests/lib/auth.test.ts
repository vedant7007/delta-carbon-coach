import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const verifyIdToken = vi.fn();
vi.mock('@/lib/server/firebaseAdmin', () => ({
  adminAuth: () => ({ verifyIdToken }),
}));

import { requireUser } from '@/lib/server/auth';

const ORIGINAL_ENV = { ...process.env };

function withAuth(token?: string): Request {
  return new Request('http://x', {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env = { ...ORIGINAL_ENV, DELTA_E2E: '' };
});
afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe('requireUser', () => {
  it('rejects a missing Authorization header (401)', async () => {
    await expect(requireUser(withAuth())).rejects.toMatchObject({ code: 'unauthorized' });
  });

  it('verifies a valid token and returns the uid + email', async () => {
    verifyIdToken.mockResolvedValue({ uid: 'abc', email: 'x@y.com' });
    await expect(requireUser(withAuth('good'))).resolves.toEqual({ uid: 'abc', email: 'x@y.com' });
  });

  it('maps a missing email to null', async () => {
    verifyIdToken.mockResolvedValue({ uid: 'abc' });
    await expect(requireUser(withAuth('good'))).resolves.toEqual({ uid: 'abc', email: null });
  });

  it('rejects an invalid/expired token (401)', async () => {
    verifyIdToken.mockRejectedValue(new Error('expired'));
    await expect(requireUser(withAuth('bad'))).rejects.toMatchObject({ code: 'unauthorized' });
  });

  it('returns a deterministic stub user in E2E mode (no Firebase call)', async () => {
    process.env.DELTA_E2E = '1';
    const user = await requireUser(withAuth('sometoken'));
    expect(user.uid).toMatch(/^e2e-/);
    expect(verifyIdToken).not.toHaveBeenCalled();
  });
});
