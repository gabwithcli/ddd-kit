// ## File: packages/ddd-kit/src/http/status.ts

// This module centralizes and re-exports HTTP utilities from the `stoker` library,
// providing a single, consistent source for status codes, phrases, and other
// helpers across all applications that consume this SDK.

import type { z } from "@hono/zod-openapi";
import * as HttpStatus from "stoker/http-status-codes";
import * as HttpPhrases from "stoker/http-status-phrases";
import { z as zod } from "zod";

/**
 * openapiJsonContent: A helper function to create the `content` part of an OpenAPI request/response
 * body, ensuring the example payload is type-safe against the schema.
 *
 * @param description - Description for the OpenAPI content (required)
 * @param schema - Zod schema that defines the structure (required)
 * @param example - Optional example that matches the schema
 */

// The base schema type remains the same.
export type ZodSchema = z.ZodType;
export type ZodIssue = z.core.$ZodIssue;

// Let's define the return type once to keep things DRY.
type OpenApiContentResult<T extends ZodSchema> = {
  content: {
    "application/json": {
      schema: T;
      example?: z.input<T>;
    };
  };
  description: string;
};

// --- Function Overloads ---

// SIGNATURE 1: Called with (description, schema, example)
// This is for when you want to provide a specific payload.
function openapiJsonContent<T extends ZodSchema>(
  description: string,
  schema: T,
  example: z.input<T>
): OpenApiContentResult<T>;

// SIGNATURE 2: Called with (description, schema)
// This is the simpler version for when an example isn't needed.
function openapiJsonContent<T extends ZodSchema>(
  description: string,
  schema: T
): OpenApiContentResult<T>;

// --- The Single Implementation ---

// This is the actual function body with the new parameter order.
function openapiJsonContent<T extends ZodSchema>(
  description: string,
  schema: T,
  example?: z.input<T>
): OpenApiContentResult<T> {
  return {
    content: {
      "application/json": example ? { schema, example } : { schema },
    },
    description,
  };
}

/**
 * Creates a reusable Zod schema object for the `Idempotency-Key` header.
 * This is designed to be spread into a `z.object({})` schema.
 * @param purpose - A short, specific description of what the key prevents (e.g., "Prevents creating duplicate assets.")
 * @returns An object with the "idempotency-key" schema.
 */
const idempotencyKeyHeader = (purpose: string) => {
  const baseDescription =
    "A unique key to safely retry this request without performing the operation twice.";

  return {
    "Idempotency-Key": zod
      .string()
      .optional()
      .describe(`${baseDescription} ${purpose}`),
  };
};

export { HttpPhrases, HttpStatus, idempotencyKeyHeader, openapiJsonContent };
