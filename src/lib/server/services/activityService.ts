import { computeActivityEmissions, periodStartIso, type Period } from '@/lib/engine';
import type { ActivityInput } from '@/lib/schemas';
import { ApiError } from '../http';
import { activityRepository, type StoredActivity } from '../repository';

/**
 * Service layer for activities. Business logic only; persistence is delegated to
 * the repository and all math to the engine. The server ALWAYS recomputes kg
 * CO₂e here — the client's number is never trusted or persisted.
 */

/**
 * Validates-and-persists an activity, computing its authoritative emissions.
 * @param uid - The owning user's id.
 * @param input - The validated `{ factorId, amount }` (amount in the factor's unit).
 * @param source - Whether the entry came from manual input or AI quick-log.
 * @param now - Injected clock for the `loggedAt` timestamp (keeps callers testable).
 * @returns The stored activity, including the server-computed `kgCO2e`.
 */
export async function logActivity(
  uid: string,
  input: ActivityInput,
  source: 'manual' | 'ai',
  now: Date,
): Promise<StoredActivity> {
  const { kgCO2e } = computeActivityEmissions(input);
  return activityRepository.create(uid, {
    factorId: input.factorId,
    amount: input.amount,
    kgCO2e,
    loggedAt: now.toISOString(),
    source,
  });
}

/**
 * Lists a user's activities within the given period.
 * @param uid - The owning user's id.
 * @param period - The window to list.
 * @param now - Injected clock defining the window's end.
 * @returns The activities logged within the window, newest first.
 */
export async function listActivities(
  uid: string,
  period: Period,
  now: Date,
): Promise<StoredActivity[]> {
  return activityRepository.listSince(uid, periodStartIso(period, now));
}

/**
 * Deletes an owned activity.
 * @param uid - The owning user's id (ownership is enforced by the repository path).
 * @param id - The activity id to delete.
 * @throws ApiError(404) if the activity does not exist.
 */
export async function removeActivity(uid: string, id: string): Promise<void> {
  const deleted = await activityRepository.remove(uid, id);
  if (!deleted) {
    throw new ApiError('not_found', 'Activity not found');
  }
}
