/**
 * Result type helpers
 * -------------------
 * A tiny alternative to exceptions: every function can return either:
 * - ok(value): success path
 * - err(error): failure path
 *
 * Why?
 * - Callers can handle both outcomes explicitly.
 * - Easier to test and to map into HTTP responses later.
 */

export type Ok<T> = { ok: true; value: T };
export type Err<E> = { ok: false; error: E };
export type Result<T, E = any> = Ok<T> | Err<E>;

/** Wrap a value into a success Result. */
export const ok = <T>(value: T): Ok<T> => ({ ok: true, value });

/** Wrap an error payload into a failure Result. */
export const err = <E>(error: E): Err<E> => ({ ok: false, error });

