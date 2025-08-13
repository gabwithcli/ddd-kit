import type { EdgeError } from "../shared/errors";
import type { Result } from "../shared/result";

/**
 * statusOf
 * --------
 * Maps an EdgeError shape into an HTTP status code.
 * Adjust this mapping per service if needed.
 */
export function statusOf(e: EdgeError): number {
  switch (e.kind) {
    case "Unauthorized":
      return 401;
    case "BadRequest":
      return 400;
    case "NotFound":
      return 404;
    case "InvariantViolation":
      return 422; // semantic rule failed
    case "Conflict":
      return 409;
    case "Infrastructure":
      return 503;
    default:
      return 400;
  }
}

/**
 * respond
 * -------
 * Turn a Result<T, EdgeError> into an HTTP response using your framework's "c".
 * - Success → json(value, successStatus)
 * - Error   → json({ error }, statusOf(error))
 *
 * This keeps route handlers tiny and consistent.
 */
export function respond<T>(
  c: any,
  r: Result<T, EdgeError>,
  successStatus = 200
) {
  return r.ok
    ? c.json(r.value, successStatus)
    : c.json({ error: r.error }, statusOf(r.error));
}
