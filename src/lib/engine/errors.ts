/**
 * Typed engine errors. The engine throws these rather than a bare `Error` so a
 * failure's cause is a discriminable type, not a string to match on. They signal
 * programmer errors (the server validates user input before calling the engine),
 * which the route layer maps to a generic 500.
 */

/** Base class for all engine failures. */
export abstract class EngineError extends Error {
  protected constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/** Thrown when a factor id does not exist in the dataset. */
export class UnknownFactorError extends EngineError {
  constructor(readonly factorId: string) {
    super(`Unknown emission factor: "${factorId}"`);
  }
}

/** Thrown when a pre-resolved factor doesn't match the activity it's used for. */
export class FactorMismatchError extends EngineError {
  constructor(
    readonly expectedFactorId: string,
    readonly receivedFactorId: string,
  ) {
    super(
      `Factor mismatch: activity references "${expectedFactorId}" but factor is "${receivedFactorId}"`,
    );
  }
}

/** Thrown when a numeric input (amount, scale, period total) is out of range. */
export class InvalidValueError extends EngineError {
  constructor(message: string) {
    super(message);
  }
}
