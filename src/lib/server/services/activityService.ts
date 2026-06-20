import { computeActivityEmissions, periodStartIso, type Period } from '@/lib/engine';
import type { ActivityInput } from '@/lib/schemas';
import {
  createActivity,
  deleteActivity,
  listActivitiesSince,
  type StoredActivity,
} from '../repository/activityRepository';
import { ApiError } from '../http';

/**
 * Business logic for activities. The server ALWAYS recomputes kg CO₂e from the
 * engine — the client number is never trusted or persisted.
 */
export async function logActivity(
  uid: string,
  input: ActivityInput,
  source: 'manual' | 'ai',
  now: Date,
): Promise<StoredActivity> {
  const { kgCO2e } = computeActivityEmissions(input);
  return createActivity(uid, {
    factorId: input.factorId,
    amount: input.amount,
    kgCO2e,
    loggedAt: now.toISOString(),
    source,
  });
}

export async function listActivities(
  uid: string,
  period: Period,
  now: Date,
): Promise<StoredActivity[]> {
  return listActivitiesSince(uid, periodStartIso(period, now));
}

export async function removeActivity(uid: string, id: string): Promise<void> {
  const deleted = await deleteActivity(uid, id);
  if (!deleted) {
    throw new ApiError('not_found', 'Activity not found');
  }
}
