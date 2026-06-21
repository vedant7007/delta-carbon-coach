import type {
  ActivityRepository,
  StoredActivity,
  UserProfile,
  UserRepository,
} from './types';

/**
 * In-memory repository implementations. Used when no Firestore is configured
 * (local dev, demo, E2E) so the whole app is exercisable without a live backend,
 * and as a clean test double. Each instance owns isolated, process-local state.
 */

/** Creates an isolated in-memory {@link ActivityRepository}. */
export function createInMemoryActivityRepository(): ActivityRepository {
  const byUser = new Map<string, Map<string, StoredActivity>>();
  let sequence = 0;

  const forUser = (uid: string): Map<string, StoredActivity> => {
    const existing = byUser.get(uid);
    if (existing) return existing;
    const created = new Map<string, StoredActivity>();
    byUser.set(uid, created);
    return created;
  };

  return {
    async create(uid, data) {
      sequence += 1;
      const activity: StoredActivity = { id: `mem-${sequence}`, ...data };
      forUser(uid).set(activity.id, activity);
      return activity;
    },
    async listSince(uid, sinceIso) {
      return [...forUser(uid).values()]
        .filter((activity) => activity.loggedAt >= sinceIso)
        .sort((a, b) => b.loggedAt.localeCompare(a.loggedAt));
    },
    async remove(uid, id) {
      return forUser(uid).delete(id);
    },
  };
}

/** Creates an isolated in-memory {@link UserRepository}. */
export function createInMemoryUserRepository(): UserRepository {
  const profiles = new Map<string, UserProfile>();
  return {
    async upsert(profile) {
      profiles.set(profile.uid, { ...profiles.get(profile.uid), ...profile });
    },
  };
}
