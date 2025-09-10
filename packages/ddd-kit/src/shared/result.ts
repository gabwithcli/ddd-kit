// ## File: packages/ddd-kit/src/shared/result.ts

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

import z from "zod";
// Import the single source of truth for error kinds.
import { EDGE_ERROR_KINDS } from "./errors";

export type Ok<T> = { ok: true; value: T };
export type Err<E> = { ok: false; error: E };
export type Result<T, E = any> = Ok<T> | Err<E>;

/** Wrap a value into a success Result. */
export const ok = <T>(value: T): Ok<T> => ({ ok: true, value });

/** Wrap an error payload into a failure Result. */
export const err = <E>(error: E): Err<E> => ({ ok: false, error });

// --- Standardized OpenAPI Schemas ---

/**
 * A standard Zod schema for successful API responses, typically used with HTTP 2xx statuses.
 * It provides a consistent shape that clients can rely on.
 */
export const SuccessResponseSchema = z.object({
  id: z.string().describe("The unique identifier of the resource."),
  ok: z.boolean().optional().describe("Indicates success."),
});

/**
 * A standard Zod schema for client-side API errors, mapping directly to the `EdgeError` type.
 * This is used for generating consistent OpenAPI documentation for HTTP 4xx/5xx responses.
 */
export const ErrorResponseSchema = z.object({
  // By using the imported EDGE_ERROR_KINDS constant, this enum will now
  // update automatically whenever you change the source array in errors.ts.
  kind: z.enum(EDGE_ERROR_KINDS).describe("The category of the error."),
  message: z.string().describe("A human-readable error message."),
  details: z.any().optional().describe("Optional structured error details."),
});

// --- EXPORTED TYPES ---

/**
 * A TypeScript type representing a standardized successful API response payload.
 * Inferred directly from the Zod schema for 100% consistency.
 */
export type SuccessResponse = z.infer<typeof SuccessResponseSchema>;

/**
 * A TypeScript type representing a standardized error API response payload.
 * Inferred directly from the Zod schema.
 */
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
