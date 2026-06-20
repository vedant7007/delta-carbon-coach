import { adminAuth } from './firebaseAdmin';
import { ApiError } from './http';

export interface AuthedUser {
  uid: string;
  email: string | null;
}

const BEARER_PATTERN = /^Bearer\s+(.+)$/i;
const E2E_UID_TOKEN_CHARS = 24;

/**
 * Verifies the Firebase ID token on the `Authorization: Bearer <token>` header.
 *
 * In E2E/test mode (`DELTA_E2E=1`) a deterministic stub user is returned so the
 * app can be exercised end-to-end without a live Firebase project.
 *
 * @param request - The incoming request; its `Authorization` header is read.
 * @returns The authenticated user's `uid` and `email`.
 * @throws ApiError(401) if the header is missing/malformed or the token is invalid.
 */
export async function requireUser(request: Request): Promise<AuthedUser> {
  const header = request.headers.get('authorization') ?? '';
  const token = BEARER_PATTERN.exec(header)?.[1]?.trim();
  if (!token) {
    throw new ApiError('unauthorized', 'Missing or malformed Authorization header');
  }

  if (process.env.DELTA_E2E === '1') {
    // Stub auth for the AI-disabled E2E walkthrough.
    return { uid: `e2e-${token.slice(0, E2E_UID_TOKEN_CHARS)}`, email: 'e2e@delta.test' };
  }

  try {
    const decoded = await adminAuth().verifyIdToken(token);
    return { uid: decoded.uid, email: decoded.email ?? null };
  } catch (err) {
    // Log the underlying reason server-side (never leaked to the client) so
    // auth failures are diagnosable.
    console.error('ID token verification failed:', err instanceof Error ? err.message : err);
    throw new ApiError('unauthorized', 'Invalid or expired session token');
  }
}
