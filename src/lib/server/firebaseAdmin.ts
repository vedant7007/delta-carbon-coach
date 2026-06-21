import { cert, getApps, initializeApp, applicationDefault, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getServerConfig } from '@/lib/config/env';

/**
 * Firebase Admin singleton. On Cloud Run, Application Default Credentials are
 * used automatically (least-privilege service account with roles/datastore.user).
 * For local dev, GOOGLE_APPLICATION_CREDENTIALS may point at a service-account key.
 *
 * Excluded from coverage: thin I/O adapter, exercised via mocks in route tests.
 */

let app: App | undefined;

function getAdminApp(): App {
  if (app) return app;
  const existing = getApps();
  if (existing.length > 0 && existing[0]) {
    app = existing[0];
    return app;
  }

  const { firebaseProjectId: projectId, firebaseServiceAccount: inlineKey } = getServerConfig();

  if (inlineKey) {
    app = initializeApp({ credential: cert(JSON.parse(inlineKey)), projectId });
  } else {
    // ADC on Cloud Run, or GOOGLE_APPLICATION_CREDENTIALS locally.
    app = initializeApp({ credential: applicationDefault(), projectId });
  }
  return app;
}

export function adminAuth(): Auth {
  return getAuth(getAdminApp());
}

export function adminDb(): Firestore {
  return getFirestore(getAdminApp());
}
