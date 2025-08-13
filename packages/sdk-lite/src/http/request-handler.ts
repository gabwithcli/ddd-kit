import type { z } from "zod";
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
export type AuthFn<A> = (
  c: any
) => Result<A, EdgeError> | Promise<Result<A, EdgeError>>;

/**
 * BodyReader
 * ------
 * an overridable function to read the request body
 */
export type BodyReader = (c: any) => Promise<unknown>;

/**
 * makeRequestHandler
 * ------------------
 * A small reusable wrapper for HTTP request handling.
 * It does three things in order:
 *  1) Auth check
 *  2) Parse + validate JSON body with Zod
 *  3) Map ({ auth, body }) → your executor's DTO (Result again)
 *
 * Why this pattern?
 * - Keeps all edge concerns in one place and consistent across routes.
 * - Makes your route handlers tiny and easy to read.
 */
export function makeRequestHandler<A, B, O>(opts: {
  auth: AuthFn<A>;
  bodySchema: z.ZodType<B>;
  map: (ctx: {
    c: any;
    auth: A;
    body: B;
  }) => Result<O, EdgeError> | Promise<Result<O, EdgeError>>;
  readBody?: BodyReader;
}) {
  const readBody: BodyReader =
    opts.readBody ?? (async (c) => await c.req.json()); // default keeps Hono happy

  return async function requestHandler(c: any): Promise<Result<O, EdgeError>> {
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
    const parsed = opts.bodySchema.safeParse(raw);
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
export const authFromContext =
  <K extends string = "userId">(key: K = "userId" as K) =>
  (c: any): Result<{ [P in K]: string }, EdgeError> => {
    const uid = c.get(key) as string | undefined;
    return uid ? ok({ [key]: uid } as any) : err({ kind: "Unauthorized" });
  };
