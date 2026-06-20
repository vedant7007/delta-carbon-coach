import type { Activity } from '@/lib/engine';
import { adminDb } from '../firebaseAdmin';
import { memory, shouldUseMemoryStore } from './memoryStore';

/**
 * Data access for activities. The ONLY place Firestore reads/writes for the
 * activities subcollection happen. Routes/services depend on this module, which
 * is mocked in tests — keeping the persisted shape in exactly one location.
 *
 * Layout: users/{uid}/activities/{itemId}
 */

export interface StoredActivity extends Activity {
  kgCO2e: number;
}

export interface NewActivity {
  factorId: string;
  amount: number;
  kgCO2e: number;
  loggedAt: string;
  source: 'manual' | 'ai';
}

function activitiesCol(uid: string) {
  return adminDb().collection('users').doc(uid).collection('activities');
}

export async function createActivity(uid: string, data: NewActivity): Promise<StoredActivity> {
  if (shouldUseMemoryStore()) return memory.create(uid, data);
  const ref = await activitiesCol(uid).add(data);
  return { id: ref.id, ...data };
}

/** Activities logged at/after `sinceIso`, newest first. Composite-indexed by loggedAt. */
export async function listActivitiesSince(
  uid: string,
  sinceIso: string,
): Promise<StoredActivity[]> {
  if (shouldUseMemoryStore()) return memory.listSince(uid, sinceIso);
  const snap = await activitiesCol(uid)
    .where('loggedAt', '>=', sinceIso)
    .orderBy('loggedAt', 'desc')
    .limit(500)
    .get();

  return snap.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      factorId: String(d.factorId),
      amount: Number(d.amount),
      kgCO2e: Number(d.kgCO2e),
      loggedAt: String(d.loggedAt),
      source: d.source === 'ai' ? 'ai' : 'manual',
    };
  });
}

/** Deletes an activity if it exists and is owned by uid. Returns false if absent. */
export async function deleteActivity(uid: string, id: string): Promise<boolean> {
  if (shouldUseMemoryStore()) return memory.remove(uid, id);
  const ref = activitiesCol(uid).doc(id);
  const doc = await ref.get();
  if (!doc.exists) return false;
  await ref.delete();
  return true;
}
