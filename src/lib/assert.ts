/**
 * Compile-time exhaustiveness guard. Calling this in a `switch`'s default branch
 * makes TypeScript fail the build if a union member is left unhandled — and
 * throws at runtime if an impossible value ever slips through.
 *
 * @param value - The value that should be of type `never` if all cases are handled.
 * @throws Always, since reaching it means a union case was missed.
 */
export function assertNever(value: never): never {
  throw new Error(`Unhandled union member: ${String(value)}`);
}
