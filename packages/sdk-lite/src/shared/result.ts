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

/* 

--- --- --- --- --- --- --- --- --- ---
--- --- --- --- --- --- --- --- --- ---



from previous code:
^^ consider renaming value to error 

what about tryCatch?



--- --- --- --- --- --- --- --- --- ---
--- --- --- --- --- --- --- --- --- ---

export type Right<T> = {
  data: T;
  error: null;
};

export type Left<E> = {
  data: null;
  error: E;
};

export type Either<T, E> = Right<T> | Left<E>;

export function isRight<T, E>(either: Either<T, E>): either is Right<T> {
  return either.error === null;
}

export function isLeft<T, E>(either: Either<T, E>): either is Left<E> {
  return either.data === null;
}

export async function tryCatch<T, E = Error>(
  fn: Promise<T>
): Promise<Either<T, E>> {
  try {
    const data = await fn;
    return { data: data as T, error: null };
  } catch (error) {
    return { data: null, error: error as E };
  }
}

--- --- --- --- --- --- --- --- --- ---
--- --- --- --- --- --- --- --- --- ---



*/
