import { adminAuth } from './firebaseAdmin';
import { ApiError } from './http';

export interface AuthedUser {
  uid: string;
  email: string | null;
}

/**
 * Verifies the Firebase ID token on the `Authorization: Bearer <token>` header
 * and returns the user. Throws a 401 ApiError if missing or invalid.
 *
 * In E2E/test mode (DELTA_E2E=1) a deterministic stub user is returned so the
 * app can be exercised end-to-end without a live Firebase project.
 */
export async function requireUser(request: Request): Promise<AuthedUser> {
  const header = request.headers.get('authorization') ?? '';
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) {
    throw new ApiError('unauthorized', 'Missing or malformed Authorization header');
  }
  const token = match[1]!.trim();

  if (process.env.DELTA_E2E === '1') {
    // Stub auth for the AI-disabled E2E walkthrough.
    return { uid: `e2e-${token.slice(0, 24)}`, email: 'e2e@delta.test' };
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
