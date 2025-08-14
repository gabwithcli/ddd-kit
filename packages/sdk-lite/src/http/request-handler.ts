// sdk-lite/src/http/request-handler.ts

import type * as Z from "zod";
import type { SafeParseReturnType, ZodTypeAny } from "zod";
import type { EdgeError } from "../shared/errors";
import { err, ok, type Result } from "../shared/result";

/**
 * AuthFn
 * ------
 * Reads authentication/identity info from the HTTP framework context.
 * Return:
 * - ok(payload) on success (e.g., { userId })
 * - err({ kind: "Unauthorized" }) if not authenticated
 */
export type AuthFn<C, A> = (
  c: C
) => Result<A, EdgeError> | Promise<Result<A, EdgeError>>;

/**
 * BodyReader
 * ------
 * an overridable function to read the request body
 */
export type BodyReader<C> = (c: C) => Promise<unknown>;

/**
 * makeRequestHandler
 * ------------------
 * A small reusable wrapper for HTTP request handling.
 *
 * It does three things in order:
 *  1) Auth check
 *  2) JSON body parse + Zod validate
 *  3) Map ({ c, auth, body }) -> your DTO/result
 *
 * Generics:
 *   C = framework context type (e.g., Hono Context<{ Variables: Vars }>)
 *   A = Auth payload type (e.g., { userId: string })
 *   S = Zod schema type
 *   O = Output payload type
 *
 * Why this pattern?
 * - Keeps all edge concerns in one place and consistent across routes.
 * - Makes your route handlers tiny and easy to read.
 *
 */
export function makeRequestHandler<
  C = any,
  A = unknown,
  S extends ZodTypeAny = ZodTypeAny,
  O = unknown
>(opts: {
  auth: AuthFn<C, A>;
  bodySchema: S; // any Zod schema
  map: (ctx: {
    c: C;
    auth: A;
    body: Z.infer<S>; // <- body type derives from schema
  }) => Result<O, EdgeError> | Promise<Result<O, EdgeError>>;
  readBody?: BodyReader<C>;
}) {
  const readBody: BodyReader<C> =
    opts.readBody ?? (async (c) => (c as any).req.json()); // default keeps Hono happy

  return async function requestHandler(c: C): Promise<Result<O, EdgeError>> {
    // 1) IAM / auth
    const auth = await opts.auth(c);
    if (!auth.ok) return auth;

    // 2) JSON body parsing
    let raw: unknown;
    try {
      raw = await readBody(c); // using the pluggable reader
    } catch (e) {
      return err({
        kind: "BadRequest",
        message: "Invalid JSON body",
        details: String(e),
      });
    }

    // 3) Zod validation
    const parsed = opts.bodySchema.safeParse(raw) as SafeParseReturnType<
      unknown,
      Z.infer<S>
    >;
    if (!parsed.success) {
      return err({
        kind: "BadRequest",
        message: "Invalid body",
        details: parsed.error.flatten(),
      });
    }

    // 4) Mapping to your executor DTO; may also fail (e.g., more checks)
    return opts.map({ c, auth: auth.value, body: parsed.data });
  };
}

/**
 * authFromContext("userId")
 * -------------------------
 * Convenience for reading a simple identity from the request context.
 * If the context doesn't have that key → Unauthorized.
 */
/** authFromContext("userId"): read a simple identity from c.get(key) */
type HasGet = { get: (key: string) => unknown };

export const authFromContext =
  <C extends HasGet, K extends string = "userId">(key: K = "userId" as K) =>
  (c: C): Result<{ [P in K]: string }, EdgeError> => {
    const uid = c.get(key) as string | undefined;
    return uid ? ok({ [key]: uid } as any) : err({ kind: "Unauthorized" });
  };
