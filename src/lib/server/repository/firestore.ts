import type { DocumentData } from 'firebase-admin/firestore';
import { adminDb } from '../firebaseAdmin';
import type {
  ActivityRepository,
  StoredActivity,
  UserProfile,
  UserRepository,
} from './types';

/**
 * Firestore-backed repository implementations. The ONLY place Firestore reads
 * and writes happen — the Admin SDK (via ADC) bypasses the deny-all client rules.
 */

/** Most recent activities to load per query (a sane page bound). */
const MAX_ACTIVITIES = 500;

function activitiesCol(uid: string) {
  return adminDb().collection('users').doc(uid).collection('activities');
}

/** Maps an untyped Firestore document to a typed StoredActivity at the boundary. */
function toStoredActivity(id: string, data: DocumentData): StoredActivity {
  return {
    id,
    factorId: String(data.factorId),
    amount: Number(data.amount),
    kgCO2e: Number(data.kgCO2e),
    loggedAt: String(data.loggedAt),
    source: data.source === 'ai' ? 'ai' : 'manual',
  };
}

export const firestoreActivityRepository: ActivityRepository = {
  async create(uid, data) {
    const ref = await activitiesCol(uid).add(data);
    return { id: ref.id, ...data };
  },

  async listSince(uid, sinceIso) {
    const snapshot = await activitiesCol(uid)
      .where('loggedAt', '>=', sinceIso)
      .orderBy('loggedAt', 'desc')
      .limit(MAX_ACTIVITIES)
      .get();
    return snapshot.docs.map((doc) => toStoredActivity(doc.id, doc.data()));
  },

  async remove(uid, id) {
    const ref = activitiesCol(uid).doc(id);
    const doc = await ref.get();
    if (!doc.exists) return false;
    await ref.delete();
    return true;
  },
};

export const firestoreUserRepository: UserRepository = {
  async upsert(profile: UserProfile) {
    await adminDb().collection('users').doc(profile.uid).set(profile, { merge: true });
  },
};
