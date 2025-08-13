/**
 * @acme/sdk-lite — Barrel exports
 *
 * Why a single "index" file?
 * - Consumers can import everything from one place:
 *     import { ok, withIdempotency } from "@acme/sdk-lite";
 * - Internally we keep small modules (single responsibility) and re-export them here.
 */

export * from "./shared/errors";
export * from "./shared/result";

export * from "./infra/idempotency-store";
export * from "./infra/unit-of-work";

export * from "./idempotency/types";
export * from "./idempotency/with-idempotency";

export * from "./http/request-handler";
export * from "./http/respond";

export * from "./memory/idempotency-store.memory";
export * from "./memory/unit-of-work.memory";
