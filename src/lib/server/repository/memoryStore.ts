import type { StoredActivity, NewActivity } from './activityRepository';
import type { UserProfile } from './userRepository';

/**
 * Process-local, in-memory data store. Used when Firebase is not configured
 * (local dev, demo, E2E) so the entire app is exercisable without a live
 * Firestore. Production with a configured project uses Firestore instead.
 */
const activities = new Map<string, Map<string, StoredActivity>>();
const profiles = new Map<string, UserProfile>();
let seq = 0;

/** True when there's no Firestore to talk to, or we're in E2E mode. */
export function shouldUseMemoryStore(): boolean {
  if (process.env.DELTA_E2E === '1') return true;
  const projectId = process.env.FIREBASE_PROJECT_ID ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  return !projectId;
}

function userActivities(uid: string): Map<string, StoredActivity> {
  let map = activities.get(uid);
  if (!map) {
    map = new Map();
    activities.set(uid, map);
  }
  return map;
}

export const memory = {
  create(uid: string, data: NewActivity): StoredActivity {
    seq += 1;
    const id = `mem-${seq}`;
    const activity: StoredActivity = { id, ...data };
    userActivities(uid).set(id, activity);
    return activity;
  },
  listSince(uid: string, sinceIso: string): StoredActivity[] {
    return [...userActivities(uid).values()]
      .filter((a) => a.loggedAt >= sinceIso)
      .sort((a, b) => b.loggedAt.localeCompare(a.loggedAt));
  },
  remove(uid: string, id: string): boolean {
    return userActivities(uid).delete(id);
  },
  upsertProfile(profile: UserProfile): void {
    profiles.set(profile.uid, { ...profiles.get(profile.uid), ...profile });
  },
};
